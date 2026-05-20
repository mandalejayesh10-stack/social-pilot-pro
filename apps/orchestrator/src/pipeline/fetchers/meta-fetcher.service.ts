import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const V = process.env.META_API_VERSION || 'v21.0';
const BASE = `https://graph.facebook.com/${V}`;

@Injectable()
export class MetaFetcherService {
  private readonly logger = new Logger('MetaFetcher');

  async fetchBasicStats(platform: string, accountId: string, token: string) {
    const fields = platform === 'INSTAGRAM'
      ? 'followers_count,follows_count,media_count,name,username,profile_picture_url'
      : 'fan_count,name,picture,category';
    const res = await axios.get(`${BASE}/${accountId}`, { params: { access_token: token, fields } });
    return res.data;
  }

  async fetchPostInsights(mediaIds: string[], token: string) {
    const results: Record<string, any> = {};
    for (const id of mediaIds) {
      try {
        const res = await axios.get(`${BASE}/${id}/insights`, {
          params: { access_token: token, metric: 'impressions,reach,likes,comments,shares,saved,video_views' },
        });
        results[id] = this.parseInsights(res.data.data);
      } catch (e: any) {
        this.logger.warn(`Post insights [${id}]: ${e.message}`);
      }
    }
    return results;
  }

  async fetchPagePostInsights(postIds: string[], token: string) {
    const results: Record<string, any> = {};
    for (const id of postIds) {
      try {
        const res = await axios.get(`${BASE}/${id}/insights`, {
          params: { access_token: token, metric: 'post_impressions,post_reach,post_reactions_by_type_total,post_clicks' },
        });
        results[id] = this.parseInsights(res.data.data);
      } catch (e: any) {
        this.logger.warn(`Page post insights [${id}]: ${e.message}`);
      }
    }
    return results;
  }

  async fetchInstagramInsights(accountId: string, token: string) {
    const since = Math.floor(Date.now() / 1000) - 30 * 86400;
    const until = Math.floor(Date.now() / 1000);
    const res = await axios.get(`${BASE}/${accountId}/insights`, {
      params: { access_token: token, metric: 'impressions,reach,follower_count,profile_views', period: 'day', since, until },
    });
    return res.data.data;
  }

  async fetchPageInsights(pageId: string, token: string) {
    const since = Math.floor(Date.now() / 1000) - 30 * 86400;
    const until = Math.floor(Date.now() / 1000);
    const res = await axios.get(`${BASE}/${pageId}/insights`, {
      params: { access_token: token, metric: 'page_impressions,page_reach,page_fans,page_engaged_users', period: 'day', since, until },
    });
    return res.data.data;
  }

  private parseInsights(data: any[]): Record<string, number> {
    const r: Record<string, number> = {};
    for (const item of data || []) {
      const v = item.values?.[0]?.value;
      r[item.name] = typeof v === 'object' ? Object.values(v as any).reduce((a: any, b: any) => a + b, 0) as number : v || item.value || 0;
    }
    return r;
  }
}
