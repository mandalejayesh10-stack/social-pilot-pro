import clsx from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;       // percentage change
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'brand' | 'instagram' | 'facebook' | 'youtube' | 'success' | 'warning';
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  color = 'brand',
  loading = false,
}: MetricCardProps) {
  const colorMap = {
    brand:     'bg-brand-500/10 text-brand-400',
    instagram: 'bg-pink-500/10 text-pink-400',
    facebook:  'bg-blue-500/10 text-blue-400',
    youtube:   'bg-red-500/10 text-red-400',
    success:   'bg-green-500/10 text-green-400',
    warning:   'bg-amber-500/10 text-amber-400',
  };

  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
        <div className="skeleton h-4 w-24 mb-4" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5 hover:border-brand-500/30 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-text-secondary font-medium">{label}</p>
        {icon && (
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', colorMap[color])}>
            {icon}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-text-primary mb-1.5">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp size={13} className="text-success" />
          ) : isNegative ? (
            <TrendingDown size={13} className="text-error" />
          ) : (
            <Minus size={13} className="text-text-muted" />
          )}
          <span className={clsx(
            'text-xs font-medium',
            isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-text-muted',
          )}>
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-xs text-text-muted">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
