import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../modules/database/prisma.service';

/**
 * Validates that the authenticated user is a member of the organization
 * specified in the x-org-id header or :orgId route param.
 * Attaches the UserOrganization record to request.membership.
 */
@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const orgId =
      request.headers['x-org-id'] ||
      request.params?.orgId ||
      request.query?.['x-org-id'] ||
      request.query?.orgId;

    if (!orgId) {
      throw new ForbiddenException('Organization ID is required');
    }

    const membership = await this.prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      include: { organization: true },
    });

    if (!membership || membership.disabled) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    request.membership = membership;
    request.organization = membership.organization;
    return true;
  }
}
