import {
  Controller, Get, Post, Delete, Body, Param,
  Query, UseGuards, UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { MediaService } from './media.service';
import { FfmpegService } from './ffmpeg.service';
import { MediaValidatorService } from './media-validator.service';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { ProcessVideoOptions } from './ffmpeg.service';

// Allowed MIME type prefixes — enforced server-side regardless of client
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];

function mimeTypeFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const allowed = ALLOWED_MIME_PREFIXES.some((prefix) =>
    file.mimetype.startsWith(prefix),
  );
  if (allowed) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Only images, videos, and audio are allowed.`,
      ),
      false,
    );
  }
}

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
@UseGuards(OrgMemberGuard)
export class MediaController {
  constructor(
    private mediaService: MediaService,
    private ffmpeg: FfmpegService,
    private validator: MediaValidatorService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Check media processing capabilities' })
  async getStatus() {
    return {
      ffmpeg: this.ffmpeg.isAvailable(),
      storage: process.env.STORAGE_PROVIDER || 'local',
      uploadDir: process.env.UPLOAD_DIRECTORY || './uploads',
      maxFileSize: '500MB',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get media library' })
  async getMedia(
    @CurrentOrg() org: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1') || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20') || 20));
    return this.mediaService.getMedia(org.id, p, l);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload image, video, or audio' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIRECTORY || './uploads',
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      fileFilter: mimeTypeFilter,
      limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    }),
  )
  async upload(@CurrentOrg() org: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided. Send a multipart/form-data request with a "file" field.');
    }
    return this.mediaService.uploadMedia(org.id, file);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process video (trim, merge audio, adjust volume)' })
  async processVideo(
    @CurrentOrg() org: any,
    @Param('id') id: string,
    @Body() options: ProcessVideoOptions,
  ) {
    return this.mediaService.processVideo(org.id, id, options);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate media for a specific platform before scheduling' })
  async validateMedia(
    @CurrentOrg() org: any,
    @Param('id') id: string,
    @Body() body: { platform: 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE'; isReel?: boolean; isShort?: boolean },
  ) {
    return this.mediaService.validateForPlatform(org.id, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media' })
  async delete(@CurrentOrg() org: any, @Param('id') id: string) {
    return this.mediaService.deleteMedia(org.id, id);
  }
}
