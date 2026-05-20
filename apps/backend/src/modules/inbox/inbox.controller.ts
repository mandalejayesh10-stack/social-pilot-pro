import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InboxService } from './inbox.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';

@ApiTags('Inbox')
@ApiBearerAuth()
@Controller('inbox')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
export class InboxController {
  constructor(private inboxService: InboxService) {}

  // ── List conversations ────────────────────────────────────
  @Get('conversations')
  @ApiOperation({ summary: 'List inbox conversations' })
  async getConversations(
    @CurrentOrg() org: any,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inboxService.getConversations(org.id, {
      platform,
      status,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 30,
    });
  }

  // ── Get single conversation ───────────────────────────────
  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  async getConversation(@CurrentOrg() org: any, @Param('id') id: string) {
    return this.inboxService.getConversation(org.id, id);
  }

  // ── Get messages ──────────────────────────────────────────
  @Get('messages/:conversationId')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  async getMessages(@CurrentOrg() org: any, @Param('conversationId') conversationId: string) {
    return this.inboxService.getMessages(org.id, conversationId);
  }

  // ── Reply ─────────────────────────────────────────────────
  @Post('reply')
  @ApiOperation({ summary: 'Reply to a conversation' })
  async reply(
    @CurrentOrg() org: any,
    @Body() body: { conversationId: string; message: string },
  ) {
    return this.inboxService.reply(org.id, body.conversationId, body.message);
  }

  // ── Resolve ───────────────────────────────────────────────
  @Patch('resolve/:id')
  @ApiOperation({ summary: 'Resolve or reopen a conversation' })
  async resolve(
    @CurrentOrg() org: any,
    @Param('id') id: string,
    @Body() body: { resolved: boolean },
  ) {
    return this.inboxService.resolve(org.id, id, body.resolved);
  }

  // ── Mark spam ─────────────────────────────────────────────
  @Patch('spam/:id')
  @ApiOperation({ summary: 'Mark conversation as spam' })
  async markSpam(
    @CurrentOrg() org: any,
    @Param('id') id: string,
    @Body() body: { spam: boolean },
  ) {
    return this.inboxService.markSpam(org.id, id, body.spam);
  }

  // ── Unread count ──────────────────────────────────────────
  @Get('unread')
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnread(@CurrentOrg() org: any) {
    return this.inboxService.getUnreadCount(org.id);
  }

  // ── AI suggest reply ──────────────────────────────────────
  @Get('ai/suggest/:conversationId')
  @ApiOperation({ summary: 'Get AI reply suggestions' })
  async suggestReply(@CurrentOrg() org: any, @Param('conversationId') id: string) {
    return this.inboxService.suggestReply(org.id, id);
  }

  // ── Manual sync ───────────────────────────────────────────
  @Post('sync')
  @ApiOperation({ summary: 'Manually trigger inbox sync' })
  async sync(@CurrentOrg() org: any) {
    return this.inboxService.triggerSync(org.id);
  }
}
