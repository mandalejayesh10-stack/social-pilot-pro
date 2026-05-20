import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentUser, CurrentOrg } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, OrgMemberGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async getAll(@CurrentOrg() org: any, @CurrentUser() user: any) {
    return this.notificationService.getNotifications(org.id, user.id);
  }

  @Patch(':id/read')
  async markRead(@CurrentOrg() org: any, @Param('id') id: string) {
    return this.notificationService.markRead(org.id, id);
  }

  @Patch('read-all')
  async markAllRead(@CurrentOrg() org: any) {
    return this.notificationService.markAllRead(org.id);
  }
}
