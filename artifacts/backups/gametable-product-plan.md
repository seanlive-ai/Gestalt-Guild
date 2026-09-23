# GameTable Product Plan (Rev 0.3)

**Last Updated:** September 22, 2026  
**Status:** Active Development  
**Phase:** 1 (Marathon Event Coordination)

## Executive Summary

GameTable is a booking platform for hourly table rentals focused on tabletop gaming. The product is modeled after Swimply, where hosts rent game tables by the hour. Phase 1 is focused on coordinating a specific marathon gaming weekend (Sept 18-20) with core team coordination features.

## Business Model

### Two Booking Modes

**Mode A: Whole Table**
- Groups book the table and host for multiple hours
- Host-led gaming sessions
- Premium pricing tier

**Mode B: Open Seating**
- Individual seats sold per session at $15-40 price points
- Lower barrier to entry for casual players
- Higher throughput per table

The platform functions as a "booking agent" matching players to games, times, groups, and venues.

## Phase 1 Launch (Target: September 17, 2026)

Focus: Coordinating a specific marathon gaming weekend (Sept 18-20) with six attendees.

### Core Features Implemented

- **Multi-day event page** with RSVP and share functionality
- **Schedule board** showing games and time blocks
- **Potluck coordination board** for meal organization
- **In-app group messaging** via Supabase Realtime
- **Game cards** with rules links and teaching time estimates
- **Logistics panel** for:
  - Parking information
  - Door access instructions
  - House rules
  - Contact information

### Explicitly Cut from Phase 1

- âŒ Payments processing (no Stripe)
- âŒ Seating algorithms
- âŒ Public-facing pages
- âŒ Multi-table scheduling
- âŒ Recurring bookings

## Phase 2 (~6 months post-launch)

### Paid Bookings & Monetization

- Stripe integration for payment processing
- Insurance partnerships
- Membership models (monthly passes, unlimited plays)
- Add-ons: "host assistance" teaching services
- Take rate: â‰¤15% host-side

### Expanded Features

- Advanced seating algorithms
- Skill/experience level matching
- Teacher/facilitator matching
- Review and rating system
- Host verification and insurance

## Phase 3

### Venue Expansion

- Game shop partnerships (venue.kind = 'shop' in schema)
- Convention bookings
- Tournament hosting
- Multi-location support

## Key Business Model Guardrails

The following constraints shape all product decisions:

### 1. Childcare Licensing
Casual childcare offerings are prohibited by state regulations. GameTable never positions itself as childcare, only as gaming entertainment for families/adults.

### 2. Overnight Stays
Overnight accommodations trigger short-term rental regulations. Verify local zoning for multi-hour/all-day events.

### 3. Food & Drink Coordination
- Platform can coordinate potluck and beverage signup
- Money **cannot** touch food or alcohol
- Host is responsible for all food handling
- Attendees bring/purchase their own

### 4. Business Model Testing
- Both hourly and per-seat models must be measured before committing to one
- Early data will inform pricing strategy
- Phase 2 depends on Phase 1 learnings

## Open Questions (To Be Resolved)

1. **Add-on Pricing Structure**
   - How much for "host assistance" teaching?
   - A la carte or bundled?
   - Premium games as paid add-ons?

2. **Overnight Accommodations for Event**
   - Sept 18-20 weekend: hotel arrangement or host homes?
   - Liability and insurance implications

3. **Product Naming**
   - "GameTable" confirmed or needs refinement?
   - Sub-brand for conventions/shops later?

4. **User Registration**
   - Email-based signup?
   - Social auth (Google/Discord)?
   - Magic links for simplicity?

## Tech Stack

- **Frontend:** Next.js (React)
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Hosting:** Vercel
- **Payments:** Stripe (Phase 2)
- **Analytics:** Built-in Vercel Analytics

## Database Schema (Phase 1)

### Core Tables

- `events` â€” Multi-day event definitions
- `games` â€” Game library with rules, teaching time, player count
- `sessions` â€” Time blocks within events (e.g., "Friday 2-4pm Catan")
- `attendees` â€” RSVP roster with dietary/accessibility notes
- `coordinators` â€” Potluck signup and item tracking
- `logistics` â€” Parking, access, house rules
- `messages` â€” In-app discussion threads

### Data Types

- Event has multiple sessions
- Session assigns one game
- Attendee RSVPs to event
- Message belongs to event (groupchat style)

## Feature Details

### Multi-Day Event Page

- Event title, dates, description
- RSVP button with simple form
- Shareable link
- Event status (planning, live, completed)
- Host info and contact method

### Schedule Board

- Grid: games Ã— time blocks
- Click to view session details
- Game name, teaching time, rules link
- Attendee count and spots available

### Potluck Coordinator

- Item signup (food, drinks, supplies)
- Dietary notes tied to attendees
- Real-time checklist

### In-App Messaging

- Event-level chat via Supabase Realtime
- Notifications for new messages
- Simple threading (optional for later phases)

### Game Cards

- Game name and publisher
- Player count range
- Teaching time (minutes)
- Difficulty (beginner/intermediate/advanced)
- Rules link (external)
- Theme tags (e.g., strategy, party, coop)

### Logistics Panel

- Parking: address, street spots, lot capacity
- Door access: key location, gate code, buzzer
- House rules: quiet hours, smoking policy, etc.
- Host contact: phone/email
- Directions link (Google Maps)

## Success Metrics (Phase 1)

- âœ“ 6-person team coordination for weekend event
- âœ“ 100% RSVP submission
- âœ“ Zero confusion on logistics/timing
- âœ“ Potluck fully coordinated (no duplicates/gaps)
- âœ“ Games taught smoothly within time estimates
- âœ“ Feedback for Phase 2 feature prioritization

## Known Risks

- **Regulatory:** Childcare/food handling rules may apply in some jurisdictions
- **Scalability:** Current design optimized for single event + small group; Phase 2 must address multi-table, multi-host
- **Insurance:** Liability coverage still TBD (likely needed for paid Phase 2)
- **Churn:** Will casual hosts return? Retention strategy needed post-launch

## Next Steps

1. Finalize product naming decision
2. Resolve add-on pricing and user registration questions
3. Build event/game/session/attendee schemas
4. Implement RSVP flow and potluck coordinator
5. Set up Supabase Realtime messaging
6. Create Vercel deployment
7. Beta test with 6-person team by Sept 17

---

**Document Status:** Active  
**Last Review:** September 22, 2026  
**Author:** Sean (seanlive-ai)  
**Repository:** Gestalt-Guild
