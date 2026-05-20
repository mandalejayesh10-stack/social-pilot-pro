import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaClient } from '@prisma/client';
import { PRISMA } from '../database/database.module';
import axios from 'axios';
import { google } from 'googleapis';
import * as crypto from 'crypto';

function decrypt(ct: string): string {
  const key = Buffer.from((process.env.TOKEN_ENCRYPTION_KEY || '').padEnd(64, '0').slice(0, 64), 'hex');
  const buf = Buffer.from(ct, 'base64');
  const iv = buf.subarray(0, 16), tag = buf.subarray(16, 32), enc = buf.subarray(32);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return d.update(enc) + d.final('utf8');
}

function encrypt(pt: string): string {
  const key = Buffer.from((process.env.TOKEN_ENCRYPTION_KEY || '').padEnd(64, '0').slice(0, 64), 'hex');
  const iv = crypto.randomBytes(16);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(pt, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
}

const V = process.env.META_API_VERSION || 'v21.0';

@Injectable()
export class TokenRefreshService {
  private readonly logger = new Logger('TokenRefresh');

  constructor(@Inject(PRISMA) private prisma: PrismaClient) {}

  @Cron('0 */6 * * *')
  async refreshExpiringTokens() {
    const sevenDays = new Date(Date.now() + 7 * 86400000);
    const expiring = await this.prisma.integration.findMany({
      where: {
        deletedAt: null, disabled: false,
        OR: [{ tokenExpiry: { lte: sevenDays } }, { refreshNeeded: true }],
      },
    });

    this.logger.log(`Token refresh: ${expiring.length} integrations`);

    for (const ig of expiring) {
      try {
        if (ig.platform === 'YOUTUBE' && ig.refreshToken) {
          await this.refreshYoutube(ig);
        } else if (ig.platform === 'INSTAGRAM' || ig.platform === 'FACEBOOK') {
          await this.refreshMeta(ig);
        }
      } catch (e: any) {
        this.logger.error(`Refresh [${ig.id}]: ${e.message}`);
        await this.prisma.integration.update({ where: { id: ig.id }, data: { refreshNeeded: true } });
      }
    }
  }

  private async refreshYoutube(ig: any) {
    const auth = new google.auth.OAuth2(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: decrypt(ig.refreshToken) });
    const { credentials } = await auth.refreshAccessToken();
    await this.prisma.integration.update({
      where: { id: ig.id },
      data: { accessToken: encrypt(credentials.access_token!), tokenExpiry: new Date(credentials.expiry_date!), refreshNeeded: false },
    });
    this.logger.log(`Refreshed YouTube [${ig.id}]`);
  }

  private async refreshMeta(ig: any) {
    const token = decrypt(ig.accessToken);
    const res = await axios.get(`https://graph.facebook.com/${V}/oauth/access_token`, {
      params: { grant_type: 'fb_exchange_token', client_id: process.env.FACEBOOK_APP_ID, client_secret: process.env.FACEBOOK_APP_SECRET, fb_exchange_token: token },
    });
    const expiry = new Date(Date.now() + (res.data.expires_in || 5184000) * 1000);
    await this.prisma.integration.update({
      where: { id: ig.id },
      data: { accessToken: encrypt(res.data.access_token), tokenExpiry: expiry, refreshNeeded: false },
    });
    this.logger.log(`Refreshed Meta [${ig.id}]`);
  }
}
