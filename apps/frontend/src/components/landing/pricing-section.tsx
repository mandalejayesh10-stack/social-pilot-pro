'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap, Building2, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: Zap,
    price: { monthly: 0, yearly: 0 },
    desc: 'Perfect for getting started',
    color: 'border-white/10',
    btnClass: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    features: [
      '3 social accounts',
      '10 posts per month',
      '7-day analytics',
      'Basic scheduling',
      'Community support',
    ],
    missing: ['PDF reports', 'AI features', 'Media processing', 'API access'],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    price: { monthly: 29, yearly: 24 },
    desc: 'For creators and growing brands',
    color: 'border-violet-500/50',
    highlight: true,
    badge: 'Most Popular',
    btnClass: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25',
    features: [
      '10 social accounts',
      '500 posts per month',
      '90-day analytics',
      'Bulk scheduling',
      'PDF reports (5/month)',
      'AI captions & hashtags',
      'Media processing',
      'Priority support',
    ],
    missing: [],
  },
  {
    id: 'agency',
    name: 'Agency',
    icon: Building2,
    price: { monthly: 99, yearly: 82 },
    desc: 'For agencies managing multiple brands',
    color: 'border-amber-500/30',
    btnClass: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    features: [
      'Unlimited accounts',
      'Unlimited posts',
      '90-day analytics',
      'Unlimited PDF reports',
      'Unlimited AI credits',
      'Team collaboration',
      'White-label reports',
      'API access',
      'Dedicated support',
    ],
    missing: [],
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-28 bg-[#06060f] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-violet-900/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5">
            <Zap size={12} className="text-violet-400" />
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">Simple pricing</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
            Start free,
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent"> scale up.</span>
          </h2>
          <p className="text-white/50 text-lg max-w-md mx-auto">
            No hidden fees. Cancel anytime. All plans include real API integrations.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-sm font-medium ${!yearly ? 'text-white' : 'text-white/40'}`}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-violet-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${yearly ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? 'text-white' : 'text-white/40'}`}>
              Yearly
              <span className="ml-1.5 text-xs bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full">Save 17%</span>
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const price = yearly ? plan.price.yearly : plan.price.monthly;
            const Icon = plan.icon;
            return (
              <div key={plan.id} className={`relative bg-white/[0.03] border ${plan.color} rounded-2xl p-6 flex flex-col ${plan.highlight ? 'shadow-2xl shadow-violet-500/10' : ''}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {plan.highlight && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${plan.highlight ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-white/50'}`}>
                      <Icon size={15} />
                    </div>
                    <span className="font-bold text-white">{plan.name}</span>
                  </div>
                  <p className="text-xs text-white/40 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">${price}</span>
                    <span className="text-white/40 text-sm">/mo</span>
                  </div>
                  {yearly && price > 0 && (
                    <p className="text-xs text-white/30 mt-1">Billed ${price * 12}/year</p>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/20 line-through">
                      <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/register"
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.btnClass}`}>
                  {plan.id === 'free' ? 'Get started free' : `Start ${plan.name}`}
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-white/30 mt-10">
          All plans include real Meta Graph API + YouTube Data API integrations. No fake data, ever.
        </p>
      </div>
    </section>
  );
}
