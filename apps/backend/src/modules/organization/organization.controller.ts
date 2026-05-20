import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentUser, CurrentOrg } from '../../common/decorators/current-user.decorator';
import { CreateOrganizationDto, UpdateOrganizationDto, InviteMemberDto } from './dto/organization.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private orgService: OrganizationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all organizations for current user' })
  async getMyOrgs(@CurrentUser() user: any) {
    return this.orgService.getUserOrganizations(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organization (brand/workspace)' })
  async create(@CurrentUser() user: any, @Body() body: CreateOrganizationDto) {
    return this.orgService.createOrganization(user.id, body);
  }

  @Patch(':orgId')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Update organization settings' })
  async update(
    @CurrentUser() user: any,
    @CurrentOrg() org: any,
    @Body() body: UpdateOrganizationDto,
  ) {
    return this.orgService.updateOrganization(org.id, user.id, body);
  }

  @Get(':orgId/members')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Get organization members' })
  async getMembers(@CurrentOrg() org: any) {
    return this.orgService.getMembers(org.id);
  }

  @Post(':orgId/members/invite')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Invite a team member' })
  async invite(
    @CurrentUser() user: any,
    @CurrentOrg() org: any,
    @Body() body: InviteMemberDto,
  ) {
    return this.orgService.inviteMember(org.id, user.id, body.email, body.role);
  }

  @Delete(':orgId/members/:memberId')
  @UseGuards(OrgMemberGuard)
  @ApiOperation({ summary: 'Remove a team member' })
  async remove(
    @CurrentUser() user: any,
    @CurrentOrg() org: any,
    @Param('memberId') memberId: string,
  ) {
    return this.orgService.removeMember(org.id, user.id, memberId);
  }
}
