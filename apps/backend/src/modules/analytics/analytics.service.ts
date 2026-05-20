import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Platform } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  // ── Dashboard overview (all platforms) ───────────────────
  async getDashboardOverview(organizationId: string, period: string = '30d') {
    const platforms: Platform[] = ['INSTAGRAM', 'FACEBOOK', 'YOUTUBE'];
    const summaries: Record<string, any> = {};

    for (const platform of platforms) {
      const summary = await this.prisma.analyticsSummary.findUnique({
        where: {
          organizationId_platform_periodType: { organizationId, platform, periodType: period },
        },
      });

      if (summary) {
        summaries[platform.toLowerCase()] = {
          ...summary,
          followerTimeline: JSON.parse(summary.followerTimeline),
          engagementTimeline: JSON.parse(summary.engagementTimeline),
          reachTimeline: JSON.parse(summary.reachTimeline),
        };
      }
    }

    return summaries;
  }

  // ── Platform-specific analytics ───────────────────────────
  async getPlatformAnalytics(
    organizationId: string,
    platform: Platform,
    period: string = '30d',
  ) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [summary, accountMetrics, topPosts] = await Promise.all([
      this.prisma.analyticsSummary.findUnique({
        where: {
          organizationId_platform_periodType: { organizationId, platform, periodType: period },
        },
      }),
      this.prisma.accountMetrics.findMany({
        where: { organizationId, platform, periodDate: { gte: since } },
        orderBy: { periodDate: 'asc' },
      }),
      this.getTopPosts(organizationId, platform, days),
    ]);

    return {
      summary: summary
        ? {
            ...summary,
            followerTimeline: JSON.parse(summary.followerTimeline),
            engagementTimeline: JSON.parse(summary.engagementTimeline),
            reachTimeline: JSON.parse(summary.reachTimeline),
          }
        : null,
      accountMetrics,
      topPosts,
      bestPostingTime: summary
        ? {
            hour: summary.bestPostingHour,
            day: summary.bestPostingDay,
            topContentType: summary.topContentType,
          }
        : null,
    };
  }

  // ── Top performing posts ──────────────────────────────────
  async getTopPosts(
    organizationId: string,
    platform: Platform,
    days: number = 30,
    limit: number = 10,
  ) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await this.prisma.postMetrics.findMany({
      where: {
        organizationId,
        platform,
        periodDate: { gte: since },
      },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            mediaUrls: true,
            publishDate: true,
            publishedUrl: true,
          },
        },
      },
      orderBy: { engagementRate: 'desc' },
      take: limit,
    });

    return metrics.map((m) => ({
      postId: m.postId,
      content: m.post.content,
      mediaUrls: JSON.parse(m.post.mediaUrls),
      publishDate: m.post.publishDate,
      publishedUrl: m.post.publishedUrl,
      metrics: {
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        saves: m.saves,
        reach: m.reach,
        impressions: m.impressions,
        videoViews: m.videoViews,
        engagementRate: m.engagementRate,
      },
    }));
  }

  // ── Growth chart data ─────────────────────────────────────
  async getGrowthData(
    organizationId: string,
    platform: Platform,
    period: string = '30d',
  ) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await this.prisma.accountMetrics.findMany({
      where: { organizationId, platform, periodDate: { gte: since } },
      orderBy: { periodDate: 'asc' },
      select: {
        periodDate: true,
        followers: true,
        subscribers: true,
        followersGrowth: true,
        growthPercent: true,
        avgEngagementRate: true,
        totalReach: true,
        totalImpressions: true,
      },
    });

    return metrics.map((m) => ({
      date: m.periodDate.toISOString().split('T')[0],
      followers: platform === 'YOUTUBE' ? (m.subscribers || 0) : m.followers,
      growth: m.followersGrowth,
      growthPercent: m.growthPercent,
      engagementRate: m.avgEngagementRate,
      reach: m.totalReach,
      impressions: m.totalImpressions,
    }));
  }

  // ── Content type performance ──────────────────────────────
  async getContentTypePerformance(
    organizationId: string,
    platform: Platform,
    period: string = '30d',
  ) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await this.prisma.postMetrics.findMany({
      where: {
        organizationId,
        platform,
        periodDate: { gte: since },
      },
      include: {
        post: { select: { mediaUrls: true } },
      },
    });

    const byType: Record<string, { count: number; totalEngagement: number; totalReach: number }> = {
      image: { count: 0, totalEngagement: 0, totalReach: 0 },
      video: { count: 0, totalEngagement: 0, totalReach: 0 },
      text: { count: 0, totalEngagement: 0, totalReach: 0 },
    };

    for (const m of metrics) {
      const mediaUrls = JSON.parse(m.post.mediaUrls || '[]');
      let type = 'text';
      if (mediaUrls.length > 0) {
        type = m.videoViews > 0 ? 'video' : 'image';
      }

      byType[type].count++;
      byType[type].totalEngagement += m.engagementRate;
      byType[type].totalReach += m.reach;
    }

    return Object.entries(byType).map(([type, data]) => ({
      type,
      count: data.count,
      avgEngagementRate: data.count > 0
        ? parseFloat((data.totalEngagement / data.count).toFixed(2))
        : 0,
      totalReach: data.totalReach,
    }));
  }

  // ── Hashtag performance ───────────────────────────────────
  async getHashtagPerformance(organizationId: string, platform: Platform, period: string = '30d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: {
        organizationId,
        integration: { platform },
        publishDate: { gte: since },
        state: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        metrics: {
          orderBy: { periodDate: 'desc' },
          take: 1,
        },
      },
    });

    const hashtagStats: Record<string, { count: number; totalEngagement: number }> = {};

    for (const post of posts) {
      if (!post.hashtags) continue;
      const tags = post.hashtags.match(/#\w+/g) || [];
      const engagement = post.metrics[0]?.engagementRate || 0;

      for (const tag of tags) {
        if (!hashtagStats[tag]) hashtagStats[tag] = { count: 0, totalEngagement: 0 };
        hashtagStats[tag].count++;
        hashtagStats[tag].totalEngagement += engagement;
      }
    }

    return Object.entries(hashtagStats)
      .map(([hashtag, data]) => ({
        hashtag,
        count: data.count,
        avgEngagement: parseFloat((data.totalEngagement / data.count).toFixed(2)),
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 20);
  }
}
