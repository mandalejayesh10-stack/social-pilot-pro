import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

/**
 * Resets monthly usage counters on the 1st of each month at midnight UTC.
 */
@Injectable()
export class UsageResetService {
  private readonly logger = new Logger(UsageResetService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 0 1 * *')
  async resetMonthlyUsage() {
    this.logger.log('Resetting monthly usage counters...');

    const result = await this.prisma.usageLimits.updateMany({
      data: {
        postsUsed: 0,
        aiCreditsUsed: 0,
        reportsGenerated: 0,
        resetAt: new Date(),
      },
    });

    this.logger.log(`Reset usage for ${result.count} organizations`);
  }

  // Check and handle grace period expirations daily
  @Cron('0 1 * * *')
  async handleGracePeriodExpirations() {
    const now = new Date();

    const expired = await this.prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
        gracePeriodEndsAt: { lte: now },
      },
    });

    for (const sub of expired) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });

      // Downgrade usage limits to FREE
      await this.prisma.usageLimits.updateMany({
        where: { organizationId: sub.organizationId },
        data: {
          postsLimit: 10,
          accountsLimit: 3,
          reportsLimit: 0,
          aiCreditsLimit: 10,
          teamMembersLimit: 1,
        },
      });

      this.logger.log(`Expired subscription for org ${sub.organizationId}`);
    }
  }
}
