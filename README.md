<<<<<<< HEAD
# CX Reply Assistant

An AI-powered customer support assistant that generates brand-grounded replies using OpenRouter LLMs. Built for Datastraw Technologies assessment.

## Live Demo

[https://cx-reply-assistant.vercel.app](https://cx-reply-assistant.vercel.app)

**Demo Credentials:**
- Email: `cixclient@gmail.com`
- Password: `hello9090`

## Features

- **Agent Login** - Secure authentication with Supabase Auth
- **Conversation View** - Customer info, order details, message history
- **AI Reply Generation** - Context-aware responses grounded in brand policies
- **Edit and Regenerate** - Review and improve AI-generated responses
- **Approve Workflow** - Agent approval before sending
- **AI Guardrails** - Prevents hallucinations and policy violations
- **Full Logging** - Complete audit trail of all AI interactions
- **Modern UI** - Clerk-style design with full responsiveness

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React + Vite + TailwindCSS |
| **Backend** | Supabase Edge Functions (Deno) |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth |
| **AI** | OpenRouter API (GPT-4o-mini) |
| **Deployment** | Vercel + Supabase |

## Installation

### Prerequisites

- Node.js 18+
- Supabase CLI
- Docker (for local Supabase)

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/cx-reply-assistant.git
cd cx-reply-assistant

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase and OpenRouter credentials

# Run frontend
npm run dev
```

### Local Supabase Setup

```bash
# Start Supabase locally
supabase start

# Run migrations
supabase migration up
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-api-key

# App
APP_URL=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema

**7 Tables with RLS Policies:**

| Table | Purpose |
|-------|---------|
| `brands` | Brand metadata |
| `customers` | Customer profiles |
| `orders` | Order history |
| `conversations` | Conversation threads |
| `messages` | All messages |
| `kb_articles` | Brand policies |
| `ai_logs` | AI audit trail |

### RLS Multi-Brand Isolation

```sql
CREATE POLICY "agents_see_their_brand_data" ON customers
  FOR SELECT USING (brand_id = auth.jwt() ->> 'brand_id'::text);
```

## Test Scenarios

| Customer | Scenario | Policy | Guardrail |
|----------|----------|--------|-----------|
| Alex Rodriguez | Broken bottle | Refund | Covered |
| Jordan Smith | 45-day refund | Refund | Guardrail |
| Morgan Lee | Shipping status | Shipping | Covered |
| Taylor Chen | Cancellation | Cancellation | Covered |

## Deployment

### Deploy to Vercel

```bash
cd frontend
npm run build
vercel --prod
```

### Deploy Edge Function to Supabase

```bash
supabase functions deploy generate-reply
supabase secrets set OPENROUTER_API_KEY=your-key
```

## Project Structure

```
cx-reply-assistant/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configuration
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── supabase/
│   ├── functions/
│   │   └── generate-reply/
│   │       └── index.ts
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_seed_data.sql
├── docs/
│   ├── architecture-diagram.png
│   └── architecture-document.pdf
├── .env.example
├── .gitignore
└── README.md
```

## License

MIT

## Acknowledgments

- Built for Datastraw Technologies assessment
- Powered by Supabase and OpenRouter
=======
# CX Reply Assistant

An AI-powered customer support assistant that generates brand-grounded replies using OpenRouter LLMs. Built for Datastraw Technologies assessment.

## Live Demo

[https://cx-reply-assistant.vercel.app](https://cx-reply-assistant.vercel.app)

**Demo Credentials:**
- Email: `agent@example.com`
- Password: `any password`

## Features

- **Agent Login** - Secure authentication with Supabase Auth
- **Conversation View** - Customer info, order details, message history
- **AI Reply Generation** - Context-aware responses grounded in brand policies
- **Edit and Regenerate** - Review and improve AI-generated responses
- **Approve Workflow** - Agent approval before sending
- **AI Guardrails** - Prevents hallucinations and policy violations
- **Full Logging** - Complete audit trail of all AI interactions
- **Modern UI** - Clerk-style design with full responsiveness

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React + Vite + TailwindCSS |
| **Backend** | Supabase Edge Functions (Deno) |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth |
| **AI** | OpenRouter API (GPT-4o-mini) |
| **Deployment** | Vercel + Supabase |

## Installation

### Prerequisites

- Node.js 18+
- Supabase CLI
- Docker (for local Supabase)

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/cx-reply-assistant.git
cd cx-reply-assistant

# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase and OpenRouter credentials

# Run frontend
npm run dev
```

### Local Supabase Setup

```bash
# Start Supabase locally
supabase start

# Run migrations
supabase migration up
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-api-key

# App
APP_URL=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema

**7 Tables with RLS Policies:**

| Table | Purpose |
|-------|---------|
| `brands` | Brand metadata |
| `customers` | Customer profiles |
| `orders` | Order history |
| `conversations` | Conversation threads |
| `messages` | All messages |
| `kb_articles` | Brand policies |
| `ai_logs` | AI audit trail |

### RLS Multi-Brand Isolation

```sql
CREATE POLICY "agents_see_their_brand_data" ON customers
  FOR SELECT USING (brand_id = auth.jwt() ->> 'brand_id'::text);
```

## Test Scenarios

| Customer | Scenario | Policy | Guardrail |
|----------|----------|--------|-----------|
| Alex Rodriguez | Broken bottle | Refund | Covered |
| Jordan Smith | 45-day refund | Refund | Guardrail |
| Morgan Lee | Shipping status | Shipping | Covered |
| Taylor Chen | Cancellation | Cancellation | Covered |

## Deployment

### Deploy to Vercel

```bash
cd frontend
npm run build
vercel --prod
```

### Deploy Edge Function to Supabase

```bash
supabase functions deploy generate-reply
supabase secrets set OPENROUTER_API_KEY=your-key
```

## Project Structure

```
cx-reply-assistant/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configuration
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── supabase/
│   ├── functions/
│   │   └── generate-reply/
│   │       └── index.ts
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_seed_data.sql
├── docs/
│   ├── architecture-diagram.png
│   └── architecture-document.pdf
├── .env.example
├── .gitignore
└── README.md
```

## License

MIT

## Acknowledgments

- Built for Datastraw Technologies assessment
- Powered by Supabase and OpenRouter
>>>>>>> cc2822858d1666b6386f4c9b81eba00af00b0346
