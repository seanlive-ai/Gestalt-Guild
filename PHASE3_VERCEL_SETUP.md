# Phase 3: Vercel Configuration

Complete these steps to connect your new GitHub repo to Vercel and deploy.

## Step 1: Disconnect Old Repo (if needed)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find the **gestalt-guild** project
3. Click **Settings** → **Git**
4. Look for "Connected Repository"
5. If it shows `seanlive-ai/Gestalt-Guild` (old repo), click **Disconnect**

## Step 2: Connect New Repo

1. In the **gestalt-guild** project, click **Settings** → **Git**
2. Click **Connect** (or "Select Git Repository")
3. Choose GitHub
4. Search for `Gestalt-Guild` or `gestalt-guild`
5. Select `seanlive-ai/Gestalt-Guild` (the new one)
6. Click **Connect**

Vercel will now watch this repo for pushes to `main`.

## Step 3: Add Environment Variables

1. In the **gestalt-guild** project, go to **Settings** → **Environment Variables**
2. Click **Add New** and add these two:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://ixzipadfbaaakwktmqdj.supabase.co`
   - Environments: Check ✓ Production, ✓ Preview, ✓ Development

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `sb_publishable_5PIICeK1cUfPhdfs192VxA_xIMt0bM9`
   - Environments: Check ✓ Production, ✓ Preview, ✓ Development

3. Click **Save** on each

## Step 4: Trigger First Deploy

Option A (Automatic):
- Vercel auto-deploys when you connected the repo
- Check **Deployments** tab — should see a build in progress or completed
- Wait for green checkmark

Option B (Manual):
1. Go to **Deployments** tab
2. Click **Deploy** (top right)
3. Select `main` branch
4. Click **Deploy**

## Step 5: Verify Deployment

Once deployment completes (green checkmark):

1. Click the deployment to open it
2. You should see the Gestalt Guild login page
3. The app is now live!

**Production URL:** https://gestalt-guild.vercel.app
**Your custom domain:** (if you set one up)

## ✅ Success Criteria

- [ ] Old repo disconnected (if it was connected)
- [ ] New repo (seanlive-ai/Gestalt-Guild) connected
- [ ] Environment variables added (both NEXT_PUBLIC_*)
- [ ] Deployment completed with green checkmark
- [ ] Live app loads without errors
- [ ] Can see login page

## 🔍 Troubleshooting

**"Build failed" error:**
- Check build logs in Vercel Deployments tab
- Likely cause: Missing env vars or git push didn't complete
- Solution: Make sure Step 3 is complete, then redeploy

**"Cannot find module" errors:**
- Run `npm install` locally to verify
- Push any changes to GitHub
- Trigger new deploy in Vercel

**App shows 404 for lobby pages:**
- This is expected! Remaining app pages haven't been added yet
- Home (`/`), Login (`/login`), and Profile (`/profile`) should work
- Other pages can be added in follow-up PRs

## Next Steps (After Verification)

Once verified, you can:
1. **Add remaining app pages** (give, house, lobbies/*) in follow-up PRs
2. **Set up custom domain** in Vercel → Domains
3. **Enable preview deployments** (should be automatic)
4. **Start building new features** — every PR will auto-deploy a preview

---

**When Step 5 is complete, reply with a screenshot or confirmation that the app is live!**
