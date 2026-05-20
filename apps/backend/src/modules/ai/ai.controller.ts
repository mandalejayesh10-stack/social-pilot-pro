import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { GenerateCaptionDto, SuggestHashtagsDto, ChatDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';
import { Platform } from '@prisma/client';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('caption')
  @ApiOperation({ summary: 'Generate a social media caption' })
  async generateCaption(@Body() dto: GenerateCaptionDto) {
    return this.aiService.generateCaption(dto);
  }

  @Post('hashtags')
  @ApiOperation({ summary: 'Suggest hashtags for content' })
  async suggestHashtags(@Body() dto: SuggestHashtagsDto) {
    const hashtags = await this.aiService.suggestHashtags(dto);
    return { hashtags };
  }

  @Post('insights/:platform')
  @ApiOperation({ summary: 'Generate AI insights for a platform' })
  async getInsights(
    @CurrentOrg() org: any,
    @Param('platform') platform: string,
    @Body() body: { period?: string },
  ) {
    const insights = await this.aiService.generateInsights(
      org.id,
      platform.toUpperCase() as Platform,
      body.period || '30d',
    );
    return { insights };
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI assistant' })
  async chat(@CurrentOrg() org: any, @Body() dto: ChatDto) {
    const response = await this.aiService.chat({
      organizationId: org.id,
      message: dto.message,
      platform: dto.platform?.toUpperCase() as Platform | undefined,
      conversationHistory: dto.conversationHistory,
    });
    return { response };
  }
}
