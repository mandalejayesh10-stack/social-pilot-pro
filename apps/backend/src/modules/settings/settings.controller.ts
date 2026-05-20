import {
  Controller, Get, Patch, Post, Body, UseGuards, Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentUser, CurrentOrg } from '../../common/decorators/current-user.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // ── Profile ───────────────────────────────────────────────
  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() body: {
      name?: string;
      bio?: string;
      timezone?: string;
      language?: string;
      pictureUrl?: string;
    },
  ) {
    return this.settingsService.updateProfile(user.id, body);
  }

  // ── Organization ──────────────────────────────────────────
  @Patch('organization')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Update organization settings' })
  async updateOrganization(
    @CurrentUser() user: any,
    @CurrentOrg() org: any,
    @Body() body: {
      name?: string;
      description?: string;
      logoUrl?: string;
      timezone?: string;
      website?: string;
    },
  ) {
    return this.settingsService.updateOrganization(org.id, user.id, body);
  }

  // ── API Key ───────────────────────────────────────────────
  @Get('api-key')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Get API key' })
  async getApiKey(@CurrentOrg() org: any) {
    return this.settingsService.getApiKey(org.id);
  }

  @Post('api-key/regenerate')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Regenerate API key' })
  async regenerateApiKey(@CurrentOrg() org: any) {
    return this.settingsService.regenerateApiKey(org.id);
  }

  // ── Usage stats ───────────────────────────────────────────
  @Get('usage')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Get usage statistics' })
  async getUsage(@CurrentOrg() org: any) {
    return this.settingsService.getUsageStats(org.id);
  }
}
