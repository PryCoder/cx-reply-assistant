# Deployment Guide — CX Reply Assistant

This guide walks you through deploying the CX Reply Assistant to production (Vercel + Supabase).

## Prerequisites

Before deployment, ensure you have:

1. ✅ Local setup complete (see README.md — "Local Setup")
2. ✅ Supabase project created with migrations run
3. ✅ OpenRouter API key generated with credits
4. ✅ GitHub account and git installed
5. ✅ Vercel account (free tier works)

---

## Phase 1: Set Up Supabase (Cloud)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) — **Sign Up** or **Sign In**
2. Click **New Project**
3. Name: `cx-reply-assistant` (or your choice)
4. Region: Choose closest to your users (e.g., `us-east-1`)
5. Password: Generate a strong one, save it securely
6. Click **Create new project** (wait ~2 minutes for setup)

### Step 2: Get Supabase Credentials

1. In your project, go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://abc12345.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`, keep secret!)
3. Save these securely (you'll need them shortly)

### Step 3: Run Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open [supabase/migrations/20260902000000_init_schema.sql](../supabase/migrations/20260902000000_init_schema.sql) from the repo
4. Copy & paste the **entire SQL file** into the editor
5. Click **Run** (wait for completion)
6. Verify in **Table Editor** that 7 tables exist:
   ```
   brands, customers, orders, conversations, messages, kb_articles, ai_logs
   ```

### Step 4: Set Up Authentication

1. Go to **Authentication** → **Providers**
2. Find **Email** and ensure it's **Enabled**
3. Go to **Authentication** → **User Settings**
4. Under **Confirm email**, toggle to **OFF** (for demo simplicity)

### Step 5: Create Web App for OpenRouter

We'll use Supabase's **Application Settings** to store the OpenRouter key securely:

1. Go to **Settings** → **API**
2. You'll see your credentials listed
3. Note these down for the next steps

### Step 6: Set Up OpenRouter Secret

We'll add the OpenRouter API key as a secret in Supabase **after** deploying Edge Functions. For now, note your OpenRouter key.

---

## Phase 2: Deploy to Vercel (Frontend)

### Step 1: Push Code to GitHub

1. Initialize git in your project (if not already):
   ```bash
   cd /path/to/cix
   git init
   git config user.name "Your Name"
   git config user.email "your@email.com"
   ```

2. Create a `.gitignore` file at the root:
   ```
   node_modules/
   .env.local
   .env
   dist/
   build/
   .DS_Store
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Initial commit: CX Reply Assistant"
   git remote add origin https://github.com/YOUR_USERNAME/cx-reply-assistant.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy Frontend on Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your GitHub repo → Select `cx-reply-assistant`
4. **Project Settings:**
   - Framework: **Vite**
   - Root Directory: **frontend/** ← Important!
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Under **Environment Variables**, add:
   ```
   VITE_SUPABASE_URL=https://your-abc12345.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (Paste the values from Supabase Step 2)

6. Click **Deploy**

Vercel will build and deploy in ~2 minutes. You'll get a URL like:
```
https://cx-reply-assistant.vercel.app
```

### Step 3: Verify Frontend

1. Open your Vercel URL in a browser
2. You should see the **CX Reply Assistant** login page
3. Try signing up with `test@example.com` / `password123`
4. You should land on the conversation list page

**Expected error**: "Failed to load conversations" (because we haven't deployed the backend yet — that's OK!)

---

## Phase 3: Deploy Edge Function to Supabase

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

OR use `brew` on macOS:
```bash
brew install supabase/tap/supabase
```

### Step 2: Link Your Supabase Project

1. In your repo root (`cix/`):
   ```bash
   supabase login   # You'll be prompted to open a browser to auth
   ```

2. Verify login by checking:
   ```bash
   supabase projects list
   ```
   You should see your `cx-reply-assistant` project.

### Step 3: Deploy the Edge Function

```bash
supabase functions deploy generate-reply
```

You should see:
```
Successfully deployed function generate-reply with import-map URL: https://your-abc12345.supabase.co/functions/v1/generate-reply
```

### Step 4: Add OpenRouter Secret to Edge Function

1. Go to your Supabase dashboard → **Edge Functions** → **generate-reply**
2. Click the **Settings** icon (⚙️) in the top right
3. Scroll down to **Secrets**
4. Click **+ Add secret**
5. Key: `OPENROUTER_API_KEY`
6. Value: Paste your OpenRouter API key
7. Click **Save**

---

## Phase 4: Test the Full Stack

### Step 1: Test Login

1. Go to your Vercel URL
2. Sign up: `agent@example.com` / `mypassword123`
3. You should be logged in

### Step 2: Test Conversation List

After logging in, you should see 2 pre-seeded conversations:
- **Alex Rodriguez** — "My order was delivered three days ago but the bottle is broken..."
- **Jordan Smith** — "I received my bottle 45 days ago and it has small cracks..."

If you see them ✅, the database connection works!

### Step 3: Test AI Reply Generation

1. Click on **Alex Rodriguez**'s conversation
2. Click **Generate AI Reply**
3. Wait 3-10 seconds...
4. An AI response should appear (it should acknowledge the broken bottle and offer a refund based on the 30-day policy)

**If it works:** ✅ Your deployment is complete!

**If it fails:** See Troubleshooting below.

### Step 4: Test Guardrails

1. Click on **Jordan Smith**'s conversation (45 days old)
2. Click **Generate AI Reply**
3. The AI should **NOT** promise a refund (outside 30-day window)
4. It should acknowledge the issue but indicate a specialist will review

This demonstrates the guardrail working correctly! ✅

### Step 5: Test Approve & Send

1. In any conversation, after generating a reply:
2. Edit the text if you want
3. Click **Approve & Send**
4. The message should appear in the thread as **Agent**
5. Check `ai_logs` table in Supabase (SQL Editor) to see the audit trail

---

## Troubleshooting

### Frontend won't load

**Error:** "Failed to load conversations"

**Fixes:**
1. Check environment variables in Vercel:
   - Go to **Project Settings** → **Environment Variables**
   - Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
2. Check Supabase URL and key are correct:
   - Go to Supabase → **Settings** → **API** and re-copy the values
3. Redeploy on Vercel (click **Deployments** → rightmost → **⋯** → **Redeploy**)

### Edge Function fails with 401

**Error:** "OpenRouter API error: 401"

**Fixes:**
1. Go to Supabase → **Edge Functions** → **generate-reply** → **Settings**
2. Verify `OPENROUTER_API_KEY` secret is set
3. Verify the key is valid:
   ```bash
   curl -X POST "https://openrouter.io/api/v1/auth/key" \
     -H "Authorization: Bearer YOUR_KEY"
   ```
4. If key is invalid, regenerate one on [openrouter.io](https://openrouter.io)

### Edge Function returns 404

**Error:** "Failed to fetch reply"

**Fixes:**
1. Verify the function is deployed:
   ```bash
   supabase functions list
   ```
   Should show `generate-reply` in the list.
2. Re-deploy:
   ```bash
   supabase functions deploy generate-reply
   ```
3. Wait 1-2 minutes for the deployment to be live

### Migrations didn't run

**Error:** Tables don't exist in Supabase

**Fixes:**
1. Go to Supabase → **SQL Editor** → **New Query**
2. Copy the ENTIRE migration file: [supabase/migrations/20260902000000_init_schema.sql](../supabase/migrations/20260902000000_init_schema.sql)
3. Paste and **Run**
4. Wait for completion
5. Verify in **Table Editor** that you see all 7 tables

### Can't login

**Error:** "Login failed"

**Fixes:**
1. Supabase → **Authentication** → **Policies**
2. Ensure email provider has **Confirm email = OFF** (or is enabled in your auth settings)
3. Try a new email: `test2@example.com` / `password`

---

## Monitoring & Logs

### Frontend Logs

- Vercel: **Deployments** → Select latest → **Logs**

### Backend Logs

- Supabase: **Edge Functions** → **generate-reply** → **Logs** tab

### Database Logs

- Supabase: Go to the `ai_logs` table to see all generated responses

---

## Cleanup & Tear Down (If Needed)

### Delete Vercel Deployment

1. Vercel Dashboard → **Project Settings** → **Danger Zone** → **Delete Project**

### Delete Supabase Project

1. Supabase Dashboard → **Settings** → **General** → **Delete Project**

---

## Performance Optimization Tips

1. **Cold starts on Edge Functions:** Call an endpoint once to warm up (Google Cloud will cache it)
2. **Database indexes:** Already created in migrations for common queries
3. **Caching:** Consider caching KB articles on the frontend for faster searches
4. **Rate limiting:** Add rate limits to Edge Function if exposing publicly

---

## Security Checklist

- ✅ Environment variables stored in Vercel (not in code)
- ✅ OpenRouter key stored as Supabase secret (not in code)
- ✅ RLS policies enabled on Supabase tables
- ✅ CORS headers configured in Edge Function
- ✅ Edge Function validates input (conversation_id required)
- ✅ No hardcoded secrets in git commits

---

## Next Steps

1. **Monitor:** Check Vercel logs and Supabase logs for errors
2. **Iterate:** Make product improvements based on feedback
3. **Scale:** Add more brands, customers, and conversations
4. **Extend:** Implement features from "Extensions" section in README.md

---

## Support

For deployment issues:
1. Check Vercel logs: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Check Supabase logs: Supabase dashboard → **Edge Functions** → **generate-reply** → **Logs**
3. Open a GitHub issue with error details
