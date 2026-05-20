'use client';

import { useState, useEffect } from 'react';
import { useOrgId } from '@/lib/hooks';
import { analyticsApi } from '@/lib/api';
import clsx from 'clsx';
import { Zap, Clock, Sparkles, RefreshCw, Target } from 'lucide-react';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  facebook:  'from-blue-500 to-blue-700',
  youtube:   'from-red-500 to-red-700',
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook:  'Facebook',
  youtube:   'YouTube',
};

export function ViralScoreWidget() {
  const orgId = useOrgId();
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!orgId) return;
    try {
      const data = await analyticsApi.bestTimesAll(orgId, 'Asia/Kolkata');
      const result: any[] = [];
      for (const [platform, bt] of Object.entries(data) as [string, any][]) {
        if (!bt?.topSlots?.length) continue;
        const best = bt.topSlots[0];
        const score = best.score;
        result.push({
          platform,
          score,
          label: score >= 80 ? 'Viral' : score >= 60 ? 'High' : score >= 40 ? 'Medium' : 'Low',
          color: score >= 80 ? 'text-green-400' : score >= 60 ? 'text-brand-400' : score >= 40 ? 'text-amber-400' : 'text-text-muted',
          todayPeak: bt.todayTrend?.[0] ? `${bt.todayTrend[0].label} (${bt.todayTrend[0].score}%)` : best.label,
          topInsight: bt.insights?.[1] || bt.insights?.[0] || '',
          dataSource: bt.dataSource,
        });
      }
      setScores(result);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [orgId]);

  if (loading) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
        <div className="skeleton h-4 w-40 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (scores.length === 0) return null;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-brand-400" />
          <h3 className="text-sm font-semibold text-text-primary">Engagement Intelligence</h3>
        </div>
        <button onClick={() => { setRefreshing(true); load(); }} disabled={refreshing}
          className="text-text-muted hover:text-text-primary transition-colors">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {scores.map((s) => (
          <div key={s.platform} className="bg-surface-hover rounded-xl p-3 relative overflow-hidden">
            <div className={clsx('absolute inset-0 opacity-5 bg-gradient-to-br', PLATFORM_COLORS[s.platform])} />
            <p className="text-xs text-text-muted mb-2 relative">{PLATFORM_LABELS[s.platform]}</p>
            <div className="flex items-center gap-2 mb-2 relative">
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-border" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${(s.score / 100) * 94} 94`}
                    className={s.score >= 80 ? 'text-green-400' : s.score >= 60 ? 'text-brand-400' : s.score >= 40 ? 'text-amber-400' : 'text-text-muted'}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-primary">{s.score}</span>
              </div>
              <div>
                <p className={clsx('text-xs font-bold', s.color)}>{s.label}</p>
                <p className="text-[10px] text-text-muted">score</p>
              </div>
            </div>
            <div className="flex items-center gap-1 relative">
              <Clock size={10} className="text-text-muted" />
              <p className="text-[10px] text-text-muted truncate">Peak: {s.todayPeak}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top insight */}
      {scores[0]?.topInsight && (
        <div className="flex items-start gap-2 bg-brand-500/5 border border-brand-500/15 rounded-xl p-3">
          <Sparkles size={12} className="text-brand-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">{scores[0].topInsight}</p>
        </div>
      )}

      {/* Data source note */}
      <p className="text-[10px] text-text-muted mt-2 text-center">
        {scores[0]?.dataSource === 'real' ? 'Based on your real post performance' : 'Based on industry research · Sync for personalized data'}
      </p>
    </div>
  );
}
