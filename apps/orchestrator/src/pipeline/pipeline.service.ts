import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PRISMA } from '../database/database.module';
import { MetaFetcherService } from './fetchers/meta-fetcher.service';
import { YoutubeFetcherService } from './fetchers/youtube-fetcher.service';
import { MetricsComputeService } from './compute/metrics-compute.service';

function decrypt(ciphertext: string): string {
  const crypto = require('crypto');
  const key = Buffer.from((process.env.TOKEN_ENCRYPTION_KEY || '').padEnd(64, '0').slice(0, 64), 'hex');
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 16);
  const tag = buf.subarray(16, 32);
  const enc = buf.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final('utf8');
}

@Injectable()
export class PipelineService {
  private readonly logger = new Logger('PipelineService');

  constructor(
    @Inject(PRISMA) private prisma: PrismaClient,
    private metaFetcher: MetaFetcherService,
    private youtubeFetcher: YoutubeFetcherService,
    private metricsCompute: MetricsComputeService,
  ) {}

  async runBasicStats() {
    const integrations = await this.getActive();
    for (const ig of integrations) {
      try {
        const token = decrypt(ig.accessToken);
        const now = new Date();
        const periodStart = new Date(now.getTime() - 15 * 60 * 1000);
        let data: any = {};

        if (ig.platform === 'INSTAGRAM' || ig.platform === 'FACEBOOK') {
          data = await this.metaFetcher.fetchBasicStats(ig.platform, ig.internalId, token);
        } else if (ig.platform === 'YOUTUBE') {
          const refresh = ig.refreshToken ? decrypt(ig.refreshToken) : null;
          data = await this.youtubeFetcher.fetchChannelStats(ig.internalId, token, refresh);
        }

        await this.storeRaw(ig, 'basic_stats', periodStart, now, data);
      } catch (e: any) {
        this.logger.warn(`Basic stats [${ig.id}]: ${e.message}`);
        if (/token|auth|401/i.test(e.message)) {
          await this.prisma.integration.update({ where: { id: ig.id }, data: { refreshNeeded: true } });
        }
      }
    }
  }

  async runPostMetrics() {
    const integrations = await this.getActive();
    for (const ig of integrations) {
      try {
        const token = decrypt(ig.accessToken);
        const now = new Date();
        const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        const posts = await this.prisma.post.findMany({
          where: { integrationId: ig.id, state: 'PUBLISHED', publishDate: { gte: since90 }, deletedAt: null },
          select: { id: true, externalId: true, publishDate: true },
        });

        if (!posts.length) continue;

        let metrics: Record<string, any> = {};
        if (ig.platform === 'INSTAGRAM') {
          metrics = await this.metaFetcher.fetchPostInsights(posts.filter(p => p.externalId).map(p => p.externalId!), token);
        } else if (ig.platform === 'FACEBOOK') {
          metrics = await this.metaFetcher.fetchPagePostInsights(posts.filter(p => p.externalId).map(p => p.externalId!), token);
        } else if (ig.platform === 'YOUTUBE') {
          const refresh = ig.refreshToken ? decrypt(ig.refreshToken) : null;
          metrics = await this.youtubeFetcher.fetchVideoMetrics(posts.filter(p => p.externalId).map(p => p.externalId!), token, refresh);
        }

        await this.storeRaw(ig, 'post_insights', new Date(now.getTime() - 3600000), now, metrics);
        await this.metricsCompute.computePostMetrics(this.prisma, ig, posts, metrics);
      } catch (e: any) {
        this.logger.warn(`Post metrics [${ig.id}]: ${e.message}`);
      }
    }
  }

  async runFullAnalytics() {
    const integrations = await this.getActive();
    for (const ig of integrations) {
      try {
        const token = decrypt(ig.accessToken);
        const now = new Date();
        const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        if (ig.platform === 'INSTAGRAM') {
          const data = await this.metaFetcher.fetchInstagramInsights(ig.internalId, token);
          await this.storeRaw(ig, 'page_insights', since, now, data);
        } else if (ig.platform === 'FACEBOOK') {
          const data = await this.metaFetcher.fetchPageInsights(ig.internalId, token);
          await this.storeRaw(ig, 'page_insights', since, now, data);
        } else if (ig.platform === 'YOUTUBE') {
          const refresh = ig.refreshToken ? decrypt(ig.refreshToken) : null;
          const data = await this.youtubeFetcher.fetchAnalytics(ig.internalId, token, refresh);
          await this.storeRaw(ig, 'channel_analytics', since, now, data);
        }

        await this.metricsCompute.computeAccountMetrics(this.prisma, ig);
        for (const period of ['7d', '30d', '90d']) {
          await this.metricsCompute.computeAnalyticsSummary(this.prisma, ig.organizationId, ig.platform as any, period);
        }
      } catch (e: any) {
        this.logger.warn(`Full analytics [${ig.id}]: ${e.message}`);
      }
    }
  }

  private getActive() {
    return this.prisma.integration.findMany({
      where: { deletedAt: null, disabled: false, refreshNeeded: false },
    });
  }

  private async storeRaw(ig: any, dataType: string, start: Date, end: Date, data: any) {
    await this.prisma.analyticsRaw.create({
      data: {
        organizationId: ig.organizationId,
        integrationId: ig.id,
        platform: ig.platform,
        dataType,
        periodStart: start,
        periodEnd: end,
        rawData: JSON.stringify(data),
      },
    });
  }
}
