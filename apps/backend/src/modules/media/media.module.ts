import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { FfmpegService } from './ffmpeg.service';
import { StorageService } from './storage.service';
import { MediaValidatorService } from './media-validator.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService, FfmpegService, StorageService, MediaValidatorService],
  exports: [MediaService, StorageService, MediaValidatorService],
})
export class MediaModule {}
