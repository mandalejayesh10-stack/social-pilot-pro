import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostSchedulerService } from './post-scheduler.service';
import { PostRetryService } from './post-retry.service';
import { IntegrationModule } from '../integration/integration.module';
import { NotificationModule } from '../notification/notification.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [IntegrationModule, NotificationModule, AnalyticsModule],
  controllers: [PostController],
  providers: [PostService, PostSchedulerService, PostRetryService],
  exports: [PostService],
})
export class PostModule {}
