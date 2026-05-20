#!/usr/bin/env node
/**
 * SocialPilot Pro — Environment Check Script
 * Run: node scripts/check-env.js
 *
 * Checks all environment variables and tells you exactly what's missing.
 */

require('dotenv').config();

const CHECKS = [
  // ── Required ──────────────────────────────────────────────
  { key: 'DATABASE_URL',        required: true,  category: 'Database',      hint: 'postgresql://user:pass@localhost:5432/dbname' },
  { key: 'JWT_SECRET',          required: true,  category: 'Auth',          hint: 'Random 64+ char string' },
  { key: 'TOKEN_ENCRYPTION_KEY',required: true,  category: 'Auth',          hint: '64-char hex string (run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))")' },

  // ── Google OAuth ──────────────────────────────────────────
  { key: 'GOOGLE_CLIENT_ID',     required: false, category: 'Google OAuth',  hint: 'From console.cloud.google.com → Credentials → OAuth 2.0 Client ID' },
  { key: 'GOOGLE_CLIENT_SECRET', required: false, category: 'Google OAuth',  hint: 'From console.cloud.google.com → Credentials → OAuth 2.0 Client Secret' },

  // ── YouTube ───────────────────────────────────────────────
  { key: 'YOUTUBE_CLIENT_ID',     required: false, category: 'YouTube',      hint: 'Same Google Cloud project as Google OAuth' },
  { key: 'YOUTUBE_CLIENT_SECRET', required: false, category: 'YouTube',      hint: 'Same Google Cloud project as Google OAuth' },

  // ── Meta ──────────────────────────────────────────────────
  { key: 'FACEBOOK_APP_ID',     required: false, category: 'Meta (IG+FB)',   hint: 'From developers.facebook.com → Your App → Settings → Basic' },
  { key: 'FACEBOOK_APP_SECRET', required: false, category: 'Meta (IG+FB)',   hint: 'From developers.facebook.com → Your App → Settings → Basic' },

  // ── Stripe ────────────────────────────────────────────────
  { key: 'STRIPE_SECRET_KEY',       required: false, category: 'Stripe',     hint: 'From dashboard.stripe.com → Developers → API keys' },
  { key: 'STRIPE_PUBLISHABLE_KEY',  required: false, category: 'Stripe',     hint: 'From dashboard.stripe.com → Developers → API keys' },
  { key: 'STRIPE_SIGNING_KEY',      required: false, category: 'Stripe',     hint: 'From dashboard.stripe.com → Webhooks → Signing secret' },

  // ── URLs ──────────────────────────────────────────────────
  { key: 'FRONTEND_URL',            required: true,  category: 'URLs',       hint: 'http://localhost:4200' },
  { key: 'NEXT_PUBLIC_BACKEND_URL', required: true,  category: 'URLs',       hint: 'http://localhost:3000' },
];

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║         SocialPilot Pro — Environment Check              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

let hasErrors = false;
let hasWarnings = false;
const categories = {};

for (const check of CHECKS) {
  const val = process.env[check.key];
  const isSet = val && val.trim() !== '';

  if (!categories[check.category]) categories[check.category] = [];
  categories[check.category].push({ ...check, isSet, val });
}

for (const [cat, items] of Object.entries(categories)) {
  console.log(`\n── ${cat} ${'─'.repeat(Math.max(0, 50 - cat.length))}`);
  for (const item of items) {
    if (item.isSet) {
      const display = item.val.length > 40 ? item.val.slice(0, 20) + '...' + item.val.slice(-8) : item.val;
      console.log(`  ✅ ${item.key.padEnd(30)} = ${display}`);
    } else if (item.required) {
      console.log(`  ❌ ${item.key.padEnd(30)} MISSING (REQUIRED)`);
      console.log(`     → ${item.hint}`);
      hasErrors = true;
    } else {
      console.log(`  ⚠️  ${item.key.padEnd(30)} not set (feature disabled)`);
      console.log(`     → ${item.hint}`);
      hasWarnings = true;
    }
  }
}

console.log('\n' + '═'.repeat(62));

if (hasErrors) {
  console.log('\n❌ ERRORS: Required variables are missing. Fix them before starting.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  WARNINGS: Some optional features are disabled.');
  console.log('   The app will start but those features won\'t work.\n');

  // Special Google OAuth guidance
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!googleId || !googleSecret) {
    console.log('📋 To enable Google OAuth login:');
    console.log('   1. Go to https://console.cloud.google.com');
    console.log('   2. Create/select a project');
    console.log('   3. APIs & Services → Credentials → Create OAuth 2.0 Client ID');
    console.log('   4. Application type: Web application');
    console.log('   5. Authorized redirect URIs:');
    console.log(`      ${process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000'}/api/auth/google/callback`);
    console.log(`      ${process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000'}/api/integrations/youtube/callback`);
    console.log('   6. Add to .env:');
    console.log('      GOOGLE_CLIENT_ID=your_client_id');
    console.log('      GOOGLE_CLIENT_SECRET=your_client_secret');
    console.log('      YOUTUBE_CLIENT_ID=your_client_id  (same values)');
    console.log('      YOUTUBE_CLIENT_SECRET=your_client_secret  (same values)');
    console.log('   7. Restart backend\n');
  }
} else {
  console.log('\n✅ All environment variables are configured!\n');
}
