import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from '../notification/notification.service';

/**
 * Retries failed posts up to 3 times with exponential backoff.
 *
 * FIX: Only retry posts that failed within the last 2 hours (not old posts).
 * FIX: Track retry count in a dedicated field, not by parsing error strings.
 * FIX: Don't retry posts that are more than 24h past their scheduled time.
 */
@Injectable()
export class PostRetryService {
  private readonly logger = new Logger(PostRetryService.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  // Run every 15 minutes — retry recently failed posts
  @Cron('*/15 * * * *')
  async retryFailedPosts() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const failed = await this.prisma.post.findMany({
      where: {
        state: 'ERROR',
        deletedAt: null,
        updatedAt: { gte: twoHoursAgo },
        publishDate: { gte: oneDayAgo },
      },
      include: {
        integration: { select: { organizationId: true, platform: true } },
        publishLogs: {
          where: { status: 'FAILED' },
          orderBy: { createdAt: 'desc' },
        },
      },
      take: 20,
    });

    for (const post of failed) {
      const failedAttempts = post.publishLogs?.length || 0;

      // Check if the error is permanent (permissions, quota, invalid account)
      // — no point retrying these, they need human action
      const lastError = post.error || '';
      const isPermanent = this.isPermanentError(lastError);

      if (isPermanent) {
        this.logger.warn(`[Retry] Post ${post.id} has permanent error — skipping retry: ${lastError.slice(0, 100)}`);
        await this.notifications.create({
          organizationId: post.integration.organizationId,
          title: 'Post requires attention',
          message: `A ${post.integration.platform} post failed with a permanent error that cannot be auto-retried. ${lastError.slice(0, 120)}`,
          type: 'error',
          link: `/dashboard/calendar`,
        });
        continue;
      }

      if (failedAttempts >= this.MAX_RETRIES) {
        this.logger.warn(`[Retry] Post ${post.id} exceeded max retries (${this.MAX_RETRIES}) — giving up`);
        await this.notifications.create({
          organizationId: post.integration.organizationId,
          title: 'Post failed permanently',
          message: `A ${post.integration.platform} post failed after ${this.MAX_RETRIES} attempts. Please check your account connection and reschedule.`,
          type: 'error',
          link: `/dashboard/calendar`,
        });
        continue;
      }

      const backoffMinutes = Math.pow(2, failedAttempts) * 5;
      const retryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await this.prisma.post.update({
        where: { id: post.id },
        data: {
          state: 'QUEUE',
          publishDate: retryAt,
          error: `[retry:${failedAttempts + 1}/${this.MAX_RETRIES}] ${post.error?.replace(/\[retry:\d+\/\d+\] /, '') || ''}`,
        },
      });

      try {
        await this.prisma.publishLog.create({
          data: {
            postId: post.id,
            platform: post.integration.platform as any,
            status: 'RETRYING',
            error: `Retry attempt ${failedAttempts + 1}/${this.MAX_RETRIES} scheduled for ${retryAt.toISOString()}`,
          },
        });
      } catch { /* ignore log failure */ }

      this.logger.log(`[Retry] Post ${post.id} — attempt ${failedAttempts + 1}/${this.MAX_RETRIES} at ${retryAt.toISOString()} (+${backoffMinutes}min)`);
    }
  }

  /**
   * Errors that cannot be fixed by retrying — require human action.
   * Retrying these wastes API quota and creates noise.
   */
  private isPermanentError(error: string): boolean {
    const permanent = [
      'API access blocked',           // Meta code 200 — permissions not approved
      'code 200',                      // Meta permissions
      'code 368',                      // Meta temporarily blocked
      'quotaExceeded',                 // YouTube daily quota
      'reconnect your',                // Token invalid
      'Please reconnect',              // Token invalid
      'Token refresh failed',          // Can't refresh token
      'Instagram requires at least',   // No media — scheduling error
      'YouTube requires a video',      // No video — scheduling error
    ];
    return permanent.some((p) => error.toLowerCase().includes(p.toLowerCase()));
  }

  // Daily cleanup — archive old error posts
  @Cron('0 3 * * *')
  async cleanupOldErrors() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.post.updateMany({
      where: {
        state: 'ERROR',
        updatedAt: { lt: thirtyDaysAgo },
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
    if (result.count > 0) {
      this.logger.log(`[Cleanup] Archived ${result.count} old failed posts`);
    }
  }
}
