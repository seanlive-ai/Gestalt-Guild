# Gestalt Guild

A nonprofit tabletop gaming community platform built with Next.js 14 and Supabase.

## Quick Start

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

The Supabase URL and publishable key are already in `.env.example`. For local dev, you can use those values in `.env.local`.

## Project Structure

```
app/                    Next.js App Router
  layout.js            Root layout + fonts
  globals.css          All styling (felt/brass/parchment theme)
  Header.js            Top navigation
  page.js              Home (lobbies list)
  login/page.js        Magic-link auth
  profile/page.js      Member profile
  give/page.js         Treasury ledger
  house/page.js        Community house calendar
  lobbies/
    new/page.js        Create lobby
    [id]/page.js       Lobby detail (seats/logistics/messages)
    [id]/edit/page.js  Edit lobby
    [id]/SeatTable.js  Seat picker UI
    [id]/Messages.js   Per-lobby chat
    [id]/Logistics.js  Odds & ends + house info

lib/
  supabaseClient.js    Supabase JS client (reads from env vars)

supabase/
  migrations/          SQL migrations (version-controlled schema)
    001_initial_schema.sql

.github/
  workflows/ci.yml     Lint + build on PR
  pull_request_template.md

public/                Static assets
```

## Technology

- **Frontend:** Next.js 14 (App Router), React 18, plain JavaScript
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Auth:** Supabase magic-link email (no passwords)
- **Deployment:** Vercel (git-based auto-deploy)

## Development Workflow

1. Create a feature branch: `git checkout -b feature/description`
2. Make changes and commit: `git commit -m "description"`
3. Push and open a PR on GitHub
4. CI checks (lint + build) run automatically
5. Merge to main when approved
6. Vercel auto-deploys to production

## Database Migrations

Migrations live in `supabase/migrations/` and are version-controlled. To apply a migration locally:

```bash
supabase migration up
```

To create a new migration:

```bash
supabase migration new description
```

## Debugging

**Supabase RLS issues?** Check the policies in the Supabase dashboard (SQL Editor → Policies). The app relies entirely on RLS for access control.

**Client errors?** Check the browser console and Supabase logs (dashboard → Logs).

**Auth not working?** Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Notes

- No TypeScript yet (plain JavaScript throughout)
- No Stripe integration yet (schema ready, not wired)
- No BGG import yet (game library is manual entry)
- All styling is in `app/globals.css` (no CSS modules or Tailwind)

## Roadmap (Not Yet Built)

- Stripe payment integration
- Guild-owned asset tracking
- Waivers
- Reputation / notifications
- BGG import
- Guild-wide + per-game messaging tiers
- Subdivided spaces (for when house has multiple bookable rooms)
