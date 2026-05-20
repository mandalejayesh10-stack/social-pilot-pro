import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { PipelineCronService } from './pipeline.cron.service';
import { MetaFetcherService } from './fetchers/meta-fetcher.service';
import { YoutubeFetcherService } from './fetchers/youtube-fetcher.service';
import { MetricsComputeService } from './compute/metrics-compute.service';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [IntegrationModule],
  providers: [
    PipelineService,
    PipelineCronService,
    MetaFetcherService,
    YoutubeFetcherService,
    MetricsComputeService,
  ],
  exports: [PipelineService],
})
export class PipelineModule {}
