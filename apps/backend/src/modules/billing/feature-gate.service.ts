import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SubscriptionTier } from '@prisma/client';

export const PLAN_LIMITS = {
  FREE: {
    postsPerMonth: 10,
    accounts: 3,
    reports: 0,
    aiCredits: 10,
    teamMembers: 1,
    analyticsDepth: '7d',
    bulkSchedule: false,
    pdfReports: false,
    aiInsights: false,
    mediaProcessing: false,
    apiAccess: false,
  },
  PRO: {
    postsPerMonth: 500,
    accounts: 10,
    reports: 5,
    aiCredits: 100,
    teamMembers: 5,
    analyticsDepth: '90d',
    bulkSchedule: true,
    pdfReports: true,
    aiInsights: true,
    mediaProcessing: true,
    apiAccess: true,
  },
  AGENCY: {
    postsPerMonth: -1,      // unlimited
    accounts: -1,
    reports: -1,
    aiCredits: -1,
    teamMembers: -1,
    analyticsDepth: '90d',
    bulkSchedule: true,
    pdfReports: true,
    aiInsights: true,
    mediaProcessing: true,
    apiAccess: true,
  },
} as const;

@Injectable()
export class FeatureGateService {
  constructor(private prisma: PrismaService) {}

  async getTier(organizationId: string): Promise<SubscriptionTier> {
    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });
    if (!sub || sub.status !== 'ACTIVE') return 'FREE';
    return sub.tier;
  }

  async getLimits(organizationId: string) {
    const tier = await this.getTier(organizationId);
    return PLAN_LIMITS[tier];
  }

  async canUseFeature(organizationId: string, feature: keyof typeof PLAN_LIMITS.FREE): Promise<boolean> {
    const limits = await this.getLimits(organizationId);
    return !!limits[feature];
  }

  async requireFeature(organizationId: string, feature: keyof typeof PLAN_LIMITS.FREE) {
    const can = await this.canUseFeature(organizationId, feature);
    if (!can) {
      throw new ForbiddenException(
        `This feature requires a Pro or Agency plan. Upgrade to unlock ${feature}.`,
      );
    }
  }

  async checkPostLimit(organizationId: string) {
    const [limits, usage] = await Promise.all([
      this.getLimits(organizationId),
      this.prisma.usageLimits.findUnique({ where: { organizationId } }),
    ]);

    if (limits.postsPerMonth === -1) return; // unlimited

    const used = usage?.postsUsed || 0;
    if (used >= limits.postsPerMonth) {
      throw new ForbiddenException(
        `You've reached your monthly post limit (${limits.postsPerMonth}). Upgrade your plan for more.`,
      );
    }
  }

  async checkAccountLimit(organizationId: string) {
    const [limits, usage] = await Promise.all([
      this.getLimits(organizationId),
      this.prisma.usageLimits.findUnique({ where: { organizationId } }),
    ]);

    if (limits.accounts === -1) return;

    const connected = usage?.accountsConnected || 0;
    if (connected >= limits.accounts) {
      throw new ForbiddenException(
        `You've reached your account limit (${limits.accounts}). Upgrade your plan to connect more accounts.`,
      );
    }
  }
}
