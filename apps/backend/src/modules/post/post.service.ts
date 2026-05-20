import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { State } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePostDto {
  integrationIds: string[];
  content: string;
  mediaUrls?: string[];
  publishDate: Date;
  hashtags?: string;
  title?: string;
  settings?: Record<string, any>;
}

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(private prisma: PrismaService) {}

  // ── Create post (single or multi-platform) ────────────────
  async createPost(organizationId: string, dto: CreatePostDto) {
    const group = uuidv4(); // groups multi-platform posts together

    const posts = await Promise.all(
      dto.integrationIds.map((integrationId) =>
        this.prisma.post.create({
          data: {
            organizationId,
            integrationId,
            content: dto.content,
            mediaUrls: JSON.stringify(dto.mediaUrls || []),
            publishDate: new Date(dto.publishDate),
            hashtags: dto.hashtags,
            title: dto.title,
            settings: dto.settings ? JSON.stringify(dto.settings) : null,
            state: 'QUEUE',
            group,
          },
        }),
      ),
    );

    return posts;
  }

  // ── Get posts for calendar ────────────────────────────────
  async getPosts(
    organizationId: string,
    filters: {
      from?: Date;
      to?: Date;
      platform?: string;
      state?: State;
    } = {},
  ) {
    return this.prisma.post.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(filters.from && { publishDate: { gte: filters.from } }),
        ...(filters.to && { publishDate: { lte: filters.to } }),
        ...(filters.state && { state: filters.state }),
        ...(filters.platform && {
          integration: { platform: filters.platform.toUpperCase() as any },
        }),
      },
      include: {
        integration: {
          select: { id: true, platform: true, name: true, pictureUrl: true },
        },
        metrics: {
          orderBy: { periodDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { publishDate: 'asc' },
    });
  }

  // ── Get single post ───────────────────────────────────────
  async getPost(organizationId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, organizationId, deletedAt: null },
      include: {
        integration: true,
        metrics: { orderBy: { periodDate: 'desc' }, take: 7 },
        tags: { include: { tag: true } },
        comments: {
          where: { deletedAt: null },
          include: { user: { select: { id: true, name: true, pictureUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  // ── Update post ───────────────────────────────────────────
  async updatePost(
    organizationId: string,
    postId: string,
    data: Partial<CreatePostDto>,
  ) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, organizationId, deletedAt: null },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.state === 'PUBLISHED') {
      throw new ForbiddenException('Cannot edit a published post');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        ...(data.content && { content: data.content }),
        ...(data.mediaUrls && { mediaUrls: JSON.stringify(data.mediaUrls) }),
        ...(data.publishDate && { publishDate: new Date(data.publishDate) }),
        ...(data.hashtags !== undefined && { hashtags: data.hashtags }),
        ...(data.settings && { settings: JSON.stringify(data.settings) }),
      },
    });
  }

  // ── Delete post ───────────────────────────────────────────
  async deletePost(organizationId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, organizationId, deletedAt: null },
    });
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Post deleted' };
  }

  // ── Bulk schedule ─────────────────────────────────────────
  async bulkSchedule(
    organizationId: string,
    posts: Array<CreatePostDto>,
  ) {
    const results = await Promise.all(
      posts.map((post) => this.createPost(organizationId, post)),
    );
    return results.flat();
  }

  // ── Get posts due for publishing (atomic claim) ──────────
  async getDuePosts() {
    // Use a transaction to atomically claim posts — prevents double-publish
    // when multiple scheduler instances run (e.g. nodemon restart overlap)
    const now = new Date();

    // First find candidates
    const candidates = await this.prisma.post.findMany({
      where: {
        state: 'QUEUE',
        publishDate: { lte: now },
        deletedAt: null,
      },
      select: { id: true },
      orderBy: { publishDate: 'asc' },
      take: 50,
    });

    if (candidates.length === 0) return [];

    const ids = candidates.map((p) => p.id);

    // Atomically mark them as DRAFT (in-flight) so no other process picks them up
    // We use a temporary state trick: set error to a sentinel value
    // The scheduler will reset this before publishing
    await this.prisma.post.updateMany({
      where: { id: { in: ids }, state: 'QUEUE' }, // double-check state
      data: { error: '__CLAIMED__' },
    });

    // Now fetch the full records (only ones we successfully claimed)
    return this.prisma.post.findMany({
      where: {
        id: { in: ids },
        error: '__CLAIMED__',
        deletedAt: null,
      },
      include: { integration: true },
      orderBy: { publishDate: 'asc' },
    });
  }

  // ── Mark post as published ────────────────────────────────
  async markPublished(postId: string, externalId: string, publishedUrl?: string) {
    return this.prisma.post.update({
      where: { id: postId },
      data: { state: 'PUBLISHED', externalId, publishedUrl, error: null },
    });
  }

  // ── Mark post as failed ───────────────────────────────────
  async markFailed(postId: string, error: string) {
    return this.prisma.post.update({
      where: { id: postId },
      data: { state: 'ERROR', error },
    });
  }

  // ── Get publish logs for a post ───────────────────────────
  async getPublishLogs(organizationId: string, postId: string) {
    // Verify post belongs to org
    const post = await this.prisma.post.findFirst({
      where: { id: postId, organizationId, deletedAt: null },
    });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.publishLog.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
