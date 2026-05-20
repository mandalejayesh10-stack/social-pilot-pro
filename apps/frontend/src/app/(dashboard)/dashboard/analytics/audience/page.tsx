'use client';

import { useState, useEffect } from 'react';
import { useOrgId } from '@/lib/hooks';
import { analyticsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { BestTimeHeatmap } from '@/components/ui/best-time-heatmap';
import clsx from 'clsx';
import dayjs from 'dayjs';
import {
  Instagram, Facebook, Youtube, RefreshCw, Clock,
  TrendingUp, Sparkles, Users, Info, BarChart2,
  Zap, ChevronDown, ChevronUp,
} from 'lucide-react';

const PLATFORMS = [
  { id: 'INSTAGRAM', label: 'Instagram', icon: <Instagram size={14} />, color: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' },
  { id: 'FACEBOOK',  label: 'Facebook',  icon: <Facebook size={14} />,  color: 'bg-blue-600 text-white' },
  { id: 'YOUTUBE',   label: 'YouTube',   icon: <Youtube size={14} />,   color: 'bg-red-600 text-white' },
];

const CONTENT_TYPE_COLORS: Record<string, string> = {
  REEL:     'bg-purple-500/15 text-purple-400',
  IMAGE:    'bg-blue-500/15 text-blue-400',
  CAROUSEL: 'bg-amber-500/15 text-amber-400',
  VIDEO:    'bg-red-500/15 text-red-400',
  SHORT:    'bg-green-500/15 text-green-400',
  TEXT:     'bg-surface-hover text-text-muted',
};

export default function AudienceActivityPage() {
  const orgId = useOrgId();
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [showPercentage, setShowPercentage] = useState(false);

  const load = async (p = platform) => {
    if (!orgId) return;
    setLoading(true);
    try {
      const bt = await analyticsApi.bestTimes(orgId, p, 'Asia/Kolkata');
      setData(bt);
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  const handleSync = async () => {
    if (!orgId) return;
    setSyncing(true);
    try {
      await analyticsApi.forceSync(orgId);
      await load();
    } catch {}
    finally { setSyncing(false); }
  };

  useEffect(() => { load(); }, [orgId, platform]);

  const confidenceColor = (c: number) =>
    c >= 65 ? 'text-green-400 bg-green-500/10' :
    c >= 40 ? 'text-amber-400 bg-amber-500/10' :
    'text-text-muted bg-surface-hover';

  const dataSourceLabel = data?.dataSource === 'real'
    ? { icon: '✅', text: `Based on ${data.postsAnalyzed} real posts`, color: 'bg-green-500/10 border-green-500/20 text-green-400' }
    : data?.dataSource === 'partial'
    ? { icon: '🔄', text: `Partial data (${data.postsAnalyzed} posts) — blended with research`, color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' }
    : { icon: '📊', text: 'Industry research defaults — sync real data for personalized results', color: 'bg-brand-500/5 border-brand-500/20 text-brand-400' };

  const displaySlots = showAllSlots ? data?.topSlots : data?.topSlots?.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Best Time to Post</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {data?.dataSource === 'real'
              ? `Personalized recommendations from ${data.postsAnalyzed} real posts`
              : 'Connect accounts and sync to get personalized recommendations'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPercentage(!showPercentage)}
            className={clsx(
              'text-xs px-3 py-1.5 rounded-lg border transition-colors',
              showPercentage ? 'border-brand-500/50 bg-brand-500/10 text-brand-400' : 'border-surface-border text-text-muted hover:bg-surface-hover',
            )}
          >
            Show %
          </button>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />} loading={syncing} onClick={handleSync}>
            Sync Real Data
          </Button>
        </div>
      </div>

      {/* Platform selector */}
      <div className="flex gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlatform(p.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all',
              platform === p.id
                ? 'border-brand-500/50 bg-brand-500/10 text-brand-400'
                : 'border-surface-border text-text-muted hover:text-text-primary hover:bg-surface-hover',
            )}
          >
            <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[10px]', p.color)}>
              {p.icon}
            </span>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-8 rounded-xl w-96" />
          <div className="skeleton h-56 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        </div>
      ) : data ? (
        <>
          {/* Data source banner */}
          <div className={clsx('flex items-center gap-3 rounded-xl px-4 py-3 text-sm border', dataSourceLabel.color)}>
            <span>{dataSourceLabel.icon}</span>
            <span>{dataSourceLabel.text}</span>
            {data.dataSource !== 'real' && (
              <button onClick={handleSync} className="ml-auto underline text-xs opacity-80 hover:opacity-100">
                Sync now →
              </button>
            )}
            {data.lastUpdated && (
              <span className="ml-auto text-xs opacity-60">
                Updated {dayjs(data.lastUpdated).fromNow?.() || dayjs(data.lastUpdated).format('h:mm A')}
              </span>
            )}
          </div>

          {/* Heatmap */}
          <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Engagement Heatmap</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Hover any cell for score, confidence, and why. Outlined cells = top recommended slots.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Clock size={12} />
                Asia/Kolkata
              </div>
            </div>
            <BestTimeHeatmap
              data={data.heatmap}
              confidenceMap={data.confidenceMap}
              topSlots={data.topSlots}
              platform={platform}
              showPercentage={showPercentage}
            />
          </div>

          {/* Top slots + Today's trend */}
          <div className="grid grid-cols-2 gap-4">
            {/* Best times */}
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-brand-400" />
                <h3 className="text-sm font-semibold text-text-primary">Top Recommended Times</h3>
              </div>
              <div className="space-y-2.5">
                {displaySlots?.map((slot: any, i: number) => (
                  <div key={i} className="group">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: `rgba(236, 72, 153, ${(slot.score / 100) * 0.7 + 0.2})` }}
                      >
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-primary font-medium">{slot.dayLabel} · {slot.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-pink-400">{slot.score}%</span>
                            {slot.confidence > 0 && (
                              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-medium', confidenceColor(slot.confidence))}>
                                {slot.confidence}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${slot.score}%`,
                              backgroundColor: `rgba(236, 72, 153, ${(slot.score / 100) * 0.8 + 0.1})`,
                            }}
                          />
                        </div>
                        {/* Why explanation */}
                        {slot.why && (
                          <p className="text-[10px] text-text-muted mt-1 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
                            {slot.why}
                          </p>
                        )}
                        {/* Content types */}
                        {slot.contentTypes?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {slot.contentTypes.map((ct: string) => (
                              <span key={ct} className={clsx('text-[9px] px-1.5 py-0.5 rounded-full font-medium', CONTENT_TYPE_COLORS[ct] || 'bg-surface-hover text-text-muted')}>
                                {ct}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {data.topSlots?.length > 5 && (
                <button
                  onClick={() => setShowAllSlots(!showAllSlots)}
                  className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-3 transition-colors"
                >
                  {showAllSlots ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAllSlots ? 'Show less' : `Show all ${data.topSlots.length} slots`}
                </button>
              )}
            </div>

            {/* Today's trend */}
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-brand-400" />
                <h3 className="text-sm font-semibold text-text-primary">Today&apos;s Best Windows</h3>
                <span className="text-xs text-text-muted ml-auto">{dayjs().format('dddd')}</span>
              </div>
              {data.todayTrend?.length > 0 ? (
                <div className="space-y-2.5">
                  {data.todayTrend.map((slot: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-14 text-xs text-text-muted flex-shrink-0 font-medium">{slot.label}</div>
                      <div className="flex-1 h-6 bg-surface-hover rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all"
                          style={{
                            width: `${slot.score}%`,
                            backgroundColor: `rgba(236, 72, 153, ${(slot.score / 100) * 0.7 + 0.1})`,
                          }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-text-secondary">
                          {slot.score}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={clsx(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                          slot.score >= 80 ? 'bg-green-500/15 text-green-400' :
                          slot.score >= 60 ? 'bg-brand-500/15 text-brand-400' :
                          'bg-surface-hover text-text-muted',
                        )}>
                          {slot.tag}
                        </span>
                        {slot.confidence > 0 && (
                          <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-full', confidenceColor(slot.confidence))}>
                            {slot.confidence}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No trend data for today</p>
              )}
            </div>
          </div>

          {/* Content type breakdown */}
          {data.contentTypeBreakdown && Object.keys(data.contentTypeBreakdown).length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-brand-400" />
                <h3 className="text-sm font-semibold text-text-primary">Content Type Performance</h3>
                <span className="text-xs text-text-muted ml-1">— which formats work best for your account</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(data.contentTypeBreakdown)
                  .sort((a: any, b: any) => b[1].avgScore - a[1].avgScore)
                  .map(([type, stats]: [string, any]) => (
                    <div key={type} className="bg-surface-hover rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', CONTENT_TYPE_COLORS[type] || 'bg-surface-border text-text-muted')}>
                          {type}
                        </span>
                        <span className="text-xs text-text-muted">{stats.count} posts</span>
                      </div>
                      <p className="text-lg font-bold text-text-primary">{stats.avgScore}</p>
                      <p className="text-[10px] text-text-muted">avg score</p>
                      <p className="text-[10px] text-text-muted mt-1">
                        Best at {stats.bestHour === 0 ? '12am' : stats.bestHour === 12 ? '12pm' : stats.bestHour < 12 ? stats.bestHour + 'am' : (stats.bestHour - 12) + 'pm'}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Velocity insights */}
          {data.velocityInsights?.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-text-primary">Early Engagement Velocity</h3>
                <span className="text-xs text-text-muted ml-1">— posts that gained momentum fast</span>
              </div>
              <div className="space-y-2">
                {data.velocityInsights.slice(0, 5).map((v: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-surface-hover rounded-xl px-3 py-2">
                    <div className={clsx(
                      'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                      v.multiplier >= 5 ? 'bg-green-500/20 text-green-400' :
                      v.multiplier >= 3 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-surface-border text-text-muted',
                    )}>
                      {v.multiplier}x
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-surface-border rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, v.multiplier * 15)}%` }} />
                        </div>
                        <span className="text-[10px] text-text-muted flex-shrink-0">
                          {v.firstHourScore.toFixed(0)} → {v.finalScore.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted flex-shrink-0">
                      {v.multiplier >= 3 ? '🔥 Viral' : 'Growing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {data.insights?.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-brand-400" />
                <h3 className="text-sm font-semibold text-text-primary">Recommendations</h3>
              </div>
              <div className="space-y-2.5">
                {data.insights.map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-hover rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-brand-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-12 text-center">
          <Users size={28} className="text-text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-text-secondary">No audience data yet</p>
          <p className="text-xs text-text-muted mt-1">Connect your accounts and sync to see when your audience is most active</p>
          <Button className="mt-4" size="sm" onClick={handleSync} loading={syncing}>Sync Now</Button>
        </div>
      )}
    </div>
  );
}
