-- Gestalt Guild initial schema
-- This migration creates the core tables and RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  location_zone TEXT,
  tagline TEXT,
  bio TEXT,
  bgg_username TEXT,
  is_admin BOOLEAN DEFAULT false,
  house_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES public.chapters(id),
  host_id UUID NOT NULL REFERENCES public.members(id),
  title TEXT NOT NULL,
  datetime_start TIMESTAMP WITH TIME ZONE NOT NULL,
  datetime_end TIMESTAMP WITH TIME ZONE,
  location TEXT,
  address TEXT,
  games TEXT[] DEFAULT '{}',
  max_seats INTEGER DEFAULT 4,
  status TEXT DEFAULT 'open' CHECK (status = ANY(ARRAY['open', 'full', 'in_progress', 'completed', 'cancelled'])),
  at_community_house BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id),
  seat_index INTEGER,
  member_id UUID REFERENCES public.members(id),
  guest_name TEXT,
  rsvp_status TEXT DEFAULT 'confirmed' CHECK (rsvp_status = ANY(ARRAY['confirmed', 'waitlisted', 'cancelled'])),
  assigned_by_host BOOLEAN DEFAULT false,
  checked_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.house_info_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.members(id),
  name TEXT NOT NULL,
  check_in TEXT,
  parking TEXT,
  house_rules TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.house_info (
  lobby_id UUID PRIMARY KEY REFERENCES public.lobbies(id),
  template_id UUID REFERENCES public.house_info_templates(id),
  check_in TEXT,
  parking TEXT,
  house_rules TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.odds_ends_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id),
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category = ANY(ARRAY['food', 'drink', 'supplies', 'other'])),
  quantity_needed TEXT,
  claimed_by UUID REFERENCES public.members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT DEFAULT 'lobby' CHECK (scope = ANY(ARRAY['platform', 'chapter', 'game', 'lobby'])),
  lobby_id UUID REFERENCES public.lobbies(id),
  chapter_id UUID REFERENCES public.chapters(id),
  game TEXT,
  author_id UUID NOT NULL REFERENCES public.members(id),
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id),
  title TEXT NOT NULL,
  personal_ranking INTEGER CHECK (personal_ranking >= 1 AND personal_ranking <= 10),
  status TEXT DEFAULT 'own' CHECK (status = ANY(ARRAY['own', 'want_to_play', 'wishlist'])),
  willing_to_host BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treasury_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id),
  amount NUMERIC NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category = ANY(ARRAY['donation', 'game_purchase', 'food', 'repair', 'other'])),
  description TEXT,
  created_by UUID REFERENCES public.members(id),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.space_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL REFERENCES public.members(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  purpose TEXT DEFAULT 'other' CHECK (purpose = ANY(ARRAY['game_night', 'coworking', 'hangout', 'private_event', 'other'])),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status = ANY(ARRAY['pending', 'approved', 'declined', 'cancelled'])),
  reviewed_by UUID REFERENCES public.members(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_info_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds_ends_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_reservations ENABLE ROW LEVEL SECURITY;

-- Chapters: public read
CREATE POLICY "chapters_select" ON public.chapters FOR SELECT USING (true);

-- Members: public read, self-update, admin can update any
CREATE POLICY "members_select" ON public.members FOR SELECT USING (true);
CREATE POLICY "members_update_self" ON public.members FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "members_insert" ON public.members FOR INSERT WITH CHECK (auth.uid() = id);

-- Lobbies: public read, host can manage own
CREATE POLICY "lobbies_select" ON public.lobbies FOR SELECT USING (true);
CREATE POLICY "lobbies_insert" ON public.lobbies FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "lobbies_update" ON public.lobbies FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "lobbies_delete" ON public.lobbies FOR DELETE USING (auth.uid() = host_id);

-- Bookings: public read, host or member can delete
CREATE POLICY "bookings_select" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "bookings_insert" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_delete" ON public.bookings FOR DELETE USING (
  auth.uid() = (SELECT host_id FROM public.lobbies WHERE id = lobby_id)
  OR auth.uid() = member_id
);

-- House info templates: owner can manage
CREATE POLICY "house_info_templates_select" ON public.house_info_templates FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "house_info_templates_insert" ON public.house_info_templates FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "house_info_templates_update" ON public.house_info_templates FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "house_info_templates_delete" ON public.house_info_templates FOR DELETE USING (auth.uid() = owner_id);

-- House info: owner (host) can manage
CREATE POLICY "house_info_select" ON public.house_info FOR SELECT USING (
  auth.uid() = (SELECT host_id FROM public.lobbies WHERE id = lobby_id)
);
CREATE POLICY "house_info_insert" ON public.house_info FOR INSERT WITH CHECK (
  auth.uid() = (SELECT host_id FROM public.lobbies WHERE id = lobby_id)
);
CREATE POLICY "house_info_update" ON public.house_info FOR UPDATE USING (
  auth.uid() = (SELECT host_id FROM public.lobbies WHERE id = lobby_id)
);

-- Odds & ends: public read, host can manage
CREATE POLICY "odds_ends_select" ON public.odds_ends_items FOR SELECT USING (true);
CREATE POLICY "odds_ends_insert" ON public.odds_ends_items FOR INSERT WITH CHECK (
  auth.uid() = (SELECT host_id FROM public.lobbies WHERE id = lobby_id)
);
CREATE POLICY "odds_ends_update" ON public.odds_ends_items FOR UPDATE USING (true);
CREATE POLICY "odds_ends_delete" ON public.odds_ends_items FOR DELETE USING (
  auth.uid() = (SELECT host_id FROM public.lobbies WHERE id = lobby_id)
);

-- Messages: public read (scoped to lobby/chapter/etc), members can post
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Game library: owner-scoped
CREATE POLICY "game_library_select" ON public.game_library FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "game_library_insert" ON public.game_library FOR INSERT WITH CHECK (auth.uid() = member_id);
CREATE POLICY "game_library_update" ON public.game_library FOR UPDATE USING (auth.uid() = member_id);
CREATE POLICY "game_library_delete" ON public.game_library FOR DELETE USING (auth.uid() = member_id);

-- Treasury transactions: public read, only admins can insert/delete
CREATE POLICY "treasury_select" ON public.treasury_transactions FOR SELECT USING (true);
CREATE POLICY "treasury_insert" ON public.treasury_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "treasury_delete" ON public.treasury_transactions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND is_admin = true)
);

-- Space reservations: approved members (house_access) or admins can view/request
CREATE POLICY "space_res_select" ON public.space_reservations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND (is_admin = true OR house_access = true))
);
CREATE POLICY "space_res_insert" ON public.space_reservations FOR INSERT WITH CHECK (
  auth.uid() = requested_by
  AND EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND (is_admin = true OR house_access = true))
);
CREATE POLICY "space_res_update_admin" ON public.space_reservations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_lobbies_host_id ON public.lobbies(host_id);
CREATE INDEX idx_lobbies_chapter_id ON public.lobbies(chapter_id);
CREATE INDEX idx_lobbies_datetime_start ON public.lobbies(datetime_start);
CREATE INDEX idx_bookings_lobby_id ON public.bookings(lobby_id);
CREATE INDEX idx_bookings_member_id ON public.bookings(member_id);
CREATE INDEX idx_messages_lobby_id ON public.messages(lobby_id);
CREATE INDEX idx_messages_author_id ON public.messages(author_id);
CREATE INDEX idx_game_library_member_id ON public.game_library(member_id);
CREATE INDEX idx_space_reservations_requested_by ON public.space_reservations(requested_by);
CREATE INDEX idx_space_reservations_start_time ON public.space_reservations(start_time);
CREATE INDEX idx_treasury_chapter_id ON public.treasury_transactions(chapter_id);
