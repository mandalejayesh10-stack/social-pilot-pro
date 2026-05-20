import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-user.decorator';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
export class WebhookController {
  constructor(private webhookService: WebhookService, private prisma: PrismaService) {}

  @Get()
  async list(@CurrentOrg() org: any) {
    return this.prisma.webhook.findMany({ where: { organizationId: org.id, deletedAt: null } });
  }

  @Post()
  async create(
    @CurrentOrg() org: any,
    @Body() body: { name: string; url: string; events?: string[]; secret?: string },
  ) {
    return this.prisma.webhook.create({
      data: {
        organizationId: org.id,
        name: body.name,
        url: body.url,
        events: JSON.stringify(body.events || []),
        secret: body.secret,
      },
    });
  }

  @Delete(':id')
  async delete(@CurrentOrg() org: any, @Param('id') id: string) {
    return this.prisma.webhook.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
