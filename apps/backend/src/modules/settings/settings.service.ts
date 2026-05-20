import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // ── Profile ───────────────────────────────────────────────
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      bio?: string;
      timezone?: string;
      language?: string;
      pictureUrl?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        timezone: true,
        language: true,
        pictureUrl: true,
        providerName: true,
      },
    });
  }

  // ── Organization settings ─────────────────────────────────
  async updateOrganization(
    organizationId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      logoUrl?: string;
      timezone?: string;
      website?: string;
    },
  ) {
    // Verify admin role
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership || !['ADMIN', 'SUPERADMIN'].includes(membership.role)) {
      throw new NotFoundException('Organization not found or insufficient permissions');
    }

    return this.prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  }

  // ── API Key ───────────────────────────────────────────────
  async getApiKey(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { apiKey: true },
    });
    return { apiKey: org?.apiKey || null };
  }

  async regenerateApiKey(organizationId: string) {
    const apiKey = `sp_live_${uuidv4().replace(/-/g, '')}`;
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { apiKey },
    });
    return { apiKey };
  }

  // ── Usage stats ───────────────────────────────────────────
  async getUsageStats(organizationId: string) {
    const [limits, postCount, integrationCount] = await Promise.all([
      this.prisma.usageLimits.findUnique({ where: { organizationId } }),
      this.prisma.post.count({
        where: {
          organizationId,
          state: 'PUBLISHED',
          publishDate: { gte: new Date(new Date().setDate(1)) }, // this month
        },
      }),
      this.prisma.integration.count({
        where: { organizationId, deletedAt: null },
      }),
    ]);

    return {
      posts: {
        used: postCount,
        limit: limits?.postsLimit ?? 10,
        unlimited: limits?.postsLimit === -1,
      },
      accounts: {
        used: integrationCount,
        limit: limits?.accountsLimit ?? 3,
        unlimited: limits?.accountsLimit === -1,
      },
      aiCredits: {
        used: limits?.aiCreditsUsed ?? 0,
        limit: limits?.aiCreditsLimit ?? 10,
        unlimited: limits?.aiCreditsLimit === -1,
      },
      reports: {
        used: limits?.reportsGenerated ?? 0,
        limit: limits?.reportsLimit ?? 0,
        unlimited: limits?.reportsLimit === -1,
      },
    };
  }
}
