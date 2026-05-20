import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class YoutubeFetcherService {
  private readonly logger = new Logger(YoutubeFetcherService.name);

  private createAuth(accessToken: string, refreshToken?: string | null) {
    const auth = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
    );
    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
    });
    return auth;
  }

  // ── Channel basic stats ───────────────────────────────────
  async fetchChannelStats(channelId: string, accessToken: string, refreshToken?: string | null) {
    const auth = this.createAuth(accessToken, refreshToken);
    const youtube = google.youtube({ version: 'v3', auth });

    const res = await youtube.channels.list({
      part: ['statistics', 'snippet'],
      id: [channelId],
    });

    const channel = res.data.items?.[0];
    if (!channel) return {};

    return {
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
      viewCount: parseInt(channel.statistics?.viewCount || '0'),
      videoCount: parseInt(channel.statistics?.videoCount || '0'),
      title: channel.snippet?.title,
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
    };
  }

  // ── Video metrics ─────────────────────────────────────────
  async fetchVideoMetrics(
    videoIds: string[],
    accessToken: string,
    refreshToken?: string | null,
  ) {
    if (videoIds.length === 0) return {};

    const auth = this.createAuth(accessToken, refreshToken);
    const youtube = google.youtube({ version: 'v3', auth });

    const results: Record<string, any> = {};

    // Batch in groups of 50
    const batches = this.chunk(videoIds, 50);
    for (const batch of batches) {
      const res = await youtube.videos.list({
        part: ['statistics', 'snippet'],
        id: batch,
      });

      for (const video of res.data.items || []) {
        results[video.id!] = {
          views: parseInt(video.statistics?.viewCount || '0'),
          likes: parseInt(video.statistics?.likeCount || '0'),
          comments: parseInt(video.statistics?.commentCount || '0'),
          favorites: parseInt(video.statistics?.favoriteCount || '0'),
          title: video.snippet?.title,
          publishedAt: video.snippet?.publishedAt,
        };
      }
    }

    return results;
  }

  // ── YouTube Analytics (requires yt-analytics scope) ──────
  async fetchAnalytics(
    channelId: string,
    accessToken: string,
    refreshToken?: string | null,
  ) {
    const auth = this.createAuth(accessToken, refreshToken);
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    try {
      const res = await youtubeAnalytics.reports.query({
        ids: `channel==${channelId}`,
        startDate,
        endDate,
        metrics: 'views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained,subscribersLost',
        dimensions: 'day',
        sort: 'day',
      });

      return {
        rows: res.data.rows || [],
        columnHeaders: res.data.columnHeaders || [],
      };
    } catch (err) {
      this.logger.warn(`YouTube Analytics API failed: ${err.message}`);
      return { rows: [], columnHeaders: [] };
    }
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
