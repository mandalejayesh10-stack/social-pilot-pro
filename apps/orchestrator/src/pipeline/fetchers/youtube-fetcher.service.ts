import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class YoutubeFetcherService {
  private readonly logger = new Logger('YoutubeFetcher');

  private auth(accessToken: string, refreshToken?: string | null) {
    const a = new google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET);
    a.setCredentials({ access_token: accessToken, refresh_token: refreshToken || undefined });
    return a;
  }

  async fetchChannelStats(channelId: string, token: string, refresh?: string | null) {
    const yt = google.youtube({ version: 'v3', auth: this.auth(token, refresh) });
    const res = await yt.channels.list({ part: ['statistics', 'snippet'], id: [channelId] });
    const ch = res.data.items?.[0];
    if (!ch) return {};
    return {
      subscriberCount: parseInt(ch.statistics?.subscriberCount || '0'),
      viewCount: parseInt(ch.statistics?.viewCount || '0'),
      videoCount: parseInt(ch.statistics?.videoCount || '0'),
      title: ch.snippet?.title,
    };
  }

  async fetchVideoMetrics(videoIds: string[], token: string, refresh?: string | null) {
    if (!videoIds.length) return {};
    const yt = google.youtube({ version: 'v3', auth: this.auth(token, refresh) });
    const results: Record<string, any> = {};
    const chunks = this.chunk(videoIds, 50);
    for (const batch of chunks) {
      const res = await yt.videos.list({ part: ['statistics', 'snippet'], id: batch });
      for (const v of res.data.items || []) {
        results[v.id!] = {
          views: parseInt(v.statistics?.viewCount || '0'),
          likes: parseInt(v.statistics?.likeCount || '0'),
          comments: parseInt(v.statistics?.commentCount || '0'),
        };
      }
    }
    return results;
  }

  async fetchAnalytics(channelId: string, token: string, refresh?: string | null) {
    const ya = google.youtubeAnalytics({ version: 'v2', auth: this.auth(token, refresh) });
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    try {
      const res = await ya.reports.query({
        ids: `channel==${channelId}`,
        startDate: start,
        endDate: end,
        metrics: 'views,estimatedMinutesWatched,likes,comments,shares,subscribersGained,subscribersLost',
        dimensions: 'day',
        sort: 'day',
      });
      return { rows: res.data.rows || [], columnHeaders: res.data.columnHeaders || [] };
    } catch (e: any) {
      this.logger.warn(`YT Analytics: ${e.message}`);
      return { rows: [], columnHeaders: [] };
    }
  }

  private chunk<T>(arr: T[], n: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  }
}
