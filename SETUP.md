# SocialPilot Pro — Complete Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 22.x | https://nodejs.org |
| pnpm | >= 10.6.1 | `npm install -g pnpm@10.6.1` |
| PostgreSQL | >= 16 | https://postgresql.org or Docker |
| Ollama | latest | https://ollama.ai (optional, for AI) |
| FFmpeg | latest | https://ffmpeg.org (optional, for media) |

---

## Quick Start (5 minutes)

### Step 1 — Install pnpm
```bash
npm install -g pnpm@10.6.1
```

### Step 2 — Install dependencies
```bash
pnpm install
```

### Step 3 — Configure environment
```bash
# Option A: Interactive wizard
node scripts/setup.js

# Option B: Manual
cp .env.example .env
# Edit .env with your values
```

### Step 4 — Start PostgreSQL
```bash
# Using Docker (recommended for dev)
pnpm dev:docker

# Or use your existing PostgreSQL instance
# Update DATABASE_URL in .env
```

### Step 5 — Push database schema
```bash
pnpm prisma-db-push
```

### Step 6 — Seed initial data
```bash
pnpm prisma-seed
```

### Step 7 — Start development servers
```bash
pnpm dev
```

### Step 8 — Open in browser
- Frontend: http://localhost:4200
- API Docs: http://localhost:3000/api/docs
- Login: admin@socialpilotpro.com / Admin@123456

---

## Environment Variables Reference

### Required
```env
DATABASE_URL          PostgreSQL connection string
JWT_SECRET            Random 64+ char string for JWT signing
TOKEN_ENCRYPTION_KEY  32-byte hex string for AES-256 token encryption
FRONTEND_URL          http://localhost:4200
NEXT_PUBLIC_BACKEND_URL  http://localhost:3000
```

### Social Media APIs

#### Meta (Facebook + Instagram)
1. Go to https://developers.facebook.com
2. Create a new App → Business type
3. Add products: Facebook Login, Instagram Graph API
4. Set OAuth redirect URI: `http://localhost:3000/api/integrations/meta/callback`
5. Copy App ID and App Secret to `.env`

```env
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
META_API_VERSION=v21.0
```

#### YouTube / Google
1. Go to https://console.cloud.google.com
2. Create project → Enable APIs:
   - YouTube Data API v3
   - YouTube Analytics API
   - Google+ API (for OAuth)
3. Create OAuth 2.0 credentials
4. Add redirect URIs:
   - `http://localhost:3000/api/integrations/youtube/callback`
   - `http://localhost:3000/api/auth/google/callback`

```env
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Stripe Billing
1. Go to https://dashboard.stripe.com
2. Get API keys from Developers → API keys
3. Create products and prices for Pro/Agency plans
4. Set up webhook endpoint: `https://yourdomain.com/api/billing/webhook/stripe`
5. Events to listen: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_SIGNING_KEY=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_YEARLY=price_...
```

### AI (Ollama)
```bash
# Install Ollama
# Windows: https://ollama.ai/download
# Mac: brew install ollama
# Linux: curl -fsSL https://ollama.ai/install.sh | sh

# Pull the model
ollama pull llama3.2

# Start Ollama (runs on port 11434)
ollama serve
```

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Email (Resend)
```bash
# Sign up at https://resend.com (free tier: 3000 emails/month)
```
```env
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=SocialPilot Pro
```

---

## Development Commands

```bash
# Start everything (backend + frontend + orchestrator)
pnpm dev

# Start individual services
pnpm dev:backend:only      # NestJS API on :3000
pnpm dev:frontend:only     # Next.js on :4200
pnpm dev:orchestrator      # Background jobs on :3001

# Database
pnpm prisma-db-push        # Push schema changes (dev)
pnpm prisma-migrate        # Create migration file
pnpm prisma-migrate-deploy # Apply migrations (production)
pnpm prisma-seed           # Seed initial data
pnpm prisma-studio         # Open Prisma Studio GUI
pnpm prisma-reset          # Reset database (DESTRUCTIVE)

# Build
pnpm build                 # Build all apps
pnpm build:backend
pnpm build:frontend
pnpm build:orchestrator

# Stripe webhook testing (requires Stripe CLI)
pnpm dev:stripe
```

---

## Production Deployment

### Using Docker Compose
```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Run migrations in production
docker compose exec backend npx prisma migrate deploy
```

### Environment for Production
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
BACKEND_INTERNAL_URL=https://api.yourdomain.com
```

### Recommended Production Stack
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage or Cloudflare R2
- **Hosting**: Railway, Render, or VPS
- **CDN**: Cloudflare
- **Email**: Resend
- **Monitoring**: Sentry (already integrated)

---

## Meta App Review Requirements

To use Instagram/Facebook APIs in production (with real users):

1. **Business Verification** — Verify your business at business.facebook.com
2. **App Review** — Submit for review with these permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `instagram_manage_insights`
3. **Privacy Policy** — Must be publicly accessible at `/legal/privacy`
4. **Terms of Service** — Must be publicly accessible at `/legal/terms`
5. **Data Deletion Callback** — Implement at `/api/auth/facebook/data-deletion`

---

## Google API Verification

For YouTube API in production:

1. **OAuth Consent Screen** — Configure at console.cloud.google.com
2. **Verification** — Required if app accesses sensitive scopes
3. **Quota** — Default: 10,000 units/day (request increase if needed)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
│              Next.js Frontend (:4200)                    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (proxied)
┌──────────────────────▼──────────────────────────────────┐
│              NestJS Backend API (:3000)                  │
│  Auth │ Posts │ Analytics │ Billing │ AI │ Media         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  PostgreSQL Database                     │
│  Users │ Posts │ Analytics │ Jobs │ Billing              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│           Orchestrator (:3001) — Background Jobs         │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Post        │  │ Analytics    │  │ Token         │  │
│  │ Scheduler   │  │ Pipeline     │  │ Refresh       │  │
│  │ (every min) │  │ (15m/1h/2am) │  │ (every 6h)    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Meta Graph     YouTube Data    Ollama LLM
   API (IG+FB)    API v3          (:11434)
```

---

## Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running: `pnpm dev:docker`
- Test connection: `psql $DATABASE_URL`

### "Token encryption error"
- Ensure `TOKEN_ENCRYPTION_KEY` is exactly 64 hex characters
- Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### "Ollama not available"
- Start Ollama: `ollama serve`
- Check it's running: `curl http://localhost:11434/api/tags`
- Pull model: `ollama pull llama3.2`
- Set `OPENAI_API_KEY` as fallback if needed

### "Meta OAuth callback error"
- Verify redirect URI matches exactly in Meta App settings
- Check `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`
- Ensure app is in Development mode for testing

### "FFmpeg not found"
- Install FFmpeg: https://ffmpeg.org/download.html
- Windows: `winget install ffmpeg` or download from ffmpeg.org
- Mac: `brew install ffmpeg`
- Linux: `apt install ffmpeg`
