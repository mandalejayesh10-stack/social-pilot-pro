import { Injectable, Logger } from '@nestjs/common';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email service using Resend (free tier: 3000 emails/month).
 * Falls back to console logging in development if RESEND_API_KEY is not set.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: any = null;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      // Lazy import to avoid hard dependency
      import('resend').then(({ Resend }) => {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.logger.log('Email service initialized (Resend)');
      }).catch(() => {
        this.logger.warn('Resend package not available');
      });
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged to console');
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.resend) {
      this.logger.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
      return true;
    }

    try {
      await this.resend.emails.send({
        from: `${process.env.EMAIL_FROM_NAME || 'SocialPilot Pro'} <${process.env.EMAIL_FROM_ADDRESS || 'noreply@socialpilotpro.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return true;
    } catch (err: any) {
      this.logger.error(`Email send failed: ${err.message}`);
      return false;
    }
  }

  // ── Pre-built email templates ─────────────────────────────

  async sendWelcome(to: string, name: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to SocialPilot Pro!',
      html: this.welcomeTemplate(name),
    });
  }

  async sendReport(to: string, reportTitle: string, pdfUrl: string): Promise<void> {
    await this.send({
      to,
      subject: `Your report is ready: ${reportTitle}`,
      html: this.reportTemplate(reportTitle, pdfUrl),
    });
  }

  async sendPaymentSuccess(to: string, amount: number, currency: string): Promise<void> {
    await this.send({
      to,
      subject: 'Payment confirmed — SocialPilot Pro',
      html: this.paymentTemplate(amount, currency),
    });
  }

  async sendPaymentFailed(to: string): Promise<void> {
    await this.send({
      to,
      subject: 'Action required: Payment failed',
      html: this.paymentFailedTemplate(),
    });
  }

  async sendPostFailed(to: string, postContent: string, platform: string, error: string): Promise<void> {
    await this.send({
      to,
      subject: `Post failed to publish on ${platform}`,
      html: this.postFailedTemplate(postContent, platform, error),
    });
  }

  // ── HTML Templates ────────────────────────────────────────

  private baseTemplate(content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f1a; color: #f0f0ff; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #16162a; border: 1px solid #2a2a45; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .body { padding: 32px; }
    .body p { color: #9898b8; line-height: 1.7; margin: 0 0 16px; }
    .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 14px; }
    .footer { padding: 20px 32px; border-top: 1px solid #2a2a45; text-align: center; }
    .footer p { color: #5a5a7a; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ SocialPilot Pro</h1>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SocialPilot Pro. All rights reserved.</p>
      <p style="margin-top:4px"><a href="${process.env.FRONTEND_URL}/legal/privacy" style="color:#6366f1">Privacy Policy</a> · <a href="${process.env.FRONTEND_URL}/legal/terms" style="color:#6366f1">Terms</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  private welcomeTemplate(name: string): string {
    return this.baseTemplate(`
      <p style="font-size:18px;font-weight:600;color:#f0f0ff">Welcome, ${name}! 🎉</p>
      <p>Your SocialPilot Pro account is ready. Connect your social media accounts to start scheduling posts and tracking analytics.</p>
      <p style="margin-top:24px"><a href="${process.env.FRONTEND_URL}/dashboard/settings/connections" class="btn">Connect Accounts →</a></p>
    `);
  }

  private reportTemplate(title: string, pdfUrl: string): string {
    return this.baseTemplate(`
      <p style="font-size:18px;font-weight:600;color:#f0f0ff">Your report is ready 📊</p>
      <p>Your analytics report "<strong style="color:#f0f0ff">${title}</strong>" has been generated and is ready to download.</p>
      <p style="margin-top:24px"><a href="${process.env.FRONTEND_URL}${pdfUrl}" class="btn">Download Report →</a></p>
    `);
  }

  private paymentTemplate(amount: number, currency: string): string {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
    return this.baseTemplate(`
      <p style="font-size:18px;font-weight:600;color:#f0f0ff">Payment confirmed ✅</p>
      <p>Your payment of <strong style="color:#f0f0ff">${formatted}</strong> has been processed successfully. Your subscription is now active.</p>
      <p style="margin-top:24px"><a href="${process.env.FRONTEND_URL}/dashboard/billing" class="btn">View Billing →</a></p>
    `);
  }

  private paymentFailedTemplate(): string {
    return this.baseTemplate(`
      <p style="font-size:18px;font-weight:600;color:#ef4444">Payment failed ⚠️</p>
      <p>We were unable to process your payment. Please update your payment method to continue using SocialPilot Pro.</p>
      <p>You have a 7-day grace period before your account is downgraded.</p>
      <p style="margin-top:24px"><a href="${process.env.FRONTEND_URL}/dashboard/billing" class="btn">Update Payment →</a></p>
    `);
  }

  private postFailedTemplate(content: string, platform: string, error: string): string {
    return this.baseTemplate(`
      <p style="font-size:18px;font-weight:600;color:#ef4444">Post failed to publish ⚠️</p>
      <p>A post scheduled for <strong style="color:#f0f0ff">${platform}</strong> failed to publish.</p>
      <div style="background:#1a1a30;border:1px solid #2a2a45;border-radius:8px;padding:12px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:#9898b8">${content.slice(0, 200)}${content.length > 200 ? '...' : ''}</p>
      </div>
      <p style="color:#ef4444;font-size:13px">Error: ${error}</p>
      <p style="margin-top:24px"><a href="${process.env.FRONTEND_URL}/dashboard/calendar" class="btn">View Calendar →</a></p>
    `);
  }
}
