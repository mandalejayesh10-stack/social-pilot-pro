#!/usr/bin/env node
/**
 * Quick script to update Google OAuth credentials in .env
 * Run: node scripts/set-google-oauth.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

async function main() {
  console.log('\n=== Update Google OAuth Credentials ===\n');
  console.log('Get these from: https://console.cloud.google.com/apis/credentials');
  console.log('Click your OAuth 2.0 Client → copy Client ID and Client Secret\n');

  const clientId = await ask('Paste Client ID (ends with .apps.googleusercontent.com): ');
  const clientSecret = await ask('Paste Client Secret (starts with GOCSPX-): ');

  // Validate format
  if (!clientId.includes('.apps.googleusercontent.com')) {
    console.log('\n❌ Invalid Client ID format. Should end with .apps.googleusercontent.com');
    rl.close(); return;
  }
  if (!clientSecret.startsWith('GOCSPX-')) {
    console.log('\n❌ Invalid Client Secret format. Should start with GOCSPX-');
    rl.close(); return;
  }

  // Extract middle part length
  const parts = clientId.split('-');
  const middle = parts[1]?.split('.')[0];
  console.log(`\nClient ID parts: ${parts[0]} - ${middle} .apps.googleusercontent.com`);
  console.log(`Middle part length: ${middle?.length} (should be 32)`);

  if (middle?.length !== 32) {
    console.log(`\n⚠️  Warning: middle part is ${middle?.length} chars, expected 32. Double-check the Client ID.`);
    const proceed = await ask('Continue anyway? (y/N): ');
    if (proceed.toLowerCase() !== 'y') { rl.close(); return; }
  }

  // Update .env
  const envPath = path.join(__dirname, '..', '.env');
  let env = fs.readFileSync(envPath, 'utf8');

  env = env.replace(/^GOOGLE_CLIENT_ID=.*/m,     `GOOGLE_CLIENT_ID="${clientId.trim()}"`);
  env = env.replace(/^GOOGLE_CLIENT_SECRET=.*/m, `GOOGLE_CLIENT_SECRET="${clientSecret.trim()}"`);
  env = env.replace(/^YOUTUBE_CLIENT_ID=.*/m,    `YOUTUBE_CLIENT_ID="${clientId.trim()}"`);
  env = env.replace(/^YOUTUBE_CLIENT_SECRET=.*/m,`YOUTUBE_CLIENT_SECRET="${clientSecret.trim()}"`);

  fs.writeFileSync(envPath, env);

  console.log('\n✅ .env updated successfully!');
  console.log('\nNow restart the backend:');
  console.log('  pnpm --filter @socialpilot/backend run dev\n');

  rl.close();
}

main().catch(e => { console.error(e); rl.close(); });
