# Quick Start — CX Reply Assistant

Get the app running locally in 5 minutes.

## 1. Prerequisites

- Node.js 18+
- Supabase account (free)
- OpenRouter API key (free signup + add credits)

## 2. Setup Supabase

1. [Create a Supabase project](https://supabase.com) (note your URL and anon key)
2. Go to **SQL Editor** → **New Query**
3. Paste the file: `supabase/migrations/20260902000000_init_schema.sql`
4. Click **Run**
5. Go to **Authentication** → **User Settings** → Toggle **Confirm email** to **OFF**

## 3. Setup Environment Variables

Create `frontend/.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Create `supabase/functions/generate-reply/.env.local`:

```bash
OPENROUTER_API_KEY=your-openrouter-key-here
```

## 4. Install & Run

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 5. Test It

- **Sign up**: `agent@example.com` / `password123`
- **See conversations**: You'll see 2 pre-seeded test cases (Alex & Jordan)
- **Generate reply**: Click a conversation → Click **Generate AI Reply** → Wait 3-10s
- **Verify guardrails**: Jordan's case (45 days old) should show refund denial

## Done! 🎉

For full setup guide, see [README.md](README.md)  
For deployment guide, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
