'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { billingApi } from '@/lib/api';
import { useOrgId } from '@/lib/hooks';import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';
import { Check, Zap, Building2, CreditCard, ExternalLink } from 'lucide-react';

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Get started with social media management',
    features: [
      '3 social accounts',
      '10 posts per month',
      '7-day analytics',
      'Basic scheduling',
      'Community support',
    ],
    limits: { accounts: 3, posts: 10 },
    cta: 'Current Plan',
    highlight: false,
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: { monthly: 29, yearly: 290 },
    description: 'For creators and growing brands',
    features: [
      '10 social accounts',
      '500 posts per month',
      '90-day analytics',
      'Bulk scheduling',
      'PDF reports (5/month)',
      'AI caption & hashtags',
      'Media processing',
      'Priority support',
    ],
    limits: { accounts: 10, posts: 500 },
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'AGENCY',
    name: 'Agency',
    price: { monthly: 99, yearly: 990 },
    description: 'For agencies managing multiple brands',
    features: [
      'Unlimited accounts',
      'Unlimited posts',
      '90-day analytics',
      'Unlimited reports',
      'Unlimited AI credits',
      'Team collaboration',
      'White-label reports',
      'API access',
      'Dedicated support',
    ],
    limits: { accounts: -1, posts: -1 },
    cta: 'Upgrade to Agency',
    highlight: false,
  },
];

export default function BillingPage() {
  const orgId = useOrgId();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const { data: subData } = useSWR(
    orgId ? ['billing/subscription', orgId] : null,
    () => billingApi.getSubscription(orgId),
  );
  const currentTier = subData?.tier || 'FREE';
  const usage = subData?.usage;

  const handleUpgrade = async (tier: string) => {
    if (tier === 'FREE' || tier === currentTier) return;
    setLoading(tier);
    try {
      const res = await billingApi.createCheckout(orgId, tier, billing.toUpperCase());
      window.location.href = res.url;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading('portal');
    try {
      const res = await billingApi.getBillingPortal(orgId);
      window.location.href = res.url;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Plans & Billing</h1>
        <p className="text-sm text-text-muted mt-0.5">Manage your subscription and usage</p>
      </div>

      {/* Current plan summary */}
      {subData && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-text-primary">Current Plan</h3>
                <Badge variant={currentTier === 'FREE' ? 'default' : currentTier === 'PRO' ? 'info' : 'warning'}>
                  {currentTier}
                </Badge>
              </div>
              {subData.subscription?.currentPeriodEnd && (
                <p className="text-xs text-text-muted">
                  Renews {new Date(subData.subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            {currentTier !== 'FREE' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ExternalLink size={13} />}
                loading={loading === 'portal'}
                onClick={handleManageBilling}
              >
                Manage Billing
              </Button>
            )}
          </div>

          {/* Usage bars */}
          {usage && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-surface-border">
              <UsageBar
                label="Posts"
                used={usage.postsUsed}
                limit={usage.postsLimit}
              />
              <UsageBar
                label="Accounts"
                used={usage.accountsConnected}
                limit={usage.accountsLimit}
              />
              <UsageBar
                label="AI Credits"
                used={usage.aiCreditsUsed}
                limit={usage.aiCreditsLimit}
              />
            </div>
          )}
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={clsx('text-sm', billing === 'monthly' ? 'text-text-primary font-medium' : 'text-text-muted')}>Monthly</span>
        <button
          onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
          className={clsx(
            'relative w-12 h-6 rounded-full transition-colors',
            billing === 'yearly' ? 'bg-brand-500' : 'bg-surface-border',
          )}
        >
          <div className={clsx(
            'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
            billing === 'yearly' ? 'translate-x-7' : 'translate-x-1',
          )} />
        </button>
        <span className={clsx('text-sm', billing === 'yearly' ? 'text-text-primary font-medium' : 'text-text-muted')}>
          Yearly
          <span className="ml-1.5 text-xs bg-success/15 text-success px-1.5 py-0.5 rounded-full">Save 17%</span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const price = billing === 'yearly' ? plan.price.yearly / 12 : plan.price.monthly;

          return (
            <div
              key={plan.id}
              className={clsx(
                'bg-surface-card border rounded-2xl p-6 flex flex-col relative',
                plan.highlight
                  ? 'border-brand-500/50 shadow-glow'
                  : 'border-surface-border',
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {plan.id === 'FREE' && <Zap size={16} className="text-text-muted" />}
                  {plan.id === 'PRO' && <Zap size={16} className="text-brand-400" />}
                  {plan.id === 'AGENCY' && <Building2 size={16} className="text-amber-400" />}
                  <h3 className="text-base font-bold text-text-primary">{plan.name}</h3>
                </div>
                <p className="text-xs text-text-muted">{plan.description}</p>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-bold text-text-primary">${price === 0 ? '0' : price.toFixed(0)}</span>
                <span className="text-sm text-text-muted">/month</span>
                {billing === 'yearly' && price > 0 && (
                  <p className="text-xs text-text-muted mt-0.5">Billed ${plan.price.yearly}/year</p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? 'secondary' : plan.highlight ? 'primary' : 'outline'}
                disabled={isCurrent || plan.id === 'FREE'}
                loading={loading === plan.id}
                onClick={() => handleUpgrade(plan.id)}
                className="w-full"
              >
                {isCurrent ? 'Current Plan' : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Payment security note */}
      <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
        <CreditCard size={13} />
        <span>Secure payments powered by Stripe. Cancel anytime.</span>
      </div>
    </div>
  );
}

// ── Usage bar ─────────────────────────────────────────────────
function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = pct > 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs text-text-muted">
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
        {!isUnlimited && (
          <div
            className={clsx('h-full rounded-full transition-all', isNearLimit ? 'bg-warning' : 'bg-brand-500')}
            style={{ width: `${pct}%` }}
          />
        )}
        {isUnlimited && <div className="h-full bg-success rounded-full w-full opacity-30" />}
      </div>
    </div>
  );
}
