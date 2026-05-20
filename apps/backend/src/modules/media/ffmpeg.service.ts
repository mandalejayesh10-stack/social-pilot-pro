import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessVideoOptions {
  trimStart?: number;
  trimEnd?: number;
  volume?: number;
  audioPath?: string;
  audioVolume?: number;
}

@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);
  private readonly tmpDir = path.join(process.cwd(), 'tmp', 'media');
  private ffmpegAvailable = false;

  constructor() {
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }

    // Set explicit paths from env if provided (needed when PATH not updated yet)
    try {
      const ffmpeg = require('fluent-ffmpeg');
      if (process.env.FFMPEG_PATH) {
        ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
      }
      if (process.env.FFPROBE_PATH) {
        ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
      }

      // Verify by running a quick ffprobe check on a dummy input
      // getAvailableFormats checks system PATH, not the explicitly set path
      // So we use a direct spawn check instead
      this.checkFfmpegAvailable(ffmpeg);
    } catch {
      this.logger.warn('⚠️  FFmpeg not found — video processing disabled');
    }
  }

  private checkFfmpegAvailable(ffmpeg: any) {
    // Use ffprobe on a null input to verify the binary works
    const { execFile } = require('child_process');
    const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';

    execFile(ffprobePath, ['-version'], { timeout: 5000 }, (err: any) => {
      if (!err) {
        this.ffmpegAvailable = true;
        this.logger.log('✅ FFmpeg available — video processing enabled');
      } else {
        // Fall back to checking system PATH via fluent-ffmpeg
        ffmpeg.getAvailableFormats((fmtErr: any) => {
          if (!fmtErr) {
            this.ffmpegAvailable = true;
            this.logger.log('✅ FFmpeg available (system PATH) — video processing enabled');
          } else {
            this.logger.warn('⚠️  FFmpeg not found — video processing disabled. Install from https://ffmpeg.org/download.html');
            this.logger.warn('   Or set FFMPEG_PATH and FFPROBE_PATH in .env');
          }
        });
      }
    });
  }

  isAvailable(): boolean { return this.ffmpegAvailable; }

  async processVideo(inputPath: string, options: ProcessVideoOptions = {}): Promise<string> {
    if (!this.ffmpegAvailable) {
      throw new Error('FFmpeg is not installed. Download from https://ffmpeg.org/download.html and add to PATH.');
    }
    const ffmpeg = require('fluent-ffmpeg');
    const outputPath = path.join(this.tmpDir, `${uuidv4()}.mp4`);

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);
      if (options.trimStart !== undefined) command = command.seekInput(options.trimStart);
      if (options.trimEnd !== undefined && options.trimStart !== undefined) {
        command = command.duration(options.trimEnd - options.trimStart);
      }
      const filters: string[] = [];
      if (options.volume !== undefined && options.volume !== 1.0) {
        filters.push(`volume=${options.volume}`);
      }
      if (options.audioPath) {
        command = command.input(options.audioPath);
        const audioVol = options.audioVolume ?? 1.0;
        filters.push(`[1:a]volume=${audioVol}[a1]`);
        filters.push(`[0:a][a1]amix=inputs=2:duration=first[aout]`);
        command = command.complexFilter(filters).outputOptions(['-map 0:v', '-map [aout]']);
      } else if (filters.length > 0) {
        command = command.audioFilters(filters);
      }
      command
        .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-movflags +faststart'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err: any) => reject(err))
        .run();
    });
  }

  async extractThumbnail(videoPath: string, timeSeconds = 1): Promise<string> {
    if (!this.ffmpegAvailable) return '';
    const ffmpeg = require('fluent-ffmpeg');
    const outputPath = path.join(this.tmpDir, `${uuidv4()}.jpg`);
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({ timestamps: [timeSeconds], filename: path.basename(outputPath), folder: path.dirname(outputPath), size: '1280x720' })
        .on('end', () => resolve(outputPath))
        .on('error', reject);
    });
  }

  async getMetadata(filePath: string): Promise<{ duration: number; width: number; height: number; codec: string; bitrate: number }> {
    if (!this.ffmpegAvailable) return { duration: 0, width: 0, height: 0, codec: '', bitrate: 0 };
    const ffmpeg = require('fluent-ffmpeg');
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
        if (err) return reject(err);
        const video = metadata.streams.find((s: any) => s.codec_type === 'video');
        resolve({
          duration: metadata.format.duration || 0,
          width: video?.width || 0,
          height: video?.height || 0,
          codec: video?.codec_name || '',
          bitrate: parseInt(String(metadata.format.bit_rate || '0')),
        });
      });
    });
  }

  cleanup(filePath: string) {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
  }
}
