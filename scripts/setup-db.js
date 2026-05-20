#!/usr/bin/env node
/**
 * Database Setup Helper
 * Guides you through setting up PostgreSQL for SocialPilot Pro
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║     SocialPilot Pro — Database Setup     ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log('Choose your PostgreSQL option:\n');
  console.log('  1. Supabase (FREE, hosted, recommended for quick start)');
  console.log('     → https://supabase.com → New project → Settings → Database → URI\n');
  console.log('  2. Local PostgreSQL (already installed)');
  console.log('     → postgresql://postgres:password@localhost:5432/socialpilot_dev\n');
  console.log('  3. Neon (FREE, serverless PostgreSQL)');
  console.log('     → https://neon.tech → New project → Connection string\n');

  const choice = await ask('Enter your DATABASE_URL (paste connection string): ');

  if (!choice.startsWith('postgresql://') && !choice.startsWith('postgres://')) {
    console.log('\n❌ Invalid connection string. Must start with postgresql:// or postgres://');
    rl.close();
    return;
  }

  // Update .env
  const envPath = path.join(__dirname, '..', '.env');
  let env = fs.readFileSync(envPath, 'utf8');
  env = env.replace(
    /DATABASE_URL=".+"/,
    `DATABASE_URL="${choice.trim()}"`,
  );
  fs.writeFileSync(envPath, env);

  console.log('\n✅ DATABASE_URL updated in .env');
  console.log('\nNext steps:');
  console.log('  pnpm prisma-db-push   ← Push schema to database');
  console.log('  pnpm prisma-seed      ← Create admin user');
  console.log('  pnpm dev              ← Start the app\n');

  rl.close();
}

main().catch(e => { console.error(e); rl.close(); });
