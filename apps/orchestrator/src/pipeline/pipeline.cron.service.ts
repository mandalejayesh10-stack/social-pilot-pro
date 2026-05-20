import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PipelineService } from './pipeline.service';

@Injectable()
export class PipelineCronService {
  private readonly logger = new Logger('Pipeline');

  constructor(private pipeline: PipelineService) {}

  @Cron(process.env.CRON_BASIC_STATS || '*/15 * * * *')
  async basicStats() {
    this.logger.log('▶ Basic stats fetch');
    await this.pipeline.runBasicStats().catch((e) =>
      this.logger.error(`Basic stats error: ${e.message}`),
    );
  }

  @Cron(process.env.CRON_POST_METRICS || '0 * * * *')
  async postMetrics() {
    this.logger.log('▶ Post metrics fetch');
    await this.pipeline.runPostMetrics().catch((e) =>
      this.logger.error(`Post metrics error: ${e.message}`),
    );
  }

  @Cron(process.env.CRON_FULL_ANALYTICS || '0 2 * * *')
  async fullAnalytics() {
    this.logger.log('▶ Full analytics aggregation');
    await this.pipeline.runFullAnalytics().catch((e) =>
      this.logger.error(`Full analytics error: ${e.message}`),
    );
  }
}
