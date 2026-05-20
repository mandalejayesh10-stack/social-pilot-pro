import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrchestratorDatabaseModule } from './database/database.module';
import { OrchestratorPipelineModule } from './pipeline/pipeline.module';
import { OrchestratorTokenModule } from './token/token.module';
import { OrchestratorSchedulerModule } from './scheduler/scheduler.module';

/**
 * Orchestrator — dedicated process for all background jobs.
 * Runs independently from the API server for scalability.
 * Shares the same PostgreSQL database.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    OrchestratorDatabaseModule,
    OrchestratorPipelineModule,
    OrchestratorTokenModule,
    OrchestratorSchedulerModule,
  ],
})
export class OrchestratorModule {}
