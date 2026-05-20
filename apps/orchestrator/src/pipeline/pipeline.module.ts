import { Module } from '@nestjs/common';
import { PipelineCronService } from './pipeline.cron.service';
import { MetaFetcherService } from './fetchers/meta-fetcher.service';
import { YoutubeFetcherService } from './fetchers/youtube-fetcher.service';
import { MetricsComputeService } from './compute/metrics-compute.service';
import { PipelineService } from './pipeline.service';

@Module({
  providers: [
    PipelineCronService,
    PipelineService,
    MetaFetcherService,
    YoutubeFetcherService,
    MetricsComputeService,
  ],
})
export class OrchestratorPipelineModule {}
