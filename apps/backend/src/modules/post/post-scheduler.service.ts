import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PostService } from './post.service';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { TokenRefreshService } from '../integration/token-refresh.service';
import { BestTimeService } from '../analytics/best-time.service';
import { decrypt, safeDecrypt } from '../../common/utils/crypto.util';
import axios from 'axios';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// Per-platform publish timeouts (ms)
const TIMEOUTS = {
  INSTAGRAM_CONTAINER_POLL: 300_000,  // 5 min — video processing
  FACEBOOK_VIDEO_UPLOAD:    300_000,  // 5 min — large video multipart
  YOUTUBE_UPLOAD:           600_000,  // 10 min — large video upload
  META_API_CALL:             30_000,  // 30s — standard API calls
  AXIOS_DEFAULT:             30_000,  // 30s — default axios timeout
};

/** Wrap a promise with a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms / 1000}s: ${label}`)), ms),
    ),
  ]);
}

/**
 * Runs every minute to check for posts due for publishing.
 *
 * ROOT CAUSES FIXED:
 * 1. Media URLs were localhost — now resolved to public ngrok/backend URL
 * 2. No token refresh before publish — now refreshes expired tokens first
 * 3. Instagram video detection used file extension — now uses mimeType from DB
 * 4. Instagram video didn't wait for container processing — now polls status
 * 5. YouTube streamed from localhost URL — now streams from local file path
 * 6. No publish audit log — now writes to PublishLog table
 * 7. No media file existence check — now validates before publish
 */
@Injectable()
export class PostSchedulerService {
  private readonly logger = new Logger(PostSchedulerService.name);

  // Track in-progress post IDs to prevent duplicate publish
  private readonly inProgress = new Set<string>();

  constructor(
    private postService: PostService,
    private prisma: PrismaService,
    private notifications: NotificationService,
    private tokenRefresh: TokenRefreshService,
    private bestTimeService: BestTimeService,
  ) {
    this.runPreflightCheck();
  }

  /** Logs system readiness on startup — helps diagnose issues before first publish */
  private async runPreflightCheck() {
    // Small delay to let NestJS finish bootstrapping
    await new Promise((r) => setTimeout(r, 3000));

    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log('[Preflight] Publishing pipeline status check');

    // 1. FFmpeg
    try {
      const ffmpeg = require('fluent-ffmpeg');
      if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
      if (process.env.FFPROBE_PATH) ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);

      const { execFile } = require('child_process');
      const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';

      await new Promise<void>((resolve) => {
        execFile(ffprobePath, ['-version'], { timeout: 5000 }, (err: any) => {
          if (!err) {
            this.logger.log('[Preflight] ✅ FFmpeg available');
          } else {
            this.logger.warn('[Preflight] ⚠️  FFmpeg NOT found — video thumbnails and Reel validation disabled');
            this.logger.warn('[Preflight]    Set FFMPEG_PATH and FFPROBE_PATH in .env, or install from https://ffmpeg.org/download.html');
          }
          resolve();
        });
      });
    } catch {
      this.logger.warn('[Preflight] ⚠️  FFmpeg NOT found');
    }

    // 2. Public URL check
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000';
    if (backendUrl.includes('localhost')) {
      this.logger.warn(`[Preflight] ⚠️  BACKEND_INTERNAL_URL is localhost (${backendUrl})`);
      this.logger.warn('[Preflight]    Instagram/Facebook image posts will FAIL — Meta cannot fetch localhost URLs');
      this.logger.warn('[Preflight]    Fix: start ngrok, then update BACKEND_INTERNAL_URL in .env');
    } else {
      this.logger.log(`[Preflight] ✅ Public URL: ${backendUrl}`);
    }

    // 3. Upload directory
    const uploadDir = process.env.UPLOAD_DIRECTORY
      ? path.resolve(process.cwd(), process.env.UPLOAD_DIRECTORY)
      : path.resolve(process.cwd(), 'uploads');
    if (fs.existsSync(uploadDir)) {
      const count = fs.readdirSync(uploadDir).length;
      this.logger.log(`[Preflight] ✅ Upload directory: ${uploadDir} (${count} files)`);
    } else {
      this.logger.warn(`[Preflight] ⚠️  Upload directory missing: ${uploadDir}`);
    }

    // 4. Active integrations
    try {
      const integrations = await this.prisma.integration.findMany({
        where: { deletedAt: null, disabled: false },
        select: { platform: true, name: true, tokenExpiry: true, refreshNeeded: true },
      });
      if (integrations.length === 0) {
        this.logger.warn('[Preflight] ⚠️  No connected social accounts');
      } else {
        integrations.forEach((i) => {
          const expiry = i.tokenExpiry ? new Date(i.tokenExpiry) : null;
          const expired = expiry && expiry < new Date();
          const status = expired ? '⚠️  TOKEN EXPIRED' : i.refreshNeeded ? '⚠️  REFRESH NEEDED' : '✅';
          this.logger.log(`[Preflight] ${status} [${i.platform}] ${i.name}${expiry ? ` (expires ${expiry.toLocaleDateString()})` : ''}`);
        });
      }
    } catch (e: any) {
      this.logger.warn(`[Preflight] Could not check integrations: ${e.message}`);
    }

    // 5. Stale claimed posts (from previous crash)
    try {
      const stale = await this.prisma.post.count({
        where: { state: 'QUEUE', error: '__CLAIMED__' },
      });
      if (stale > 0) {
        this.logger.warn(`[Preflight] ⚠️  Found ${stale} stale claimed posts — clearing`);
        await this.prisma.post.updateMany({
          where: { state: 'QUEUE', error: '__CLAIMED__' },
          data: { error: null },
        });
      }
    } catch { /* ignore */ }

    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  @Cron('* * * * *') // every minute
  async processQueue() {
    const duePosts = await this.postService.getDuePosts();
    if (duePosts.length === 0) return;

    this.logger.log(`[Scheduler] Processing ${duePosts.length} scheduled posts`);

    for (const post of duePosts) {
      // Prevent duplicate publish if previous run is still in progress
      if (this.inProgress.has(post.id)) {
        this.logger.warn(`[Scheduler] Post ${post.id} already in progress — skipping`);
        continue;
      }

      this.inProgress.add(post.id);
      const startMs = Date.now();

      try {
        // Clear the claim sentinel and reset error before publishing
        await this.prisma.post.update({
          where: { id: post.id },
          data: { error: null },
        });

        await this.publishPost(post);

        await this.writePublishLog(post.id, post.integration.platform, 'SUCCESS', null, null, Date.now() - startMs);

        // Learning loop: record this publish for best-time engine improvement
        const mediaUrls: string[] = JSON.parse(post.mediaUrls || '[]');
        const contentType = mediaUrls.length === 0 ? 'TEXT' :
                            mediaUrls.length > 1 ? 'CAROUSEL' :
                            mediaUrls[0].match(/\.(mp4|mov|avi|webm)$/i) ? 'VIDEO' : 'IMAGE';
        this.bestTimeService.recordPublishOutcome(
          post.id,
          post.integration.organizationId,
          post.integration.platform,
          new Date(post.publishDate),
          contentType,
        ).catch(() => { /* non-blocking */ });
      } catch (err: any) {
        const errMsg = err?.response?.data
          ? this.humanizeApiError(err.response.data, post.integration.platform)
          : err.message || String(err);

        this.logger.error(`[Scheduler] Post ${post.id} (${post.integration.platform}) FAILED: ${errMsg}`);
        this.logger.error(err.stack);

        await this.postService.markFailed(post.id, errMsg.slice(0, 500));
        await this.writePublishLog(
          post.id,
          post.integration.platform,
          'FAILED',
          errMsg.slice(0, 1000),
          err?.response?.data ? JSON.stringify(err.response.data) : null,
          Date.now() - startMs,
        );

        await this.notifications.create({
          organizationId: post.integration?.organizationId,
          title: 'Post failed to publish',
          message: `${post.integration?.platform} post failed: ${errMsg.slice(0, 120)}`,
          type: 'error',
          link: '/dashboard/calendar',
        });
      } finally {
        this.inProgress.delete(post.id);
      }
    }
  }

  // ── Core publish dispatcher ───────────────────────────────
  private async publishPost(post: any) {
    const platform = post.integration.platform;
    const mediaUrls: string[] = JSON.parse(post.mediaUrls || '[]');

    this.logger.log(`[Publish] Post ${post.id} → ${platform} | media: ${mediaUrls.length} files`);

    // Step 1: Ensure token is fresh before publishing
    const integration = await this.ensureFreshToken(post.integration);

    // Step 2: Decrypt tokens
    const token = decrypt(integration.accessToken);
    const refreshToken = integration.refreshToken ? safeDecrypt(integration.refreshToken) : null;
    const pageToken = integration.pageAccessToken ? safeDecrypt(integration.pageAccessToken) : token;

    // Step 3: Resolve media URLs to public URLs
    const publicMediaUrls = mediaUrls.map((u) => this.resolvePublicUrl(u));

    this.logger.log(`[Publish] Resolved media URLs: ${JSON.stringify(publicMediaUrls)}`);

    // Step 4: Validate media files exist (for local storage)
    for (const url of mediaUrls) {
      this.validateMediaAccess(url);
    }

    // Step 5: Warn if using localhost URLs (Meta/YouTube can't reach them)
    const backendUrl = process.env.BACKEND_INTERNAL_URL || '';
    if (backendUrl.includes('localhost') && mediaUrls.length > 0 && platform !== 'YOUTUBE') {
      this.logger.warn(
        `[Publish] ⚠️  BACKEND_INTERNAL_URL is localhost — Meta APIs cannot fetch media. ` +
        `Start ngrok and update BACKEND_INTERNAL_URL in .env`,
      );
    }

    // Step 6: Dispatch to platform
    if (platform === 'INSTAGRAM') {
      await this.publishToInstagram(post, token, publicMediaUrls, mediaUrls);
    } else if (platform === 'FACEBOOK') {
      await this.publishToFacebook(post, pageToken || token, publicMediaUrls, mediaUrls);
    } else if (platform === 'YOUTUBE') {
      await this.publishToYoutube(post, token, refreshToken, mediaUrls);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  // ── Token freshness ───────────────────────────────────────
  private async ensureFreshToken(integration: any): Promise<any> {
    const now = new Date();
    const expiry = integration.tokenExpiry ? new Date(integration.tokenExpiry) : null;
    const isExpired = expiry && expiry <= new Date(now.getTime() + 5 * 60 * 1000); // 5 min buffer
    const needsRefresh = integration.refreshNeeded || isExpired;

    if (needsRefresh) {
      this.logger.log(`[Token] Refreshing token for integration ${integration.id} (${integration.platform})`);
      try {
        await this.tokenRefresh.refreshIntegrationToken(integration);
        // Re-fetch with fresh token
        const fresh = await this.prisma.integration.findUnique({ where: { id: integration.id } });
        if (!fresh) throw new Error('Integration not found after token refresh');
        return fresh;
      } catch (err: any) {
        this.logger.error(`[Token] Refresh failed for ${integration.id}: ${err.message}`);
        throw new Error(`Token refresh failed: ${err.message}. Please reconnect your ${integration.platform} account.`);
      }
    }

    return integration;
  }

  // ── Resolve localhost URLs to public URLs ─────────────────
  private resolvePublicUrl(url: string): string {
    if (!url) return url;

    // Already absolute public URL
    if (url.startsWith('https://') && !url.includes('localhost')) return url;

    // Extract filename from any URL or path
    const filename = path.basename(url.split('?')[0]);

    // Use BACKEND_INTERNAL_URL (ngrok tunnel) for public access
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    return `${backendUrl}/uploads/${filename}`;
  }

  // ── Validate media file exists locally ───────────────────
  private validateMediaAccess(url: string) {
    if (!url) return;

    // For absolute remote URLs (not localhost), skip local validation
    if ((url.startsWith('https://') || url.startsWith('http://')) && !url.includes('localhost')) {
      return;
    }

    const localPath = this.getLocalPath(url);
    if (!localPath) {
      const filename = path.basename(url.split('?')[0]);
      throw new Error(
        `Media file not found on disk: "${filename}". ` +
        `The file may have been deleted or moved. Please re-upload the media.`,
      );
    }

    const stat = fs.statSync(localPath);
    if (stat.size === 0) {
      throw new Error(`Media file is empty: ${path.basename(localPath)}`);
    }

    this.logger.log(`[Media] ✓ ${path.basename(localPath)} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  // ── Get local file path from URL/relative path ────────────
  private getLocalPath(url: string): string | null {
    if (!url) return null;

    const uploadDir = process.env.UPLOAD_DIRECTORY
      ? path.resolve(process.cwd(), process.env.UPLOAD_DIRECTORY)
      : path.resolve(process.cwd(), 'uploads');

    const filename = path.basename(url.split('?')[0]);
    if (!filename || filename === '.' || filename === '..') return null;

    const localPath = path.join(uploadDir, filename);
    return fs.existsSync(localPath) ? localPath : null;
  }

  // ── Detect if URL/path is a video ─────────────────────────
  private async isVideoMedia(url: string): Promise<boolean> {
    // Check by extension first
    const ext = path.extname(url.split('?')[0]).toLowerCase();
    if (['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'].includes(ext)) return true;
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) return false;

    // Check DB for mimeType
    try {
      const filename = path.basename(url.split('?')[0]);
      const media = await this.prisma.media.findFirst({
        where: { name: filename, deletedAt: null },
        select: { mimeType: true },
      });
      if (media?.mimeType) return media.mimeType.startsWith('video/');
    } catch { /* ignore */ }

    return false;
  }

  // ── Format caption ────────────────────────────────────────
  private formatCaption(post: any): string {
    const content = post.content || '';
    const hashtags = post.hashtags?.trim() || '';
    if (!hashtags) return content;
    return `${content}\n\n${hashtags}`;
  }

  // ── Instagram publish ─────────────────────────────────────
  private async publishToInstagram(
    post: any,
    token: string,
    publicMediaUrls: string[],
    rawMediaUrls: string[],
  ) {
    const META_VERSION = process.env.META_API_VERSION || 'v21.0';
    const BASE = `https://graph.facebook.com/${META_VERSION}`;
    const igId = post.integration.internalId;
    const caption = this.formatCaption(post);

    if (publicMediaUrls.length === 0) {
      throw new Error('Instagram requires at least one media item');
    }

    let mediaId: string;

    if (publicMediaUrls.length === 1) {
      const isVideo = await this.isVideoMedia(rawMediaUrls[0]);

      this.logger.log(`[Instagram] Single media — isVideo: ${isVideo}`);

      const createPayload: any = {
        caption,
        access_token: token,
      };

      if (isVideo) {
        createPayload.video_url = publicMediaUrls[0];
        createPayload.media_type = 'REELS';
      } else {
        createPayload.image_url = publicMediaUrls[0];
      }

      this.logger.log(`[Instagram] Creating container: ${JSON.stringify({ ...createPayload, access_token: '***' })}`);

      const createRes = await withTimeout(
        axios.post(`${BASE}/${igId}/media`, createPayload, { timeout: TIMEOUTS.META_API_CALL }),
        TIMEOUTS.META_API_CALL,
        'Instagram create container',
      );
      mediaId = createRes.data.id;

      // For videos/reels, poll until container is ready
      if (isVideo) {
        mediaId = await this.waitForInstagramContainer(mediaId, token, BASE);
      }
    } else {
      // Carousel — all items must be images for carousel
      this.logger.log(`[Instagram] Creating carousel with ${publicMediaUrls.length} items`);
      const childIds: string[] = [];

      for (let i = 0; i < publicMediaUrls.length; i++) {
        const isVideo = await this.isVideoMedia(rawMediaUrls[i]);
        const childPayload: any = {
          is_carousel_item: true,
          access_token: token,
        };
        if (isVideo) {
          childPayload.video_url = publicMediaUrls[i];
          childPayload.media_type = 'VIDEO';
        } else {
          childPayload.image_url = publicMediaUrls[i];
        }

        const childRes = await withTimeout(
          axios.post(`${BASE}/${igId}/media`, childPayload, { timeout: TIMEOUTS.META_API_CALL }),
          TIMEOUTS.META_API_CALL,
          `Instagram carousel child ${i + 1}`,
        );
        let childId = childRes.data.id;

        if (isVideo) {
          childId = await this.waitForInstagramContainer(childId, token, BASE);
        }

        childIds.push(childId);
      }

      const carouselRes = await withTimeout(
        axios.post(`${BASE}/${igId}/media`, {
          media_type: 'CAROUSEL',
          children: childIds.join(','),
          caption,
          access_token: token,
        }, { timeout: TIMEOUTS.META_API_CALL }),
        TIMEOUTS.META_API_CALL,
        'Instagram create carousel container',
      );
      mediaId = carouselRes.data.id;
    }

    // Publish the container
    this.logger.log(`[Instagram] Publishing container ${mediaId}`);
    const publishRes = await withTimeout(
      axios.post(`${BASE}/${igId}/media_publish`, {
        creation_id: mediaId,
        access_token: token,
      }, { timeout: TIMEOUTS.META_API_CALL }),
      TIMEOUTS.META_API_CALL,
      'Instagram media_publish',
    );

    const publishedId = publishRes.data.id;
    this.logger.log(`[Instagram] Published! ID: ${publishedId}`);

    await this.postService.markPublished(
      post.id,
      publishedId,
      `https://www.instagram.com/p/${publishedId}`,
    );
  }

  // ── Poll Instagram container until FINISHED ───────────────
  private async waitForInstagramContainer(
    containerId: string,
    token: string,
    BASE: string,
    maxWaitMs = TIMEOUTS.INSTAGRAM_CONTAINER_POLL,
  ): Promise<string> {
    const pollInterval = 5000;
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      const statusRes = await withTimeout(
        axios.get(`${BASE}/${containerId}`, {
          params: { fields: 'status_code,status', access_token: token },
          timeout: TIMEOUTS.META_API_CALL,
        }),
        TIMEOUTS.META_API_CALL,
        'Instagram container status poll',
      );

      const statusCode = statusRes.data.status_code;
      this.logger.log(`[Instagram] Container ${containerId} status: ${statusCode}`);

      if (statusCode === 'FINISHED') return containerId;
      if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
        throw new Error(
          `Instagram media container failed: ${statusCode}` +
          (statusRes.data.status ? ` — ${statusRes.data.status}` : '') +
          `. Check video specs: H.264 codec, AAC audio, 9:16 ratio, 3–90 seconds.`,
        );
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    }

    throw new Error(`Instagram media container timed out after ${maxWaitMs / 1000}s. The video may not meet Instagram's requirements.`);
  }

  // ── Facebook publish ──────────────────────────────────────
  private async publishToFacebook(
    post: any,
    pageToken: string,
    publicMediaUrls: string[],
    rawMediaUrls: string[],
  ) {
    const META_VERSION = process.env.META_API_VERSION || 'v21.0';
    const BASE = `https://graph.facebook.com/${META_VERSION}`;
    const pageId = post.integration.pageId || post.integration.internalId;
    const caption = this.formatCaption(post);

    let res: any;

    if (publicMediaUrls.length === 0) {
      // Text-only post
      this.logger.log(`[Facebook] Text-only post to page ${pageId}`);
      res = await withTimeout(
        axios.post(`${BASE}/${pageId}/feed`, {
          message: caption,
          access_token: pageToken,
        }, { timeout: TIMEOUTS.META_API_CALL }),
        TIMEOUTS.META_API_CALL,
        'Facebook text post',
      );
    } else if (publicMediaUrls.length === 1) {
      const isVideo = await this.isVideoMedia(rawMediaUrls[0]);

      if (isVideo) {
        this.logger.log(`[Facebook] Video post to page ${pageId}: ${publicMediaUrls[0]}`);

        const localPath = this.getLocalPath(rawMediaUrls[0]);

        if (localPath) {
          const FormData = require('form-data');
          const form = new FormData();
          form.append('source', fs.createReadStream(localPath));
          form.append('description', caption);
          form.append('access_token', pageToken);

          res = await withTimeout(
            axios.post(`${BASE}/${pageId}/videos`, form, {
              headers: form.getHeaders(),
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              timeout: TIMEOUTS.FACEBOOK_VIDEO_UPLOAD,
            }),
            TIMEOUTS.FACEBOOK_VIDEO_UPLOAD,
            'Facebook video upload (local file)',
          );
        } else {
          res = await withTimeout(
            axios.post(`${BASE}/${pageId}/videos`, {
              file_url: publicMediaUrls[0],
              description: caption,
              access_token: pageToken,
            }, { timeout: TIMEOUTS.FACEBOOK_VIDEO_UPLOAD }),
            TIMEOUTS.FACEBOOK_VIDEO_UPLOAD,
            'Facebook video upload (URL)',
          );
        }
      } else {
        this.logger.log(`[Facebook] Photo post to page ${pageId}: ${publicMediaUrls[0]}`);
        res = await withTimeout(
          axios.post(`${BASE}/${pageId}/photos`, {
            url: publicMediaUrls[0],
            caption,
            access_token: pageToken,
          }, { timeout: TIMEOUTS.META_API_CALL }),
          TIMEOUTS.META_API_CALL,
          'Facebook photo post',
        );
      }
    } else {
      // Multi-photo post
      this.logger.log(`[Facebook] Multi-photo post (${publicMediaUrls.length} images) to page ${pageId}`);
      const photoIds: string[] = [];

      for (const url of publicMediaUrls) {
        const photoRes = await withTimeout(
          axios.post(`${BASE}/${pageId}/photos`, {
            url,
            published: false,
            access_token: pageToken,
          }, { timeout: TIMEOUTS.META_API_CALL }),
          TIMEOUTS.META_API_CALL,
          'Facebook stage photo',
        );
        photoIds.push(photoRes.data.id);
      }

      res = await withTimeout(
        axios.post(`${BASE}/${pageId}/feed`, {
          message: caption,
          attached_media: photoIds.map((id) => ({ media_fbid: id })),
          access_token: pageToken,
        }, { timeout: TIMEOUTS.META_API_CALL }),
        TIMEOUTS.META_API_CALL,
        'Facebook multi-photo feed post',
      );
    }

    const publishedId = res.data.id;
    this.logger.log(`[Facebook] Published! ID: ${publishedId}`);

    await this.postService.markPublished(
      post.id,
      publishedId,
      `https://www.facebook.com/${publishedId}`,
    );
  }

  // ── YouTube publish ───────────────────────────────────────
  private async publishToYoutube(
    post: any,
    accessToken: string,
    refreshToken: string | null,
    rawMediaUrls: string[],
  ) {
    if (rawMediaUrls.length === 0) {
      throw new Error('YouTube requires a video file');
    }

    const auth = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
    );
    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
    });

    // Auto-refresh if token is expired
    auth.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        this.logger.log(`[YouTube] Token auto-refreshed for integration ${post.integration.id}`);
        const { encrypt } = await import('../../common/utils/crypto.util');
        await this.prisma.integration.update({
          where: { id: post.integration.id },
          data: {
            accessToken: encrypt(tokens.access_token),
            ...(tokens.expiry_date && { tokenExpiry: new Date(tokens.expiry_date) }),
          },
        });
      }
    });

    const youtube = google.youtube({ version: 'v3', auth });

    // CRITICAL FIX: Always stream from local file — never from localhost URL
    // Google's servers cannot reach localhost
    const videoUrl = rawMediaUrls[0];
    const localPath = this.getLocalPath(videoUrl);

    if (!localPath) {
      // Last resort: try to download from public URL
      const publicUrl = this.resolvePublicUrl(videoUrl);
      if (publicUrl.includes('localhost')) {
        throw new Error(
          `YouTube upload requires a publicly accessible video file. ` +
          `The file "${path.basename(videoUrl)}" is only available on localhost. ` +
          `Ensure BACKEND_INTERNAL_URL is set to your ngrok tunnel URL.`,
        );
      }
      this.logger.log(`[YouTube] Downloading video from public URL: ${publicUrl}`);
      const axiosRes = await withTimeout(
        axios.get(publicUrl, { responseType: 'stream', timeout: TIMEOUTS.AXIOS_DEFAULT }),
        60_000,
        'YouTube download from public URL',
      );

      const title = post.title || post.content.slice(0, 100) || 'Untitled Video';
      const description = this.formatCaption(post);
      const tags = post.hashtags?.match(/#\w+/g)?.map((t: string) => t.slice(1)) || [];

      this.logger.log(`[YouTube] Uploading video: "${title}"`);

      const res = await withTimeout(
        youtube.videos.insert({
          part: ['snippet', 'status'],
          requestBody: {
            snippet: { title, description, tags, categoryId: '22' },
            status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
          },
          media: { body: axiosRes.data },
        }),
        TIMEOUTS.YOUTUBE_UPLOAD,
        'YouTube video insert (URL fallback)',
      );

      const videoId = res.data.id!;
      this.logger.log(`[YouTube] Published! Video ID: ${videoId}`);
      await this.postService.markPublished(post.id, videoId, `https://www.youtube.com/watch?v=${videoId}`);
      return;
    }

    // Stream directly from local file — most reliable
    this.logger.log(`[YouTube] Uploading from local file: ${localPath} (${(fs.statSync(localPath).size / 1024 / 1024).toFixed(2)} MB)`);

    const title = post.title || post.content.slice(0, 100) || 'Untitled Video';
    const description = this.formatCaption(post);
    const tags = post.hashtags?.match(/#\w+/g)?.map((t: string) => t.slice(1)) || [];

    // Detect YouTube Short: ≤60s AND 9:16 aspect ratio
    // Add #Shorts to title/tags so YouTube classifies it correctly
    let finalTitle = title;
    let finalTags = [...tags];
    try {
      const ffmpeg = require('fluent-ffmpeg');
      const meta: any = await new Promise((res, rej) =>
        ffmpeg.ffprobe(localPath, (e: any, d: any) => e ? rej(e) : res(d)),
      );
      const videoStream = meta.streams?.find((s: any) => s.codec_type === 'video');
      const duration = parseFloat(meta.format?.duration || '0');
      const w = videoStream?.width || 0;
      const h = videoStream?.height || 0;
      const isShort = duration > 0 && duration <= 60 && h > w; // portrait + ≤60s

      if (isShort) {
        this.logger.log(`[YouTube] Detected as Short (${duration.toFixed(1)}s, ${w}×${h})`);
        if (!finalTitle.includes('#Shorts')) finalTitle = `${finalTitle} #Shorts`;
        if (!finalTags.includes('Shorts')) finalTags.unshift('Shorts');
      }
    } catch { /* ffprobe unavailable — skip Short detection */ }

    const res = await withTimeout(
      youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: { title: finalTitle.slice(0, 100), description, tags: finalTags, categoryId: '22' },
          status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
        },
        media: {
          mimeType: 'video/*',
          body: fs.createReadStream(localPath),
        },
      }),
      TIMEOUTS.YOUTUBE_UPLOAD,
      'YouTube video insert',
    );

    const videoId = res.data.id!;
    this.logger.log(`[YouTube] Published! Video ID: ${videoId}`);
    await this.postService.markPublished(post.id, videoId, `https://www.youtube.com/watch?v=${videoId}`);
  }

  // ── Humanize platform API errors ─────────────────────────
  private humanizeApiError(data: any, platform: string): string {
    const raw = JSON.stringify(data);

    // Meta / Facebook / Instagram errors
    if (data?.error) {
      const { message, code, error_subcode, type } = data.error;
      const base = message || raw;

      // Code 200 = API access blocked — app permissions issue
      if (code === 200) {
        return (
          `${platform} API access blocked (code 200). ` +
          `Your Meta app likely needs "pages_manage_posts" permission approved. ` +
          `Go to developers.facebook.com → your app → App Review → Request permissions. ` +
          `If in Development mode, add yourself as a test user. ` +
          `Original: ${base}`
        );
      }
      // Code 190 = token expired/invalid
      if (code === 190) {
        return (
          `${platform} access token expired or invalid (code 190). ` +
          `Please reconnect your ${platform} account in Settings → Connections. ` +
          `Original: ${base}`
        );
      }
      // Code 100 = invalid parameter
      if (code === 100) {
        return `${platform} invalid parameter (code 100): ${base}. Check media URL is publicly accessible.`;
      }
      // Code 368 = temporarily blocked
      if (code === 368) {
        return `${platform} account temporarily blocked (code 368). Wait 24h and try again. Original: ${base}`;
      }
      return `${platform} API error (code ${code}): ${base}`;
    }

    // YouTube errors
    if (data?.errors || data?.error?.errors) {
      const errors = data.errors || data.error.errors;
      const reasons = errors.map((e: any) => `${e.reason}: ${e.message}`).join('; ');
      if (reasons.includes('quotaExceeded')) {
        return `YouTube quota exceeded. Daily upload limit reached (10,000 units/day). Try again tomorrow.`;
      }
      if (reasons.includes('forbidden')) {
        return `YouTube upload forbidden. Reconnect your YouTube account in Settings → Connections.`;
      }
      return `YouTube API error: ${reasons}`;
    }

    return raw.slice(0, 500);
  }

  // ── Write publish audit log ───────────────────────────────
  private async writePublishLog(
    postId: string,
    platform: string,
    status: 'SUCCESS' | 'FAILED' | 'RETRYING',
    error: string | null,
    apiResponse: string | null,
    durationMs: number,
  ) {
    try {
      await this.prisma.publishLog.create({
        data: {
          postId,
          platform: platform as any,
          status: status as any,
          error,
          apiResponse,
          durationMs,
        },
      });
    } catch (e: any) {
      // Don't let log failure break the publish flow
      this.logger.warn(`[PublishLog] Failed to write log: ${e.message}`);
    }
  }
}
