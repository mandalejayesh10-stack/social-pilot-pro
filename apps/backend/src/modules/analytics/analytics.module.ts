import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { RealTimeAnalyticsService } from './real-time-analytics.service';
import { BestTimeService } from './best-time.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RealTimeAnalyticsService, BestTimeService],
  exports: [AnalyticsService, RealTimeAnalyticsService, BestTimeService],
})
export class AnalyticsModule {}
