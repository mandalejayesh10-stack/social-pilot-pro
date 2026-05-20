#!/usr/bin/env node
/**
 * SocialPilot Pro — Stripe Setup Helper
 * Run: node scripts/setup-stripe.js
 *
 * This script helps you create Stripe products and prices,
 * then automatically updates your .env file.
 */

require('dotenv').config();
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

const ENV_FILE = path.join(__dirname, '..', '.env');

function updateEnv(key, value) {
  let content = fs.readFileSync(ENV_FILE, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}="${value}"`);
  } else {
    content += `\n${key}="${value}"`;
  }
  fs.writeFileSync(ENV_FILE, content);
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         SocialPilot Pro — Stripe Setup                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey || stripeKey.trim() === '') {
    console.log('❌ STRIPE_SECRET_KEY is not set in .env\n');
    console.log('Steps to get your Stripe keys:');
    console.log('  1. Go to https://dashboard.stripe.com');
    console.log('  2. Click "Developers" → "API keys"');
    console.log('  3. Copy your Secret key (starts with sk_test_ or sk_live_)');
    console.log('  4. Add to .env: STRIPE_SECRET_KEY=sk_test_...\n');

    const key = await ask('Enter your Stripe Secret Key (or press Enter to skip): ');
    if (!key.trim()) {
      console.log('\nSkipping Stripe setup. Add STRIPE_SECRET_KEY to .env and re-run.');
      rl.close();
      return;
    }
    updateEnv('STRIPE_SECRET_KEY', key.trim());
    process.env.STRIPE_SECRET_KEY = key.trim();
    console.log('✅ STRIPE_SECRET_KEY saved to .env\n');
  }

  // Try to load Stripe
  let stripe;
  try {
    const Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' });
  } catch (e) {
    console.log('❌ Stripe package not found. Run: pnpm install');
    rl.close();
    return;
  }

  console.log('✅ Connected to Stripe\n');

  // Check if products already exist
  console.log('── Creating Products & Prices ─────────────────────────────\n');

  const PLANS = [
    {
      name: 'SocialPilot Pro — Pro Plan',
      description: '10 social accounts, 500 posts/month, AI features, PDF reports',
      monthlyPrice: 2900,  // $29.00
      yearlyPrice: 29000,  // $290.00
      envMonthly: 'STRIPE_PRICE_PRO_MONTHLY',
      envYearly: 'STRIPE_PRICE_PRO_YEARLY',
    },
    {
      name: 'SocialPilot Pro — Agency Plan',
      description: 'Unlimited accounts, unlimited posts, team collaboration, API access',
      monthlyPrice: 9900,  // $99.00
      yearlyPrice: 99000,  // $990.00
      envMonthly: 'STRIPE_PRICE_AGENCY_MONTHLY',
      envYearly: 'STRIPE_PRICE_AGENCY_YEARLY',
    },
  ];

  for (const plan of PLANS) {
    console.log(`Creating: ${plan.name}`);

    try {
      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { platform: 'socialpilot-pro' },
      });

      // Create monthly price
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyPrice,
        currency: 'usd',
        recurring: { interval: 'month' },
        nickname: `${plan.name} - Monthly`,
      });

      // Create yearly price
      const yearlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyPrice,
        currency: 'usd',
        recurring: { interval: 'year' },
        nickname: `${plan.name} - Yearly`,
      });

      // Save to .env
      updateEnv(plan.envMonthly, monthlyPrice.id);
      updateEnv(plan.envYearly, yearlyPrice.id);

      console.log(`  ✅ Product: ${product.id}`);
      console.log(`  ✅ Monthly: ${monthlyPrice.id} ($${plan.monthlyPrice / 100}/mo)`);
      console.log(`  ✅ Yearly:  ${yearlyPrice.id} ($${plan.yearlyPrice / 100}/yr)\n`);
    } catch (e) {
      console.log(`  ❌ Failed: ${e.message}\n`);
    }
  }

  // Webhook setup
  console.log('── Webhook Setup ──────────────────────────────────────────\n');
  const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000';
  const webhookUrl = `${backendUrl}/api/billing/webhook/stripe`;

  console.log('To set up webhooks:');
  console.log('  1. Go to https://dashboard.stripe.com/webhooks');
  console.log('  2. Click "Add endpoint"');
  console.log(`  3. URL: ${webhookUrl}`);
  console.log('  4. Select events:');
  console.log('     - checkout.session.completed');
  console.log('     - customer.subscription.updated');
  console.log('     - customer.subscription.deleted');
  console.log('     - invoice.payment_succeeded');
  console.log('     - invoice.payment_failed');
  console.log('  5. Copy the "Signing secret" (starts with whsec_)');
  console.log('  6. Add to .env: STRIPE_SIGNING_KEY=whsec_...\n');

  const signingKey = await ask('Enter your Stripe Webhook Signing Secret (or press Enter to skip): ');
  if (signingKey.trim()) {
    updateEnv('STRIPE_SIGNING_KEY', signingKey.trim());
    console.log('✅ STRIPE_SIGNING_KEY saved to .env\n');
  }

  // Publishable key
  const pubKey = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!pubKey || pubKey.trim() === '') {
    const pk = await ask('Enter your Stripe Publishable Key (starts with pk_): ');
    if (pk.trim()) {
      updateEnv('STRIPE_PUBLISHABLE_KEY', pk.trim());
      console.log('✅ STRIPE_PUBLISHABLE_KEY saved to .env\n');
    }
  }

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              Stripe Setup Complete! ✅                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log('Next steps:');
  console.log('  1. Restart the backend: pnpm dev:backend:only');
  console.log('  2. Test billing at: http://localhost:4200/dashboard/billing');
  console.log('  3. Use Stripe test card: 4242 4242 4242 4242\n');

  rl.close();
}

main().catch((e) => {
  console.error('Error:', e.message);
  rl.close();
  process.exit(1);
});
