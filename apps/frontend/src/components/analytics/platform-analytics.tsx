'use client';

import { useState } from 'react';
import { ChartCard } from '@/components/ui/chart-card';
import { MetricCard } from '@/components/ui/metric-card';
import { PeriodSelector, Period } from '@/components/ui/period-selector';
import { SkeletonCard, SkeletonChart } from '@/components/ui/skeleton';
import { usePlatformAnalytics, useGrowthData } from '@/lib/hooks';
import { Users, Heart, Eye, TrendingUp, BarChart2 } from 'lucide-react';

interface PlatformAnalyticsProps {
  platform: string;
  period: Period;
  onPeriodChange: (p: Period) => void;
}

export function PlatformAnalytics({ platform, period, onPeriodChange }: PlatformAnalyticsProps) {
  const { data, isLoading } = usePlatformAnalytics(platform, period);
  const { data: growthData = [] } = useGrowthData(platform, period);

  const summary = data?.summary;
  const isYT = platform === 'YOUTUBE';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-brand-400" />
          <h3 className="text-sm font-semibold text-text-primary capitalize">
            {platform.toLowerCase()} Analytics
          </h3>
        </div>
        <PeriodSelector value={period} onChange={onPeriodChange} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <MetricCard
              label={isYT ? 'Subscribers' : 'Followers'}
              value={summary?.totalFollowers || 0}
              change={summary?.growthPercent}
              changeLabel="growth"
              icon={<Users size={16} />}
              color="brand"
            />
            <MetricCard
              label="Avg Engagement"
              value={`${(summary?.avgEngagementRate || 0).toFixed(2)}%`}
              icon={<Heart size={16} />}
              color="instagram"
            />
            <MetricCard
              label="Total Reach"
              value={summary?.totalReach || 0}
              icon={<Eye size={16} />}
              color="facebook"
            />
            <MetricCard
              label="Posts"
              value={summary?.totalPosts || 0}
              icon={<TrendingUp size={16} />}
              color="youtube"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          <><SkeletonChart /><SkeletonChart /></>
        ) : (
          <>
            <ChartCard
              title={isYT ? 'Subscriber Growth' : 'Follower Growth'}
              data={growthData.map((d: any) => ({ date: d.date, value: d.followers }))}
              type="line"
              dataKeys={[{ key: 'value', color: '#6366f1', label: isYT ? 'Subscribers' : 'Followers' }]}
            />
            <ChartCard
              title="Engagement Rate"
              data={growthData.map((d: any) => ({ date: d.date, value: d.engagementRate }))}
              type="line"
              dataKeys={[{ key: 'value', color: '#e1306c', label: 'Engagement %' }]}
            />
          </>
        )}
      </div>

      {!isLoading && (
        <ChartCard
          title="Reach Over Time"
          data={growthData.map((d: any) => ({ date: d.date, value: d.reach }))}
          type="bar"
          dataKeys={[{ key: 'value', color: '#6366f1', label: 'Reach' }]}
          height={180}
        />
      )}
    </div>
  );
}
