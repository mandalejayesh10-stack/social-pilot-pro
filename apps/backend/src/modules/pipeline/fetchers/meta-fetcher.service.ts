import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const META_VERSION = process.env.META_API_VERSION || 'v21.0';
const BASE = `https://graph.facebook.com/${META_VERSION}`;

@Injectable()
export class MetaFetcherService {
  private readonly logger = new Logger(MetaFetcherService.name);

  // ── Basic stats (followers, profile info) ─────────────────
  async fetchBasicStats(platform: string, accountId: string, token: string) {
    if (platform === 'INSTAGRAM') {
      const res = await axios.get(`${BASE}/${accountId}`, {
        params: {
          access_token: token,
          fields: 'followers_count,follows_count,media_count,name,username,profile_picture_url',
        },
      });
      return res.data;
    }

    if (platform === 'FACEBOOK') {
      const res = await axios.get(`${BASE}/${accountId}`, {
        params: {
          access_token: token,
          fields: 'fan_count,name,picture,category',
        },
      });
      return res.data;
    }

    return {};
  }

  // ── Instagram post insights ───────────────────────────────
  async fetchPostInsights(mediaIds: string[], token: string) {
    const results: Record<string, any> = {};

    // Batch in groups of 50
    const batches = this.chunk(mediaIds, 50);
    for (const batch of batches) {
      for (const mediaId of batch) {
        try {
          const res = await axios.get(`${BASE}/${mediaId}/insights`, {
            params: {
              access_token: token,
              metric: 'impressions,reach,likes,comments,shares,saved,video_views',
            },
          });
          results[mediaId] = this.parseInsights(res.data.data);
        } catch (err) {
          this.logger.warn(`Failed to fetch insights for media ${mediaId}: ${err.message}`);
        }
      }
    }

    return results;
  }

  // ── Facebook page post insights ───────────────────────────
  async fetchPagePostInsights(postIds: string[], token: string) {
    const results: Record<string, any> = {};

    for (const postId of postIds) {
      try {
        const res = await axios.get(`${BASE}/${postId}/insights`, {
          params: {
            access_token: token,
            metric: 'post_impressions,post_reach,post_reactions_by_type_total,post_clicks',
          },
        });
        results[postId] = this.parseInsights(res.data.data);
      } catch (err) {
        this.logger.warn(`Failed to fetch page post insights for ${postId}: ${err.message}`);
      }
    }

    return results;
  }

  // ── Instagram account insights (daily) ───────────────────
  async fetchInstagramInsights(accountId: string, token: string) {
    const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const until = Math.floor(Date.now() / 1000);

    const res = await axios.get(`${BASE}/${accountId}/insights`, {
      params: {
        access_token: token,
        metric: 'impressions,reach,follower_count,profile_views',
        period: 'day',
        since,
        until,
      },
    });

    return res.data.data;
  }

  // ── Facebook page insights (daily) ───────────────────────
  async fetchPageInsights(pageId: string, token: string) {
    const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const until = Math.floor(Date.now() / 1000);

    const res = await axios.get(`${BASE}/${pageId}/insights`, {
      params: {
        access_token: token,
        metric: 'page_impressions,page_reach,page_fans,page_engaged_users',
        period: 'day',
        since,
        until,
      },
    });

    return res.data.data;
  }

  // ── Helpers ───────────────────────────────────────────────
  private parseInsights(data: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of data || []) {
      result[item.name] = typeof item.values?.[0]?.value === 'object'
        ? Object.values(item.values[0].value as Record<string, number>).reduce((a, b) => a + b, 0)
        : item.values?.[0]?.value || item.value || 0;
    }
    return result;
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
