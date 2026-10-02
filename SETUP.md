# Setup Instructions

This file tracks what's been scaffolded for the new Gestalt Guild repo.

## ✅ Already Created (Infrastructure & Config)

```
.env.example
.gitignore
.github/
  pull_request_template.md
  workflows/
    ci.yml
app/
  globals.css
  Header.js
  layout.js
lib/
  supabaseClient.js (updated to use env vars)
package.json (with lint script)
README.md
supabase/
  migrations/
    001_initial_schema.sql (full schema with RLS)
```

## 📋 Still Need to Add (App Pages & Components)

Copy these files from the source export to the `app/` folder:

**Pages:**
- `app/page.js` — Home (lobbies list)
- `app/login/page.js` — Magic-link login
- `app/profile/page.js` — Member profile + game library
- `app/give/page.js` — Treasury ledger
- `app/house/page.js` — Community house calendar
- `app/lobbies/new/page.js` — Create lobby
- `app/lobbies/[id]/page.js` — Lobby detail (tabs: seats/logistics/messages)
- `app/lobbies/[id]/edit/page.js` — Edit lobby

**Components:**
- `app/lobbies/[id]/SeatTable.js` — Seat picker UI
- `app/lobbies/[id]/Messages.js` — Per-lobby chat
- `app/lobbies/[id]/Logistics.js` — Odds & ends + house info

**Other Files:**
- `lib/theme.js` — Color tokens (optional, currently unused)
- `next.config.js` (can be minimal; already in place)
- `.eslintrc.json` (optional; CI script is already set up)

## 🚀 Next Steps

1. **Copy the app files** into `app/` using the paths listed above
2. **Create `.env.local`** by copying `.env.example` (for local dev)
3. **Test locally:**
   ```bash
   npm install
   npm run dev
   ```
4. **Push to GitHub:**
   - Create new repo: `https://github.com/seanlive-ai/gestalt-guild`
   - Add remote and push main branch
   - Verify CI runs on push
5. **Configure Vercel:**
   - Connect gestalt-guild repo to Vercel project
   - Add env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Verify deployment works

## 📝 Notes

- The Supabase schema migration is complete (001_initial_schema.sql)
- All RLS policies are defined in the migration
- Environment variables are correctly wired in `lib/supabaseClient.js`
- CI workflow is ready (runs lint + build on PR)
- No code changes needed; just file copying and configuration

## ⚠️ Important

- `.env.local` will be git-ignored (add to `.env.local` for local dev)
- The publishable Supabase key in `.env.example` is safe to commit (RLS-protected)
- After copying app files, run `npm run lint` to check for any issues (ESLint is now installed)
