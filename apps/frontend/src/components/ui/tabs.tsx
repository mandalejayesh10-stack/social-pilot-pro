'use client';

import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline' | 'cards';
  className?: string;
}

export function Tabs({ tabs, active, onChange, variant = 'pills', className }: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className={clsx('flex border-b border-surface-border', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all',
              active === tab.id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-border',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="bg-brand-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={clsx('grid gap-3', className)} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all',
              active === tab.id
                ? 'bg-brand-500/15 border-brand-500/50 text-brand-400'
                : 'bg-surface-card border-surface-border text-text-secondary hover:text-text-primary hover:border-brand-500/30',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  // Default: pills
  return (
    <div className={clsx('flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl p-1 w-fit', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            active === tab.id
              ? 'bg-brand-500 text-white'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className={clsx(
              'text-xs rounded-full w-4 h-4 flex items-center justify-center',
              active === tab.id ? 'bg-white/20 text-white' : 'bg-brand-500/20 text-brand-400',
            )}>
              {tab.badge > 9 ? '9+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
