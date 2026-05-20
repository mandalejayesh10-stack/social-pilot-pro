import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportCronService } from './report.cron.service';
import { PdfService } from './pdf.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [AnalyticsModule, AiModule, NotificationModule],
  controllers: [ReportController],
  providers: [ReportService, ReportCronService, PdfService],
  exports: [ReportService],
})
export class ReportModule {}
