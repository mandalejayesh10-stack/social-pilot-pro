import { Module } from '@nestjs/common';
import { PostSchedulerService } from './post-scheduler.service';

@Module({
  providers: [PostSchedulerService],
})
export class OrchestratorSchedulerModule {}
