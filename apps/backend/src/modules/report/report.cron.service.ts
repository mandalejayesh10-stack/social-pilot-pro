import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { ReportService } from './report.service';

/**
 * Processes scheduled reports — runs daily at 6am UTC.
 */
@Injectable()
export class ReportCronService {
  private readonly logger = new Logger(ReportCronService.name);

  constructor(
    private prisma: PrismaService,
    private reportService: ReportService,
  ) {}

  @Cron('0 6 * * *')
  async processScheduledReports() {
    const now = new Date();
    const due = await this.prisma.report.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: now },
      },
      take: 10,
    });

    if (!due.length) return;
    this.logger.log(`Processing ${due.length} scheduled reports`);

    for (const report of due) {
      try {
        await this.reportService.generateReport(report.id);
      } catch (e: any) {
        this.logger.error(`Scheduled report ${report.id} failed: ${e.message}`);
      }
    }
  }
}
