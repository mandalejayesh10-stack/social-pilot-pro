import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async getUserOrganizations(userId: string) {
    const memberships = await this.prisma.userOrganization.findMany({
      where: { userId, disabled: false },
      include: {
        organization: {
          include: {
            subscription: true,
            usageLimits: true,
            _count: { select: { integrations: { where: { deletedAt: null } } } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }

  async createOrganization(userId: string, data: { name: string; timezone?: string; logoUrl?: string; brandColor?: string }) {
    const org = await this.prisma.organization.create({
      data: {
        name: data.name,
        timezone: data.timezone || 'UTC',
        logoUrl: data.logoUrl,
        brandColor: data.brandColor || '#6366f1',
        users: {
          create: { userId, role: 'ADMIN' },
        },
        usageLimits: {
          create: {
            postsLimit: 10,
            accountsLimit: 3,
            reportsLimit: 0,
            aiCreditsLimit: 10,
            teamMembersLimit: 1,
          },
        },
      },
    });
    return org;
  }

  async updateOrganization(
    organizationId: string,
    userId: string,
    data: { name?: string; description?: string; logoUrl?: string; timezone?: string; brandColor?: string; website?: string },
  ) {
    await this.requireRole(organizationId, userId, ['ADMIN', 'SUPERADMIN']);
    return this.prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  }

  async getMembers(organizationId: string) {
    return this.prisma.userOrganization.findMany({
      where: { organizationId, disabled: false },
      include: { user: { select: { id: true, name: true, email: true, pictureUrl: true } } },
    });
  }

  async inviteMember(organizationId: string, inviterId: string, email: string, role: Role) {
    await this.requireRole(organizationId, inviterId, ['ADMIN', 'SUPERADMIN']);

    // Find user by email
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) throw new NotFoundException('User with this email not found');

    const existing = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId } },
    });

    if (existing) {
      if (existing.disabled) {
        return this.prisma.userOrganization.update({
          where: { id: existing.id },
          data: { disabled: false, role },
        });
      }
      throw new ForbiddenException('User is already a member');
    }

    return this.prisma.userOrganization.create({
      data: { userId: user.id, organizationId, role },
    });
  }

  async removeMember(organizationId: string, removerId: string, memberId: string) {
    await this.requireRole(organizationId, removerId, ['ADMIN', 'SUPERADMIN']);
    return this.prisma.userOrganization.update({
      where: { userId_organizationId: { userId: memberId, organizationId } },
      data: { disabled: true },
    });
  }

  private async requireRole(organizationId: string, userId: string, roles: string[]) {
    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership || !roles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
