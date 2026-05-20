# OAuth Setup Guide — SocialPilot Pro

## Your Permanent ngrok Domain
```
https://grudging-kinfolk-feminist.ngrok-free.dev
```
This domain is **fixed** — never changes. Set it once in all consoles.

---

## Google OAuth (Login + YouTube)

### Redirect URIs to add in Google Console
Go to: https://console.cloud.google.com/apis/credentials → Click **SocialPilot Pro Web**

Add these to **Authorized redirect URIs**:
```
https://grudging-kinfolk-feminist.ngrok-free.dev/api/auth/google/callback
https://grudging-kinfolk-feminist.ngrok-free.dev/api/integrations/youtube/callback
http://localhost:3000/api/auth/google/callback
http://localhost:3000/api/integrations/youtube/callback
```
Click **Save**

### Add test user (required while app is in Testing mode)
Go to: https://console.cloud.google.com → **OAuth consent screen** → **Test users**
Add: `mandalejayesh10@gmail.com`

### Current credentials in .env
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
YOUTUBE_CLIENT_ID=your_youtube_client_id_here
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret_here
```

> Copy values from your local `.env` file — never commit real credentials.

---

## Meta (Facebook + Instagram)

### Redirect URI to add in Meta Developer Console
Go to: https://developers.facebook.com → Your App (1497159925293114) → **Facebook Login → Settings**

Add to **Valid OAuth Redirect URIs**:
```
https://grudging-kinfolk-feminist.ngrok-free.dev/api/integrations/meta/callback
http://localhost:3000/api/integrations/meta/callback
```
Click **Save Changes**

### Current credentials in .env
```env
FACEBOOK_APP_ID=1497159925293114
FACEBOOK_APP_SECRET=8d0e4a6b56134d8ba0e5ecddcf5cac23
```

---

## Starting the Tunnel

### Option 1 — Using npm script (recommended)
```bash
pnpm tunnel
```

### Option 2 — Direct command
```bash
C:\ngrok\ngrok.exe http --domain=grudging-kinfolk-feminist.ngrok-free.dev 3000
```

### Option 3 — Using config file
```bash
C:\ngrok\ngrok.exe start --config ngrok.yml backend
```

---

## Full Startup Sequence

```bash
# Terminal 1 — Start PostgreSQL
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\16\data" -w

# Terminal 2 — Start ngrok tunnel
C:\ngrok\ngrok.exe http --domain=grudging-kinfolk-feminist.ngrok-free.dev 3000

# Terminal 3 — Start backend
pnpm --filter @socialpilot/backend run dev

# Terminal 4 — Start frontend
pnpm --filter @socialpilot/frontend run dev
```

---

## Verify Everything Works

```bash
node scripts/check-env.js
```

Test URLs:
- Frontend: http://localhost:4200
- Backend (local): http://localhost:3000/api/health
- Backend (tunnel): https://grudging-kinfolk-feminist.ngrok-free.dev/api/health
- Google OAuth: https://grudging-kinfolk-feminist.ngrok-free.dev/api/auth/google/status
- Connections: http://localhost:4200/dashboard/settings/connections

---

## Troubleshooting

### "Access blocked: not completed verification"
Add your email as a test user in Google Console → OAuth consent screen → Test users

### "Invalid OAuth redirect URI" (Meta)
Make sure you added the ngrok URL to Facebook Login → Settings → Valid OAuth Redirect URIs

### ngrok shows browser warning page
The frontend API client already sends `ngrok-skip-browser-warning: true` header automatically.

### Tunnel URL changed
Your domain is permanent (`grudging-kinfolk-feminist.ngrok-free.dev`) — it never changes as long as you use the same ngrok account.
