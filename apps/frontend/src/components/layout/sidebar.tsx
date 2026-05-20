'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard, Instagram, Facebook, Youtube,
  BarChart3, FileText, Hash, Settings, Calendar,
  Image, Bot, CreditCard, ChevronLeft, ChevronRight,
  Zap, Link2, Users, Receipt, Inbox, TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';

const NAV_ITEMS = [
  { label: 'Summary',     href: '/dashboard',                       icon: LayoutDashboard },
  { label: 'Inbox',       href: '/dashboard/inbox',                 icon: Inbox },
  { label: 'Calendar',    href: '/dashboard/calendar',              icon: Calendar },
  { label: 'Instagram',   href: '/dashboard/instagram',             icon: Instagram,   color: 'text-pink-400' },
  { label: 'Facebook',    href: '/dashboard/facebook',              icon: Facebook,    color: 'text-blue-400' },
  { label: 'YouTube',     href: '/dashboard/youtube',               icon: Youtube,     color: 'text-red-400' },
  { label: 'Analytics',    href: '/dashboard/analytics',              icon: BarChart3 },
  { label: 'Performance',  href: '/dashboard/analytics/performance',  icon: TrendingUp },
  { label: 'Audience',     href: '/dashboard/analytics/audience',     icon: Users },
  { label: 'Competitors',  href: '/dashboard/analytics/competitors',  icon: TrendingUp },
  { label: 'Reports',      href: '/dashboard/reports',                icon: FileText },
  { label: 'Hashtags',    href: '/dashboard/hashtags',              icon: Hash },
  { label: 'Media',       href: '/dashboard/media',                 icon: Image },
  { label: 'AI Studio',   href: '/dashboard/ai',                    icon: Bot },
];

const SETTINGS_ITEMS = [
  { label: 'Account',     href: '/dashboard/settings',              icon: Settings },
  { label: 'Connections', href: '/dashboard/settings/connections',  icon: Link2 },
  { label: 'Workspace',   href: '/dashboard/settings/workspace',    icon: Users },
  { label: 'Billing',     href: '/dashboard/billing',               icon: CreditCard },
  { label: 'Invoices',    href: '/dashboard/billing/invoices',      icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { currentOrg } = useAppStore();

  const isSettingsActive = pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/billing');

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-surface-card border-r border-surface-border',
        'transition-all duration-300 ease-in-out flex-shrink-0 z-20',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center h-16 px-4 border-b border-surface-border flex-shrink-0',
        collapsed ? 'justify-center' : 'gap-2.5',
      )}>
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Zap size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-text-primary text-sm leading-tight truncate">SocialPilot Pro</p>
            {currentOrg && (
              <p className="text-[10px] text-text-muted truncate">{currentOrg.name}</p>
            )}
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium',
                'transition-all duration-150 group',
                active
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                collapsed && 'justify-center',
              )}
            >
              <Icon
                size={17}
                className={clsx(
                  'flex-shrink-0 transition-colors',
                  active
                    ? 'text-brand-400'
                    : item.color || 'text-text-secondary group-hover:text-text-primary',
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
              )}
            </Link>
          );
        })}

        {/* Settings section */}
        {!collapsed && (
          <div className="pt-3 pb-1">
            <p className="px-2.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
              Settings
            </p>
          </div>
        )}
        {collapsed && <div className="my-2 border-t border-surface-border/50" />}

        {SETTINGS_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium',
                'transition-all duration-150 group',
                active
                  ? 'bg-brand-500/15 text-brand-400'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                collapsed && 'justify-center',
              )}
            >
              <Icon size={17} className={clsx('flex-shrink-0', active ? 'text-brand-400' : 'text-text-secondary group-hover:text-text-primary')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-4 border-t border-surface-border pt-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium w-full',
            'text-text-muted hover:bg-surface-hover hover:text-text-secondary transition-all',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? <ChevronRight size={17} /> : (
            <>
              <ChevronLeft size={17} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
