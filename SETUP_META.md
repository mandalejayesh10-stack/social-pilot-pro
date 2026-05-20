# Setting Up Meta (Facebook + Instagram) Integration

## Prerequisites
- A Facebook account
- A Facebook Page (required for Instagram Business)
- An Instagram Business or Creator account linked to your Facebook Page

---

## Step 1 — Create a Meta App

1. Go to https://developers.facebook.com
2. Click **My Apps → Create App**
3. Select **Business** as the app type → **Next**
4. Fill in:
   - App name: `SocialPilot Pro`
   - Contact email: your email
5. Click **Create App**

---

## Step 2 — Add Required Products

In your app dashboard, click **Add Product** and add:

### Facebook Login
1. Click **Set Up** on Facebook Login
2. Go to **Facebook Login → Settings**
3. Add Valid OAuth Redirect URIs:
   ```
   http://localhost:3000/api/integrations/meta/callback
   ```
4. Save changes

### Instagram Graph API
1. Click **Add Product → Instagram Graph API → Set Up**

---

## Step 3 — Configure App Settings

1. Go to **Settings → Basic**
2. Note your **App ID** and **App Secret**
3. Add **App Domains**: `localhost`
4. Set **Privacy Policy URL**: `http://localhost:4200/legal/privacy`
5. Set **Terms of Service URL**: `http://localhost:4200/legal/terms`
6. Save changes

---

## Step 4 — Set Required Permissions

Go to **App Review → Permissions and Features** and request:
- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`
- `instagram_manage_insights`
- `read_insights`

> **Note:** For development/testing, you can use these without approval. For production with real users, you need Meta App Review.

---

## Step 5 — Add to .env

```env
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
META_API_VERSION=v21.0
```

---

## Step 6 — Restart Backend

```bash
pnpm --filter @socialpilot/backend run dev
```

---

## Step 7 — Connect Your Account

1. Open http://localhost:4200/dashboard/settings/connections
2. Click **Connect Instagram** or **Connect Facebook**
3. Authorize the app
4. Your accounts will appear in the list

---

## Troubleshooting

### "Invalid OAuth redirect URI"
The redirect URI must match exactly:
```
http://localhost:3000/api/integrations/meta/callback
```

### "App not set up"
Make sure you've added Facebook Login as a product and configured the redirect URI.

### "Instagram account not found"
Your Instagram account must be:
1. A **Business** or **Creator** account (not personal)
2. **Linked to a Facebook Page** you manage

To convert: Instagram → Settings → Account → Switch to Professional Account

### "Permissions not granted"
In development mode, only app admins/testers can use the app. Add yourself as a tester:
App Dashboard → Roles → Add Testers

---

## For Production

1. Complete **Meta App Review** for all required permissions
2. Update redirect URI to production domain
3. Set app to **Live** mode in the dashboard
