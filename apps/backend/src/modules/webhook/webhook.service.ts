import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(private prisma: PrismaService) {}

  async dispatch(organizationId: string, event: string, payload: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { organizationId, active: true, deletedAt: null },
    });

    for (const webhook of webhooks) {
      const events: string[] = JSON.parse(webhook.events || '[]');
      if (events.length > 0 && !events.includes(event) && !events.includes('*')) continue;

      try {
        const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
        const signature = webhook.secret
          ? crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')
          : undefined;

        await axios.post(webhook.url, body, {
          headers: {
            'Content-Type': 'application/json',
            ...(signature && { 'X-Webhook-Signature': signature }),
          },
          timeout: 10000,
        });
      } catch (err) {
        this.logger.warn(`Webhook ${webhook.id} failed: ${err.message}`);
      }
    }
  }
}
