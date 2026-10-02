-- Add 'archived' status to lobbies
-- Allows marking completed lobbies as archived for history tracking

ALTER TABLE public.lobbies
DROP CONSTRAINT "lobbies_status_check",
ADD CONSTRAINT "lobbies_status_check" CHECK (status = ANY(ARRAY['open', 'full', 'in_progress', 'completed', 'archived', 'cancelled']));
