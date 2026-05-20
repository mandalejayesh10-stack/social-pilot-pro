# SocialPilot Pro — Quick Start Guide

## Prerequisites
- Node.js 22+
- pnpm 10.6.1+
- PostgreSQL 16 (installed at `C:\Program Files\PostgreSQL\16`)
- ngrok (installed at `C:\ngrok\ngrok.exe`)

---

## 🚀 Start Everything (3 terminals)

### Terminal 1 — PostgreSQL
```powershell
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\16\data" -w
```

### Terminal 2 — Backend + Frontend
```powershell
pnpm dev:backend
```
- Backend: http://localhost:3000
- Frontend: http://localhost:4200
- API Docs: http://localhost:3000/api/docs

### Terminal 3 — ngrok Tunnel (for OAuth)
```powershell
pnpm tunnel
```
- Tunnel: https://grudging-kinfolk-feminist.ngrok-free.dev

---

## 🔑 Login Credentials
- **Email:** `admin@socialpilotpro.com`
- **Password:** `Admin@123456`

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:3000/api/docs |
| ngrok Tunnel | https://grudging-kinfolk-feminist.ngrok-free.dev |
| Connect Accounts | http://localhost:4200/dashboard/settings/connections |
| Analytics | http://localhost:4200/dashboard/analytics |
| AI Studio | http://localhost:4200/dashboard/ai |
| Billing | http://localhost:4200/dashboard/billing |

---

## ⚠️ Before Testing OAuth (One-time Setup)

### Google OAuth (Login + YouTube)
1. Go to https://console.cloud.google.com
2. Select your project → APIs & Services → Credentials
3. Click your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs:**
   ```
   https://grudging-kinfolk-feminist.ngrok-free.dev/api/auth/google/callback
   https://grudging-kinfolk-feminist.ngrok-free.dev/api/integrations/youtube/callback
   http://localhost:3000/api/auth/google/callback
   http://localhost:3000/api/integrations/youtube/callback
   ```
5. Go to **OAuth consent screen** → **Test users** → Add `mandalejayesh10@gmail.com`

### Meta OAuth (Instagram + Facebook)
1. Go to https://developers.facebook.com
2. Select your app (ID: 1497159925293114)
3. Facebook Login → Settings → Valid OAuth Redirect URIs:
   ```
   https://grudging-kinfolk-feminist.ngrok-free.dev/api/integrations/meta/callback
   http://localhost:3000/api/integrations/meta/callback
   ```

---

## 🛠️ Useful Commands

```powershell
# Check environment variables
pnpm check:env

# Set up Stripe billing
node scripts/setup-stripe.js

# Reset database
pnpm prisma-reset
pnpm prisma-db-push
pnpm prisma-seed

# View database (Prisma Studio)
pnpm prisma-studio

# Build for production
pnpm build
```

---

## 🔧 Environment Variables

Key variables in `.env`:

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/socialpilot_dev` | Database |
| `FRONTEND_URL` | `http://localhost:4200` | CORS + redirects |
| `NEXT_PUBLIC_BACKEND_URL` | `https://grudging-kinfolk-feminist.ngrok-free.dev` | OAuth redirect URIs (browser) |
| `BACKEND_PROXY_URL` | `http://localhost:3000` | Next.js server proxy (always localhost) |
| `BACKEND_INTERNAL_URL` | `https://grudging-kinfolk-feminist.ngrok-free.dev` | OAuth callback URIs (backend) |

---

## 🐛 Troubleshooting

### Backend won't start
```powershell
# Check PostgreSQL is running
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" status -D "C:\Program Files\PostgreSQL\16\data"

# Start PostgreSQL
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\16\data" -w
```

### OAuth redirect_uri_mismatch
- Make sure ngrok is running: `pnpm tunnel`
- Make sure redirect URIs are added in Google/Meta console (see above)
- The URI must match **exactly** (no trailing slash)

### Frontend can't reach backend
- Check `BACKEND_PROXY_URL=http://localhost:3000` in `.env`
- Make sure backend is running on port 3000

### "Invalid client_id" error
- Check `GOOGLE_CLIENT_ID` in `.env` is exactly 72 characters
- Current: `604892324188-0qk6kpo2qrsddnh146gej5u9jdfioskt.apps.googleusercontent.com`

### AI features not working
- Install Ollama: https://ollama.ai
- Pull model: `ollama pull llama3.2`
- Start Ollama: `ollama serve`

---

## 📁 Project Structure

```
apps/
  backend/    → NestJS API (port 3000)
  frontend/   → Next.js 16 (port 4200)
libraries/
  nestjs-libraries/src/database/prisma/  → Schema & seed
scripts/      → Setup & utility scripts
.env          → Environment variables
ngrok.yml     → ngrok tunnel config
```

---

## 🎯 Feature Checklist

- [x] Email/password authentication
- [x] Google OAuth login
- [x] Dashboard with analytics overview
- [x] Content calendar with post scheduling
- [x] Instagram analytics
- [x] Facebook analytics
- [x] YouTube analytics
- [x] AI caption generator (requires Ollama)
- [x] AI hashtag suggester (requires Ollama)
- [x] AI analytics chatbot (requires Ollama)
- [x] Media library with video processing
- [x] PDF report generation
- [x] Team workspaces & roles
- [x] API key management
- [x] Notification preferences
- [ ] Stripe billing (needs price IDs — run `node scripts/setup-stripe.js`)
- [ ] Email notifications (needs Resend API key)
