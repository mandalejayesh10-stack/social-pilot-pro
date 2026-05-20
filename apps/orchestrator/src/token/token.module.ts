import { Module } from '@nestjs/common';
import { TokenRefreshService } from './token-refresh.service';

@Module({
  providers: [TokenRefreshService],
})
export class OrchestratorTokenModule {}
