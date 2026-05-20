import { Injectable } from '@nestjs/common';
import { PrismaClient, Platform } from '@prisma/client';

@Injectable()
export class MetricsComputeService {

  async computePostMetrics(
    prisma: PrismaClient,
    integration: any,
    posts: Array<{ id: string; externalId: string | null; publishDate: Date }>,
    rawMetrics: Record<string, any>,
  ) {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    for (const post of posts) {
      if (!post.externalId) continue;
      const raw = rawMetrics[post.externalId];
      if (!raw) continue;

      const likes       = raw.likes || raw.like_count || 0;
      const comments    = raw.comments || raw.comment_count || 0;
      const shares      = raw.shares || 0;
      const saves       = raw.saved || 0;
      const reach       = raw.reach || raw.post_reach || 0;
      const impressions = raw.impressions || raw.post_impressions || 0;
      const videoViews  = raw.video_views || raw.views || 0;
      const clicks      = raw.post_clicks || raw.clicks || 0;
      const engagementRate = reach > 0 ? parseFloat((((likes + comments + shares + saves) / reach) * 100).toFixed(4)) : 0;

      await prisma.postMetrics.upsert({
        where: { postId_periodDate: { postId: post.id, periodDate: today } },
        create: { organizationId: integration.organizationId, integrationId: integration.id, postId: post.id, platform: integration.platform, periodDate: today, likes, comments, shares, saves, clicks, reach, impressions, videoViews, engagementRate },
        update: { likes, comments, shares, saves, clicks, reach, impressions, videoViews, engagementRate, computedAt: new Date() },
      });
    }
  }

  async computeAccountMetrics(prisma: PrismaClient, integration: any) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 86400000);

    const prev = await prisma.accountMetrics.findUnique({
      where: { integrationId_periodDate: { integrationId: integration.id, periodDate: yesterday } },
    });

    const latestRaw = await prisma.analyticsRaw.findFirst({
      where: { integrationId: integration.id, dataType: 'basic_stats' },
      orderBy: { fetchedAt: 'desc' },
    });
    if (!latestRaw) return;

    const raw = JSON.parse(latestRaw.rawData);
    let followers = 0, following = 0, subscribers: number | null = null, totalViews: number | null = null;

    if (integration.platform === 'INSTAGRAM') { followers = raw.followers_count || 0; following = raw.follows_count || 0; }
    else if (integration.platform === 'FACEBOOK') { followers = raw.fan_count || 0; }
    else if (integration.platform === 'YOUTUBE') { subscribers = raw.subscriberCount || 0; totalViews = raw.viewCount || 0; }

    const current = integration.platform === 'YOUTUBE' ? (subscribers || 0) : followers;
    const prevVal = prev ? (integration.platform === 'YOUTUBE' ? (prev.subscribers || 0) : prev.followers) : current;
    const growth = current - prevVal;
    const growthPct = prevVal > 0 ? parseFloat(((growth / prevVal) * 100).toFixed(4)) : 0;

    const agg = await prisma.postMetrics.aggregate({
      where: { integrationId: integration.id, periodDate: today },
      _sum: { likes: true, comments: true, shares: true, reach: true, impressions: true },
      _avg: { engagementRate: true },
      _count: { id: true },
    });

    await prisma.accountMetrics.upsert({
      where: { integrationId_periodDate: { integrationId: integration.id, periodDate: today } },
      create: {
        organizationId: integration.organizationId, integrationId: integration.id,
        platform: integration.platform, periodDate: today,
        followers, following, followersGrowth: growth, growthPercent: growthPct,
        totalPosts: agg._count.id, totalLikes: agg._sum.likes || 0,
        totalComments: agg._sum.comments || 0, totalShares: agg._sum.shares || 0,
        totalReach: agg._sum.reach || 0, totalImpressions: agg._sum.impressions || 0,
        avgEngagementRate: parseFloat((agg._avg.engagementRate || 0).toFixed(4)),
        subscribers, totalViews,
      },
      update: {
        followers, following, followersGrowth: growth, growthPercent: growthPct,
        totalPosts: agg._count.id, totalLikes: agg._sum.likes || 0,
        totalComments: agg._sum.comments || 0, totalShares: agg._sum.shares || 0,
        totalReach: agg._sum.reach || 0, totalImpressions: agg._sum.impressions || 0,
        avgEngagementRate: parseFloat((agg._avg.engagementRate || 0).toFixed(4)),
        subscribers, totalViews, computedAt: new Date(),
      },
    });
  }

  async computeAnalyticsSummary(prisma: PrismaClient, organizationId: string, platform: Platform, periodType: string) {
    const days = periodType === '7d' ? 7 : periodType === '30d' ? 30 : 90;
    const since = new Date(Date.now() - days * 86400000);

    const metrics = await prisma.accountMetrics.findMany({
      where: { organizationId, platform, periodDate: { gte: since } },
      orderBy: { periodDate: 'asc' },
    });
    if (!metrics.length) return;

    const latest = metrics[metrics.length - 1];
    const earliest = metrics[0];
    const isYT = platform === 'YOUTUBE';

    const totalFollowers = isYT ? (latest.subscribers || 0) : latest.followers;
    const prevFollowers  = isYT ? (earliest.subscribers || 0) : earliest.followers;
    const followerGrowth = totalFollowers - prevFollowers;
    const growthPercent  = prevFollowers > 0 ? parseFloat(((followerGrowth / prevFollowers) * 100).toFixed(2)) : 0;
    const avgEngagement  = metrics.reduce((s, m) => s + m.avgEngagementRate, 0) / metrics.length;
    const totalReach     = metrics.reduce((s, m) => s + m.totalReach, 0);
    const totalImpressions = metrics.reduce((s, m) => s + m.totalImpressions, 0);
    const totalPosts     = metrics.reduce((s, m) => s + m.totalPosts, 0);

    const followerTimeline   = metrics.map(m => ({ date: m.periodDate.toISOString().split('T')[0], value: isYT ? (m.subscribers || 0) : m.followers }));
    const engagementTimeline = metrics.map(m => ({ date: m.periodDate.toISOString().split('T')[0], value: parseFloat(m.avgEngagementRate.toFixed(2)) }));
    const reachTimeline      = metrics.map(m => ({ date: m.periodDate.toISOString().split('T')[0], value: m.totalReach }));

    // Best posting time
    const postMetrics = await prisma.postMetrics.findMany({
      where: { organizationId, platform, periodDate: { gte: since } },
      include: { post: { select: { publishDate: true } } },
    });

    const hourMap: Record<number, { t: number; c: number }> = {};
    const dayMap:  Record<number, { t: number; c: number }> = {};
    for (const pm of postMetrics) {
      const h = pm.post.publishDate.getUTCHours();
      const d = pm.post.publishDate.getUTCDay();
      if (!hourMap[h]) hourMap[h] = { t: 0, c: 0 };
      if (!dayMap[d])  dayMap[d]  = { t: 0, c: 0 };
      hourMap[h].t += pm.engagementRate; hourMap[h].c++;
      dayMap[d].t  += pm.engagementRate; dayMap[d].c++;
    }

    let bestHour: number | null = null, bestHourAvg = 0;
    for (const [h, v] of Object.entries(hourMap)) {
      const avg = v.t / v.c;
      if (avg > bestHourAvg) { bestHourAvg = avg; bestHour = parseInt(h); }
    }
    let bestDay: number | null = null, bestDayAvg = 0;
    for (const [d, v] of Object.entries(dayMap)) {
      const avg = v.t / v.c;
      if (avg > bestDayAvg) { bestDayAvg = avg; bestDay = parseInt(d); }
    }

    const videoCount = postMetrics.filter(pm => pm.videoViews > 0).length;
    const topContentType = videoCount > postMetrics.length / 2 ? 'video' : 'image';

    await prisma.analyticsSummary.upsert({
      where: { organizationId_platform_periodType: { organizationId, platform, periodType } },
      create: {
        organizationId, platform, periodType,
        totalFollowers, followerGrowth, growthPercent,
        avgEngagementRate: parseFloat(avgEngagement.toFixed(4)),
        totalPosts, totalReach, totalImpressions,
        bestPostingHour: bestHour, bestPostingDay: bestDay, topContentType,
        followerTimeline: JSON.stringify(followerTimeline),
        engagementTimeline: JSON.stringify(engagementTimeline),
        reachTimeline: JSON.stringify(reachTimeline),
      },
      update: {
        totalFollowers, followerGrowth, growthPercent,
        avgEngagementRate: parseFloat(avgEngagement.toFixed(4)),
        totalPosts, totalReach, totalImpressions,
        bestPostingHour: bestHour, bestPostingDay: bestDay, topContentType,
        followerTimeline: JSON.stringify(followerTimeline),
        engagementTimeline: JSON.stringify(engagementTimeline),
        reachTimeline: JSON.stringify(reachTimeline),
        computedAt: new Date(),
      },
    });
  }
}
