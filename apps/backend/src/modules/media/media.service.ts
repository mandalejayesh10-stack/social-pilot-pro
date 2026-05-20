import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FfmpegService, ProcessVideoOptions } from './ffmpeg.service';
import { MediaValidatorService } from './media-validator.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir = process.env.UPLOAD_DIRECTORY || './uploads';

  constructor(
    private prisma: PrismaService,
    private ffmpeg: FfmpegService,
    private validator: MediaValidatorService,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadMedia(
    organizationId: string,
    file: Express.Multer.File,
  ) {
    const isVideo = file.mimetype.startsWith('video/');
    const isAudio = file.mimetype.startsWith('audio/');
    const type = isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : 'IMAGE';

    let thumbnail: string | undefined;
    let width: number | undefined;
    let height: number | undefined;
    let duration: number | undefined;

    if (isVideo) {
      const meta = await this.ffmpeg.getMetadata(file.path);
      width = meta.width;
      height = meta.height;
      duration = meta.duration;
      const thumbPath = await this.ffmpeg.extractThumbnail(file.path);
      if (thumbPath) {
        // Move thumbnail from tmp dir into uploads dir so it's served statically
        const thumbFilename = path.basename(thumbPath);
        const destPath = path.join(this.uploadDir, thumbFilename);
        if (thumbPath !== destPath) {
          fs.copyFileSync(thumbPath, destPath);
          this.ffmpeg.cleanup(thumbPath);
        }
        thumbnail = thumbFilename;
      }
    }

    if (type === 'IMAGE') {
      try {
        const sharp = require('sharp');
        const meta = await sharp(file.path).metadata();
        width = meta.width;
        height = meta.height;
      } catch {
        // sharp not available, skip metadata
      }
    }

    const media = await this.prisma.media.create({
      data: {
        organizationId,
        name: file.filename,
        originalName: file.originalname,
        path: file.path,
        // Store relative URL — frontend prepends NEXT_PUBLIC_BACKEND_URL at render time.
        // This prevents stored URLs from breaking when the ngrok tunnel restarts.
        url: `/uploads/${file.filename}`,
        type: type as any,
        mimeType: file.mimetype,
        fileSize: file.size,
        width,
        height,
        duration,
        thumbnail: thumbnail ? `/uploads/${thumbnail}` : undefined,
      },
    });

    return media;
  }

  async processVideo(
    organizationId: string,
    mediaId: string,
    options: ProcessVideoOptions,
  ) {
    const media = await this.prisma.media.findFirst({
      where: { id: mediaId, organizationId, deletedAt: null },
    });
    if (!media) throw new NotFoundException('Media not found');

    const outputPath = await this.ffmpeg.processVideo(media.path, options);
    const meta = await this.ffmpeg.getMetadata(outputPath);
    const thumbPath = await this.ffmpeg.extractThumbnail(outputPath);

    // Move processed file from tmp dir into the uploads dir so it's served statically
    const uploadDir = process.env.UPLOAD_DIRECTORY || './uploads';
    const outputFilename = path.basename(outputPath);
    const finalOutputPath = path.join(uploadDir, outputFilename);
    if (outputPath !== finalOutputPath) {
      fs.copyFileSync(outputPath, finalOutputPath);
      this.ffmpeg.cleanup(outputPath);
    }

    // Move thumbnail into uploads dir too
    let thumbnailUrl: string | undefined;
    if (thumbPath) {
      const thumbFilename = path.basename(thumbPath);
      const finalThumbPath = path.join(uploadDir, thumbFilename);
      if (thumbPath !== finalThumbPath) {
        fs.copyFileSync(thumbPath, finalThumbPath);
        this.ffmpeg.cleanup(thumbPath);
      }
      thumbnailUrl = `/uploads/${thumbFilename}`;
    }

    const processed = await this.prisma.media.create({
      data: {
        organizationId,
        name: outputFilename,
        originalName: media.originalName,
        path: finalOutputPath,
        url: `/uploads/${outputFilename}`,
        type: 'PROCESSED_VIDEO',
        mimeType: 'video/mp4',
        fileSize: fs.statSync(finalOutputPath).size,
        width: meta.width,
        height: meta.height,
        duration: meta.duration,
        thumbnail: thumbnailUrl,
        processed: true,
        processingMeta: JSON.stringify(options),
      },
    });

    return processed;
  }

  async getMedia(organizationId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, Math.max(1, limit || 20));
    const skip = (safePage - 1) * safeLimit;
    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.media.count({ where: { organizationId, deletedAt: null } }),
    ]);
    return { items, total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
  }

  async deleteMedia(organizationId: string, mediaId: string) {
    const media = await this.prisma.media.findFirst({
      where: { id: mediaId, organizationId, deletedAt: null },
    });
    if (!media) throw new NotFoundException('Media not found');

    await this.prisma.media.update({
      where: { id: mediaId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Media deleted' };
  }

  async validateForPlatform(
    organizationId: string,
    mediaId: string,
    opts: { platform: 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE'; isReel?: boolean; isShort?: boolean },
  ) {
    const media = await this.prisma.media.findFirst({
      where: { id: mediaId, organizationId, deletedAt: null },
    });
    if (!media) throw new NotFoundException('Media not found');

    const localPath = path.resolve(process.cwd(), this.uploadDir, media.name);
    const mediaType = media.type === 'IMAGE' ? 'IMAGE' : 'VIDEO';

    const result = await this.validator.validate(localPath, media.mimeType || '', {
      platform: opts.platform,
      mediaType,
      isReel: opts.isReel,
      isShort: opts.isShort,
    });

    return {
      mediaId,
      platform: opts.platform,
      ...result,
    };
  }
}
