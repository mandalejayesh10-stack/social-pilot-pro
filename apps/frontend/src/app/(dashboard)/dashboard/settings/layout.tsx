'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { User, Lock, Key, Link2, Users, Bell } from 'lucide-react';

const TABS = [
  { href: '/dashboard/settings',             label: 'Profile',     icon: User },
  { href: '/dashboard/settings/connections', label: 'Connections', icon: Link2 },
  { href: '/dashboard/settings/workspace',   label: 'Workspace',   icon: Users },
  { href: '/dashboard/settings/security',    label: 'Security',    icon: Lock },
  { href: '/dashboard/settings/api',         label: 'API Keys',    icon: Key },
  { href: '/dashboard/settings/notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      {/* Settings tab bar */}
      <div className="flex items-center gap-1 border-b border-surface-border overflow-x-auto pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-all',
                active
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-border',
              )}
            >
              <Icon size={14} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
