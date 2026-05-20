# ⚡ SocialPilot Pro

> Production-grade Social Media SaaS Platform — Schedule, Analyze, and Grow.

Built on the Postiz architecture, redesigned with a premium Metricool-inspired UI, and extended with a full custom analytics pipeline, AI assistant, media processing, and global billing.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📅 **Content Scheduler** | Multi-platform scheduling with calendar view, bulk scheduling, drag-and-drop |
| 📊 **Analytics Pipeline** | Real data from Meta + YouTube APIs, precomputed metrics, no real-time fetching |
| 🤖 **AI Studio** | Caption generation, hashtag suggestions, analytics insights — powered by Ollama (free) |
| 💬 **AI Chatbot** | In-app assistant that answers analytics questions using your real data |
| 🎬 **Media Processing** | FFmpeg-powered video trimming, audio merging, volume control |
| 📄 **PDF Reports** | AI-generated analytics reports with Puppeteer, email delivery |
| 💳 **Global Billing** | Stripe integration with multi-currency, tax, invoices, feature gating |
| 🏢 **Multi-Brand** | Multiple workspaces per user, team roles (Admin/Editor/Viewer) |
| 🔐 **Auth** | Google OAuth + email/password, JWT, AES-256 token encryption |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (:4200)                  │
│  Dashboard │ Calendar │ Analytics │ AI Studio │ Reports      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (proxied via Next.js rewrites)
┌──────────────────────▼──────────────────────────────────────┐
│              NestJS Backend API (:3000)                      │
│  Auth │ Posts │ Analytics │ Billing │ AI │ Media │ Reports   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  PostgreSQL Database                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│           Orchestrator (:3001) — Background Jobs             │
│  Post Scheduler (1min) │ Analytics Pipeline │ Token Refresh  │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Meta Graph     YouTube Data    Ollama LLM
   API (IG+FB)    API v3          (:11434)
```

### Data Pipeline Flow
```
Cron (15min/1hr/daily)
  → Fetch from Meta/YouTube APIs
  → Store RAW data (analytics_raw)
  → Compute metrics (post_metrics, account_metrics)
  → Aggregate summaries (analytics_summary)
  → Serve precomputed data to dashboard (<1s load)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.x
- pnpm >= 10.6.1 (`npm install -g pnpm@10.6.1`)
- PostgreSQL 16 (or Docker)
- Ollama (optional, for AI features)

### 1. Install & Configure
```bash
pnpm install
node scripts/setup.js    # Interactive setup wizard
```

### 2. Start Database
```bash
make docker-up           # Starts PostgreSQL + Ollama via Docker
# OR start PostgreSQL manually and update DATABASE_URL in .env
```

### 3. Initialize Database
```bash
make db-push             # Push schema
make db-seed             # Create admin user + demo workspace
```

### 4. Start AI (optional)
```bash
ollama pull llama3.2
ollama serve
```

### 5. Start Development
```bash
make dev
# OR: pnpm dev
```

### 6. Open Browser
| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| API | http://localhost:3000 |
| API Docs | http://localhost:3000/api/docs |

**Default login:** `admin@socialpilotpro.com` / `Admin@123456`

---

## 📁 Project Structure

```
socialpilot-pro/
├── apps/
│   ├── backend/          NestJS API (14 modules)
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/           JWT + Google OAuth
│   │       │   ├── integration/    Meta + YouTube OAuth
│   │       │   ├── post/           Scheduler + publisher
│   │       │   ├── pipeline/       Analytics data pipeline
│   │       │   ├── analytics/      Precomputed metrics API
│   │       │   ├── media/          FFmpeg processing
│   │       │   ├── ai/             Ollama integration
│   │       │   ├── billing/        Stripe + invoices
│   │       │   ├── report/         PDF generation
│   │       │   └── ...
│   │       └── common/             Guards, filters, utils
│   │
│   ├── frontend/         Next.js 16 App Router
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (dashboard)/    Protected pages
│   │       │   ├── (auth)/         Login/Register
│   │       │   └── (site)/         Legal pages
│   │       ├── components/
│   │       │   ├── ui/             Design system (15 components)
│   │       │   ├── layout/         Sidebar, Topbar
│   │       │   ├── analytics/      Platform analytics
│   │       │   └── posts/          Post composer
│   │       └── lib/                API client, hooks, store
│   │
│   └── orchestrator/     Background jobs (NestJS)
│       └── src/
│           ├── pipeline/   Analytics cron jobs
│           ├── scheduler/  Post publisher
│           └── token/      Token refresh
│
├── libraries/
│   └── nestjs-libraries/  Shared Prisma schema
│       └── src/database/prisma/schema.prisma
│
├── scripts/
│   └── setup.js           Interactive setup wizard
│
├── docker-compose.yaml    Production Docker stack
├── docker-compose.dev.yaml Dev Docker (Postgres + Ollama)
├── Makefile               Developer commands
├── SETUP.md               Complete setup guide
└── .env.example           Environment template
```

---

## 🔌 API Integrations

### Meta (Facebook + Instagram)
1. Create app at [developers.facebook.com](https://developers.facebook.com)
2. Add: Facebook Login, Instagram Graph API
3. Set redirect: `http://localhost:3000/api/integrations/meta/callback`
4. Add to `.env`: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`

### YouTube
1. Create project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable: YouTube Data API v3, YouTube Analytics API
3. Set redirect: `http://localhost:3000/api/integrations/youtube/callback`
4. Add to `.env`: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`

### Stripe
1. Get keys from [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create products: Pro Monthly/Yearly, Agency Monthly/Yearly
3. Set webhook: `https://yourdomain.com/api/billing/webhook/stripe`
4. Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

---

## 💰 Subscription Plans

| Feature | Free | Pro ($29/mo) | Agency ($99/mo) |
|---------|------|--------------|-----------------|
| Social accounts | 3 | 10 | Unlimited |
| Posts/month | 10 | 500 | Unlimited |
| Analytics depth | 7 days | 90 days | 90 days |
| PDF reports | ❌ | 5/month | Unlimited |
| AI credits | 10 | 100 | Unlimited |
| Team members | 1 | 5 | Unlimited |
| Media processing | ❌ | ✅ | ✅ |
| API access | ❌ | ✅ | ✅ |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, Tailwind CSS, Recharts, Zustand, SWR |
| Backend | NestJS 10, Prisma ORM, JWT |
| Database | PostgreSQL 16 |
| Queue | DB-based (no Redis required) |
| AI | Ollama (local LLM, zero cost) + OpenAI fallback |
| Storage | Local filesystem / Supabase Storage |
| Media | FFmpeg via fluent-ffmpeg |
| Reports | Puppeteer PDF generation |
| Payments | Stripe (global) |
| Email | Resend |
| Auth | Google OAuth + email/password |

---

## 🔒 Security

- AES-256-GCM encryption for all OAuth tokens at rest
- HTTP-only cookies for JWT sessions
- Rate limiting (20 req/s short, 100 req/min medium)
- Security headers (X-Frame-Options, CSP, HSTS)
- Input validation with class-validator
- Parameterized queries via Prisma (no SQL injection)

---

## 📜 Legal

- Privacy Policy: `/legal/privacy`
- Terms of Service: `/legal/terms`
- Required for Meta App Review and Google OAuth verification

---

## 🤝 Contributing

See [SETUP.md](./SETUP.md) for the complete development guide.

---

## 📄 License

AGPL-3.0 — See [LICENSE](./LICENSE)
