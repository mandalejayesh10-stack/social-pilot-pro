# OAuth Setup — Exact Steps

**Your accounts:**
- Meta Developer: `bamandlajayesh@gmail.com`  
- Google Cloud: `mandalejayesh10@gmail.com`  
- ngrok domain: `https://grudging-kinfolk-feminist.ngrok-free.dev`

---

## PART 1 — Google Console (Login + YouTube)

**Login at:** https://console.cloud.google.com  
**Account:** `mandalejayesh10@gmail.com`

### Step 1 — Add Redirect URIs

1. Open: https://console.cloud.google.com/apis/credentials
2. Click your **OAuth 2.0 Client ID** (the one with Client ID starting with `604892324188-`)
3. Scroll to **"Authorized redirect URIs"**
4. Click **"+ ADD URI"** and add ALL 4 of these (one by one):

```
https://grudging-kinfolk-feminist.ngrok-free.dev/api/auth/google/callback
https://grudging-kinfolk-feminist.ngrok-free.dev/api/integrations/youtube/callback
http://localhost:3000/api/auth/google/callback
http://localhost:3000/api/integrations/youtube/callback
```

5. Click **SAVE**

### Step 2 — Add Test User

1. Open: https://console.cloud.google.com/apis/credentials/consent
2. Scroll down to **"Test users"** section
3. Click **"+ ADD USERS"**
4. Add: `mandalejayesh10@gmail.com`
5. Click **SAVE**

### Step 3 — Enable YouTube APIs

1. Open: https://console.cloud.google.com/apis/library
2. Search **"YouTube Data API v3"** → Click → **ENABLE**
3. Search **"YouTube Analytics API"** → Click → **ENABLE**

✅ Google setup done!

---

## PART 2 — Meta Developer Console (Instagram + Facebook)

**Login at:** https://developers.facebook.com  
**Account:** `bamandlajayesh@gmail.com`  
**App ID:** `1497159925293114`

### Step 1 — Add OAuth Redirect URIs

1. Go to: https://developers.facebook.com/apps/1497159925293114/fb-login/settings/
2. Find **"Valid OAuth Redirect URIs"**
3. Add BOTH of these:

```
https://grudging-kinfolk-feminist.ngrok-free.dev/api/integrations/meta/callback
http://localhost:3000/api/integrations/meta/callback
```

4. Click **Save Changes**

### Step 2 — Add Test User (if app is in Development mode)

1. Go to: https://developers.facebook.com/apps/1497159925293114/roles/test-users/
2. Click **"Create a Test User"** OR
3. Go to **Roles** → **Test Users** → Add your personal Facebook account as tester

### Step 3 — Verify App Settings

1. Go to: https://developers.facebook.com/apps/1497159925293114/settings/basic/
2. Confirm:
   - **App ID:** `1497159925293114` ✅
   - **App Secret:** (should match `.env`) ✅
   - **App Domains:** Add `grudging-kinfolk-feminist.ngrok-free.dev`
3. Click **Save Changes**

### Step 4 — Check Required Permissions

1. Go to: https://developers.facebook.com/apps/1497159925293114/app-review/permissions/
2. Make sure these are added (for development, they're auto-approved):
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `read_insights`

✅ Meta setup done!

---

## PART 3 — Start Everything & Test

### Terminal 1 — Start PostgreSQL
```powershell
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\16\data" -w
```

### Terminal 2 — Start Backend + Frontend
```powershell
pnpm dev:backend
```

### Terminal 3 — Start ngrok Tunnel
```powershell
pnpm tunnel
```

### Test OAuth

1. Open: http://localhost:4200/login
2. Click **"Continue with Google"** → should redirect to Google → login with `mandalejayesh10@gmail.com`
3. Open: http://localhost:4200/dashboard/settings/connections
4. Click **"Connect Instagram"** or **"Connect Facebook"** → should redirect to Meta

---

## Troubleshooting

### "redirect_uri_mismatch" (Google)
- ngrok must be running (`pnpm tunnel`)
- URI must match **exactly** — copy-paste from above, no trailing slash

### "URL Blocked" (Meta)
- Add `grudging-kinfolk-feminist.ngrok-free.dev` to App Domains in Meta settings
- Make sure both redirect URIs are saved

### "This app is in development mode" (Meta)
- Only test users can connect
- Add yourself as a test user (Step 2 above)

### Google OAuth shows "Access blocked"
- App is in testing mode — only test users can login
- Add `mandalejayesh10@gmail.com` as test user (Step 2 above)

---

## Current .env Values (Already Configured)

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
YOUTUBE_CLIENT_ID=your_youtube_client_id_here
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret_here
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
BACKEND_INTERNAL_URL=https://your-ngrok-domain.ngrok-free.dev
```

Copy values from your `.env` file — do not commit real credentials to git.

---

## After Setup — What Works

| Feature | How to Test |
|---------|-------------|
| Google Login | http://localhost:4200/login → "Continue with Google" |
| YouTube Connect | http://localhost:4200/dashboard/settings/connections → Connect YouTube |
| Instagram Connect | http://localhost:4200/dashboard/settings/connections → Connect Instagram |
| Facebook Connect | http://localhost:4200/dashboard/settings/connections → Connect Facebook |
| Analytics | Connect accounts → wait 15 min → http://localhost:4200/dashboard/analytics |
| Post Scheduling | http://localhost:4200/dashboard/calendar → New Post |
