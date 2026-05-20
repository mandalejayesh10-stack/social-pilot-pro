'use client';

import { useState } from 'react';
import { useHashtags, useOrgId } from '@/lib/hooks';
import { PeriodSelector, Period } from '@/components/ui/period-selector';
import { Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartCard } from '@/components/ui/chart-card';
import { Hash, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

export default function HashtagsPage() {
  const orgId = useOrgId();
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [period, setPeriod] = useState<Period>('30d');

  const { data: hashtags = [], isLoading } = useHashtags(platform, period);

  const chartData = hashtags.slice(0, 10).map((h: any) => ({
    hashtag: h.hashtag.replace('#', ''),
    engagement: h.avgEngagement,
    count: h.count,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Hashtag Performance</h1>
          <p className="text-sm text-text-muted mt-0.5">Track which hashtags drive the most engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'INSTAGRAM', label: 'Instagram' },
              { value: 'FACEBOOK', label: 'Facebook' },
              { value: 'YOUTUBE', label: 'YouTube' },
            ]}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-36"
          />
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Chart */}
      {!isLoading && chartData.length > 0 && (
        <ChartCard
          title="Top Hashtags by Engagement"
          subtitle="Average engagement rate per hashtag"
          data={chartData}
          type="bar"
          dataKeys={[{ key: 'engagement', color: '#6366f1', label: 'Avg Engagement %' }]}
          xKey="hashtag"
          height={220}
        />
      )}

      {/* Table */}
      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h3 className="text-sm font-semibold text-text-primary">All Hashtags</h3>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : hashtags.length === 0 ? (
          <EmptyState
            icon={<Hash size={24} />}
            title="No hashtag data yet"
            description="Publish posts with hashtags to see performance data."
            className="py-12"
          />
        ) : (
          <div className="divide-y divide-surface-border/50">
            {hashtags.map((h: any, i: number) => (
              <HashtagRow key={h.hashtag} hashtag={h} rank={i + 1} maxEngagement={hashtags[0]?.avgEngagement || 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HashtagRow({ hashtag, rank, maxEngagement }: { hashtag: any; rank: number; maxEngagement: number }) {
  const pct = Math.min((hashtag.avgEngagement / maxEngagement) * 100, 100);

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-surface-hover/50 transition-colors">
      <span className="text-sm font-bold text-text-muted w-6 text-right">{rank}</span>

      <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 flex-shrink-0">
        <Hash size={14} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{hashtag.hashtag}</p>
        <div className="mt-1.5 h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-text-primary">{hashtag.avgEngagement.toFixed(2)}%</p>
        <p className="text-xs text-text-muted">{hashtag.count} posts</p>
      </div>
    </div>
  );
}
