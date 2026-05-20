'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { CreditCard, Receipt } from 'lucide-react';

const TABS = [
  { href: '/dashboard/billing',          label: 'Plans',    icon: CreditCard },
  { href: '/dashboard/billing/invoices', label: 'Invoices', icon: Receipt },
];

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 border-b border-surface-border">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all',
                active
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}>
              <Icon size={14} />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div>{children}</div>
    </div>
  );
}
