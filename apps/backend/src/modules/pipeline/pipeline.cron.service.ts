import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PipelineService } from './pipeline.service';

/**
 * Three-tier cron pipeline:
 *  - Every 15 min  → basic stats (followers, subscriber count)
 *  - Every hour    → post-level metrics (likes, comments, reach)
 *  - Daily at 2am  → full analytics aggregation + summary computation
 */
@Injectable()
export class PipelineCronService {
  private readonly logger = new Logger(PipelineCronService.name);

  constructor(private pipeline: PipelineService) {}

  // ── Tier 1: Basic stats every 15 minutes ─────────────────
  @Cron(process.env.CRON_BASIC_STATS || '*/15 * * * *')
  async runBasicStats() {
    this.logger.log('[Pipeline] Running basic stats fetch...');
    try {
      await this.pipeline.runBasicStats();
    } catch (err) {
      this.logger.error(`[Pipeline] Basic stats failed: ${err.message}`);
    }
  }

  // ── Tier 2: Post metrics every hour ──────────────────────
  @Cron(process.env.CRON_POST_METRICS || '0 * * * *')
  async runPostMetrics() {
    this.logger.log('[Pipeline] Running post metrics fetch...');
    try {
      await this.pipeline.runPostMetrics();
    } catch (err) {
      this.logger.error(`[Pipeline] Post metrics failed: ${err.message}`);
    }
  }

  // ── Tier 3: Full analytics daily at 2am ──────────────────
  @Cron(process.env.CRON_FULL_ANALYTICS || '0 2 * * *')
  async runFullAnalytics() {
    this.logger.log('[Pipeline] Running full analytics aggregation...');
    try {
      await this.pipeline.runFullAnalytics();
    } catch (err) {
      this.logger.error(`[Pipeline] Full analytics failed: ${err.message}`);
    }
  }
}
