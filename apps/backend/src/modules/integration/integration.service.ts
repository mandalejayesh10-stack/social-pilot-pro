import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MetaOAuthService } from './providers/meta-oauth.service';
import { YoutubeOAuthService } from './providers/youtube-oauth.service';
import { encrypt, decrypt, safeDecrypt } from '../../common/utils/crypto.util';
import { Platform } from '@prisma/client';
@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    private prisma: PrismaService,
    private metaOAuth: MetaOAuthService,
    private youtubeOAuth: YoutubeOAuthService,
  ) {}

  // ── Get all integrations for an org ──────────────────────
  async getIntegrations(organizationId: string) {
    const integrations = await this.prisma.integration.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    // Strip tokens from response
    return integrations.map((i) => this.sanitizeIntegration(i));
  }

  // ── Meta OAuth flow ───────────────────────────────────────
  getMetaAuthUrl(organizationId: string): string {
    const state = Buffer.from(JSON.stringify({ organizationId, platform: 'meta' })).toString('base64');
    return this.metaOAuth.getAuthUrl(state);
  }

  async handleMetaCallback(code: string, state: string) {
    const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());

    this.logger.log(`[Meta Callback] org=${organizationId} code=${code.slice(0,10)}...`);

    // Exchange code for user token
    const { accessToken, userId, name } = await this.metaOAuth.exchangeCode(code);
    this.logger.log(`[Meta Callback] Got user token for: ${name} (${userId})`);

    // Get pages
    const pages = await this.metaOAuth.getPages(accessToken);
    this.logger.log(`[Meta Callback] Found ${pages.length} Facebook pages`);

    const created: any[] = [];

    // Always save the personal Facebook account first
    const personalFb = await this.upsertIntegration({
      organizationId,
      platform: 'FACEBOOK',
      internalId: userId,
      name: name,
      accessToken: accessToken,
      profileData: JSON.stringify({ userId, type: 'personal' }),
    });
    created.push(personalFb);
    this.logger.log(`[Meta Callback] Saved personal Facebook account: ${name}`);

    for (const page of pages) {
      this.logger.log(`[Meta Callback] Processing page: ${page.name} (${page.id})`);

      // Save Facebook Page integration (overrides personal if same ID)
      const fbIntegration = await this.upsertIntegration({
        organizationId,
        platform: 'FACEBOOK',
        internalId: page.id,
        name: page.name,
        pictureUrl: page.pictureUrl,
        accessToken: page.accessToken,
        pageId: page.id,
        pageAccessToken: page.accessToken,
        profileData: JSON.stringify({ category: page.category }),
      });
      created.push(fbIntegration);

      // Check for linked Instagram account
      const igAccount = await this.metaOAuth.getInstagramAccount(page.id, page.accessToken);
      if (igAccount) {
        this.logger.log(`[Meta Callback] Found Instagram: ${igAccount.username}`);
        const igIntegration = await this.upsertIntegration({
          organizationId,
          platform: 'INSTAGRAM',
          internalId: igAccount.id,
          name: igAccount.name || igAccount.username,
          pictureUrl: igAccount.pictureUrl,
          accessToken: page.accessToken,
          pageId: page.id,
          pageAccessToken: page.accessToken,
          profileData: JSON.stringify({
            username: igAccount.username,
            followersCount: igAccount.followersCount,
          }),
        });
        created.push(igIntegration);
      }
    }

    // Update usage limits
    await this.updateAccountCount(organizationId);

    this.logger.log(`[Meta Callback] Saved ${created.length} integrations`);
    return created.map((i) => this.sanitizeIntegration(i));
  }

  // ── YouTube OAuth flow ────────────────────────────────────
  getYoutubeAuthUrl(organizationId: string): string {
    const state = Buffer.from(JSON.stringify({ organizationId, platform: 'youtube' })).toString('base64');
    return this.youtubeOAuth.getAuthUrl(state);
  }

  async handleYoutubeCallback(code: string, state: string) {
    const { organizationId } = JSON.parse(Buffer.from(state, 'base64').toString());

    const data = await this.youtubeOAuth.exchangeCode(code);

    const integration = await this.upsertIntegration({
      organizationId,
      platform: 'YOUTUBE',
      internalId: data.channelId,
      name: data.channelName,
      pictureUrl: data.pictureUrl,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiry: data.expiryDate,
      profileData: JSON.stringify({ subscriberCount: data.subscriberCount }),
    });

    await this.updateAccountCount(organizationId);

    return this.sanitizeIntegration(integration);
  }

  // ── Disconnect integration ────────────────────────────────
  async disconnect(organizationId: string, integrationId: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, organizationId, deletedAt: null },
    });
    if (!integration) throw new NotFoundException('Integration not found');

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { deletedAt: new Date() },
    });

    await this.updateAccountCount(organizationId);
    return { message: 'Integration disconnected' };
  }

  // ── Get decrypted token (internal use only) ───────────────
  async getDecryptedToken(integrationId: string): Promise<string | null> {
    const integration = await this.prisma.integration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) return null;
    return safeDecrypt(integration.accessToken);
  }

  // ── Private helpers ───────────────────────────────────────
  private async upsertIntegration(data: {
    organizationId: string;
    platform: string;
    internalId: string;
    name: string;
    pictureUrl?: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    pageId?: string;
    pageAccessToken?: string;
    profileData?: string;
  }) {
    const encryptedToken = encrypt(data.accessToken);
    const encryptedRefresh = data.refreshToken ? encrypt(data.refreshToken) : null;
    const encryptedPageToken = data.pageAccessToken ? encrypt(data.pageAccessToken) : null;

    return this.prisma.integration.upsert({
      where: {
        organizationId_platform_internalId: {
          organizationId: data.organizationId,
          platform: data.platform as Platform,
          internalId: data.internalId,
        },
      },
      create: {
        organizationId: data.organizationId,
        platform: data.platform as Platform,
        internalId: data.internalId,
        name: data.name,
        pictureUrl: data.pictureUrl,
        accessToken: encryptedToken,
        refreshToken: encryptedRefresh,
        tokenExpiry: data.tokenExpiry,
        pageId: data.pageId,
        pageAccessToken: encryptedPageToken,
        profileData: data.profileData,
        refreshNeeded: false,
        disabled: false,
      },
      update: {
        name: data.name,
        pictureUrl: data.pictureUrl,
        accessToken: encryptedToken,
        refreshToken: encryptedRefresh,
        tokenExpiry: data.tokenExpiry,
        pageAccessToken: encryptedPageToken,
        profileData: data.profileData,
        refreshNeeded: false,
        disabled: false,
        deletedAt: null,
        updatedAt: new Date(),
      },
    });
  }

  private async updateAccountCount(organizationId: string) {
    const count = await this.prisma.integration.count({
      where: { organizationId, deletedAt: null },
    });
    await this.prisma.usageLimits.upsert({
      where: { organizationId },
      create: { organizationId, accountsConnected: count },
      update: { accountsConnected: count },
    });
  }

  private sanitizeIntegration(integration: any) {
    const { accessToken, refreshToken, pageAccessToken, ...safe } = integration;
    return safe;
  }
}
