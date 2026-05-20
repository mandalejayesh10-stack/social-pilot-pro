import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(organizationId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(organizationId: string, notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllRead(organizationId: string) {
    return this.prisma.notification.updateMany({
      where: { organizationId, read: false },
      data: { read: true },
    });
  }

  async create(data: {
    organizationId: string;
    userId?: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    return this.prisma.notification.create({ data });
  }
}
