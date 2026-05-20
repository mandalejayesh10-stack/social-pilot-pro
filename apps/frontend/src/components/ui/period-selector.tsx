'use client';

import clsx from 'clsx';

const PERIODS = ['7d', '30d', '90d'] as const;
export type Period = typeof PERIODS[number];

interface PeriodSelectorProps {
  value: Period;
  onChange: (p: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-card border border-surface-border rounded-xl p-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            value === p ? 'bg-brand-500 text-white' : 'text-text-secondary hover:text-text-primary',
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
