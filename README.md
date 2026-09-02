# CX Reply Assistant

A support-agent tool that generates AI-assisted customer replies grounded in a brand knowledge base. Agents log in, review customer conversations, and get AI-generated responses that strictly adhere to brand policies.

## Tech Stack

- **Frontend:** React 19 + Vite + TailwindCSS
- **Backend:** Supabase Edge Functions (Deno/TypeScript)
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth (email/password)
- **LLM:** OpenRouter API (Claude 3.5 Haiku)
- **Hosting:** Vercel (frontend) + Supabase (backend/database)

## Project Structure

```
cix/
├── frontend/                    # React app (Vite)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.ts     # Supabase client init
│   │   │   └── auth.tsx        # Auth context & hooks
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx   # Agent login
│   │   │   ├── ConversationListPage.tsx  # List of conversations
│   │   │   └── ConversationViewPage.tsx  # Conversation detail + reply flow
│   │   ├── App.tsx             # Main app with routing
│   │   ├── main.tsx            # Entry point
│   │   ├── index.css           # Tailwind directives
│   │   └── vite.config.ts
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── .env.example
├── supabase/
│   ├── functions/
│   │   └── generate-reply/
│   │       └── index.ts        # Edge Function (Deno) for AI reply generation
│   └── migrations/
│       └── 20260902000000_init_schema.sql  # Database schema + seed data
└── README.md                   # This file
```

## Database Schema

### Core Tables

- **brands** — Brand info + tone guidelines
- **customers** — Customer details linked to brands
- **orders** — Order history (product, dates, status)
- **conversations** — Customer support conversations
- **messages** — Message history (customer/agent/ai)
- **kb_articles** — Brand knowledge base (policies for return/refund/shipping/cancellation)
- **ai_logs** — Log of AI-generated responses (for audit trail)

See [supabase/migrations/20260902000000_init_schema.sql](supabase/migrations/20260902000000_init_schema.sql) for full schema.

## Local Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- A Supabase account (free tier works)
- OpenRouter API key (ChatGPT mini or Claude)

### 1. Clone & Install Dependencies

```bash
cd frontend
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project (e.g., "cx-reply-assistant")
3. Copy your **Project URL** and **anon key** from Settings → API

#### Run Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy & paste the entire contents of [supabase/migrations/20260902000000_init_schema.sql](supabase/migrations/20260902000000_init_schema.sql)
4. Run the query
5. Verify tables are created in the **Table Editor**

#### Set Up Auth Signup (Demo)

For demo purposes, we'll allow email/password signup:

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Go to **Authentication** → **Policies**
4. Find the "Email" provider and ensure **Confirm email** is **OFF** (for demo simplicity)

You can now sign up with any email/password.

### 3. Generate OpenRouter API Key

1. Go to [openrouter.io](https://openrouter.io)
2. Sign up and get your API key
3. Add credits to your account (API calls cost a few cents)

### 4. Set Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create another `.env.local` file for the Edge Function. This should be set **in Supabase directly**:
- Go to **Edge Functions** → **generate-reply** → **Settings**
- Add secret: `OPENROUTER_API_KEY=your-openrouter-key`

### 5. Run Locally

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Test Login

Use any email/password (e.g., `agent@example.com` / `password123`).

#### Test the App

1. You'll see a list of pre-seeded conversations (2 scenarios)
   - **Alex Rodriguez**: Recent order, broken bottle (within refund window) ✓
   - **Jordan Smith**: Old order, refund request (outside window) → guardrail test
2. Click a conversation
3. See customer message + order details
4. Click "Generate AI Reply" → fetches policies + calls OpenRouter
5. Edit the response if needed
6. Click "Approve & Send" → AI response is logged + added to message thread

## Deployment

### Frontend → Vercel

#### Prerequisites

- GitHub account with this repo
- Vercel account

#### Steps

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/cx-reply-assistant.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select `frontend/` as the root directory
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Click **Deploy**

3. Your app will be live at `https://your-project.vercel.app`

### Backend → Supabase (Already Done)

Edge Functions are already deployed when you create them. No additional deployment needed:

1. The `generate-reply` function is deployed automatically to `https://your-project.supabase.co/functions/v1/generate-reply`
2. Set secrets via Supabase dashboard (see Local Setup step 4)

### Database → Supabase (Already Done)

Your Postgres database and migrations are already running on Supabase's managed infrastructure.

## Usage Flow

### 1. Agent Logs In

- Email/password signup/login (Supabase Auth)
- Session persisted in browser

### 2. Agent Views Conversations

- Conversation list page shows:
  - Customer name & email
  - Brand
  - Latest message snippet
  - Click to open

### 3. Agent Reviews a Conversation

- See full message history
- Order details (product, delivery date)
- Customer's latest message highlighted

### 4. Agent Generates AI Reply

- Click **Generate AI Reply**
- Edge Function:
  1. Fetches brand tone guidelines + customer order
  2. Searches KB articles (return/refund/shipping/cancellation)
  3. Calls OpenRouter with constrained system prompt:
     - "ONLY answer using provided policies"
     - "If unclear, acknowledge + ask clarifying questions"
     - "DO NOT invent policy details"
  4. Returns AI response + retrieved context
- Frontend displays response in editable textarea

### 5. Agent Edits & Approves

- **Edit** the response if needed (fix tone, add info, etc.)
- **Regenerate** to get a fresh AI response
- **Approve & Send**:
  - Logs final response to `ai_logs` table
  - Adds message to conversation as sender=`agent`
  - Conversation thread updates in real-time

### 6. Audit Trail

- `ai_logs` table tracks:
  - Customer message
  - Retrieved KB context (what policies were used)
  - AI-generated response
  - Agent-edited final response
  - Status (generated/edited/approved)
  - Timestamps

## Guardrails & Policy Constraints

The system is designed to **prevent hallucination**:

1. **System Prompt Strictness:**
   ```
   "ONLY answer using the provided policy information below.
    If the customer's situation is not clearly covered, do NOT
    confidently promise an outcome. Instead, acknowledge empathetically,
    ask clarifying questions, or indicate a specialist will confirm eligibility."
   ```

2. **KB-Grounded Retrieval:**
   - No vector DB, simple SQL filtering by category
   - Agent sees exactly what context the AI used

3. **Example Test Scenarios:**
   - ✓ **Alex** (recent delivery, broken bottle) → Refund authorized (within 30-day window)
   - ✗ **Jordan** (45 days post-delivery) → Polite decline + specialist offer (outside refund window)

## API Reference

### Edge Function: `generate-reply`

**Endpoint:** `POST /functions/v1/generate-reply`

**Request:**
```json
{
  "conversation_id": "uuid"
}
```

**Response:**
```json
{
  "reply": "Thank you for contacting...",
  "retrieved_context": "=== CUSTOMER CONTEXT ===\n..."
}
```

**Error:**
```json
{
  "error": "Conversation not found"
}
```

## Troubleshooting

### 1. "Missing Supabase environment variables"

**Fix:** Ensure `.env.local` in `frontend/` has:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### 2. "OpenRouter API error: 401"

**Fix:** 
- Check your OpenRouter API key is set as a secret in Supabase (Edge Functions settings)
- Verify it's a valid key with credits

### 3. "Conversation not found"

**Fix:**
- Ensure migrations have been run (tables created)
- Ensure seed data was inserted (2 customers + conversations)

### 4. "Failed to login"

**Fix:**
- Go to Supabase dashboard → **Authentication** → **Policies**
- Ensure email signup is enabled (Confirm email = OFF for demo)

## Next Steps / Extensions

- [ ] **Real webhook integration** — Ingest messages from WhatsApp, email, support platforms
- [ ] **Vector search** — Use Supabase pgvector for semantic KB search
- [ ] **Response history** — Track which templates/policies agents use most
- [ ] **Multi-brand dashboard** — Allow agents to manage multiple brands
- [ ] **Feedback loop** — Log customer satisfaction (response helpful? on-topic?)
- [ ] **Custom LLM models** — Support local models, different providers (Anthropic, OpenAI, etc.)

## License

MIT

## Support

For issues or questions, open a GitHub issue or contact support@example.com.
#   c x - r e p l y - a s s i s t a n t  
 