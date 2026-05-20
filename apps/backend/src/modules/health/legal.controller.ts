import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';

// ── Short-URL controller (no /api prefix) ─────────────────────
// These are registered OUTSIDE the global /api prefix in main.ts
// so Meta can reach: https://tunnel.ngrok-free.dev/privacy
// and:               https://tunnel.ngrok-free.dev/terms

const STYLE = `
  body{font-family:system-ui,sans-serif;background:#0f0f1a;color:#e0e0f0;margin:0;padding:0}
  header{background:#16162a;border-bottom:1px solid #2a2a45;padding:16px 32px;display:flex;align-items:center;gap:12px}
  .logo{width:32px;height:32px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:14px}
  main{max-width:760px;margin:0 auto;padding:48px 32px}
  h1{font-size:28px;font-weight:700;color:#fff;margin-bottom:4px}
  .date{color:#666;font-size:14px;margin-bottom:40px}
  h2{font-size:16px;font-weight:600;color:#c0c0e0;margin:32px 0 8px}
  p,li{font-size:14px;line-height:1.8;color:#a0a0c0}
  ul{padding-left:20px}
  a{color:#818cf8}
  .back{display:inline-block;margin-top:32px;background:#6366f1;color:#fff;padding:10px 20px;border-radius:10px;text-decoration:none;font-size:14px}
`;

@ApiTags('Legal')
@Controller('legal')
export class LegalController {

  @Public()
  @Get('privacy')
  @ApiOperation({ summary: 'Privacy Policy' })
  privacy(@Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const backendUrl  = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Privacy Policy — SocialPilot Pro</title>
  <style>${STYLE}</style>
</head>
<body>
  <header>
    <div class="logo">S</div>
    <strong style="color:#fff;font-size:16px">SocialPilot Pro</strong>
  </header>
  <main>
    <h1>Privacy Policy</h1>
    <p class="date">Last updated: ${date}</p>

    <h2>1. Information We Collect</h2>
    <p>We collect information you provide when creating an account, connecting social media accounts, or contacting support:</p>
    <ul>
      <li><strong>Account information:</strong> Name, email address, password (hashed)</li>
      <li><strong>Social media data:</strong> OAuth access tokens, profile info, post metrics — fetched via official platform APIs with your explicit consent</li>
      <li><strong>Usage data:</strong> How you interact with our platform</li>
      <li><strong>Payment information:</strong> Processed securely by Stripe — we never store card details</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>Provide, maintain, and improve our services</li>
      <li>Schedule and publish posts on your behalf (only when you authorize)</li>
      <li>Display analytics and performance metrics in your dashboard</li>
      <li>Process payments and send billing receipts</li>
      <li>Send technical notices and support messages</li>
    </ul>

    <h2>3. Social Media Data & Platform APIs</h2>
    <p>We access your social media accounts only with your explicit permission via official OAuth 2.0 flows (Meta Graph API, YouTube Data API). We use this access solely to:</p>
    <ul>
      <li>Fetch analytics data (followers, engagement, reach)</li>
      <li>Schedule and publish posts on your behalf</li>
      <li>Display performance metrics in your dashboard</li>
    </ul>
    <p>We do not sell your social media data to third parties. All OAuth tokens are encrypted at rest using AES-256-GCM encryption.</p>

    <h2>4. Data Sharing</h2>
    <p>We do not sell, trade, or rent your personal information. We may share data with:</p>
    <ul>
      <li><strong>Stripe</strong> — for payment processing</li>
      <li><strong>Meta / Facebook</strong> — only data you explicitly authorize via OAuth</li>
      <li><strong>Google / YouTube</strong> — only data you explicitly authorize via OAuth</li>
    </ul>

    <h2>5. Data Retention & Deletion</h2>
    <p>We retain your data for as long as your account is active. You may request deletion of your account and all associated data at any time by emailing us. We will process deletion requests within 30 days.</p>

    <h2>6. Security</h2>
    <p>We implement industry-standard security measures: AES-256-GCM encryption for tokens, bcrypt for passwords, HTTPS for all data in transit, and JWT-based authentication with HTTP-only cookies.</p>

    <h2>7. Your Rights (GDPR / CCPA)</h2>
    <ul>
      <li>Right to access your personal data</li>
      <li>Right to correct inaccurate data</li>
      <li>Right to delete your data ("right to be forgotten")</li>
      <li>Right to data portability</li>
      <li>Right to withdraw consent at any time</li>
    </ul>

    <h2>8. Cookies</h2>
    <p>We use HTTP-only cookies solely for authentication (JWT session token). We do not use tracking or advertising cookies.</p>

    <h2>9. Contact Us</h2>
    <p>For privacy questions or data deletion requests, contact us at:<br>
    <a href="mailto:bamandlajayesh@gmail.com">bamandlajayesh@gmail.com</a></p>

    <a href="${frontendUrl}" class="back">← Back to SocialPilot Pro</a>
  </main>
</body>
</html>`);
  }

  @Public()
  @Get('terms')
  @ApiOperation({ summary: 'Terms of Service' })
  terms(@Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Terms of Service — SocialPilot Pro</title>
  <style>${STYLE}</style>
</head>
<body>
  <header>
    <div class="logo">S</div>
    <strong style="color:#fff;font-size:16px">SocialPilot Pro</strong>
  </header>
  <main>
    <h1>Terms of Service</h1>
    <p class="date">Last updated: ${date}</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By accessing or using SocialPilot Pro, you agree to be bound by these Terms of Service. If you do not agree, please do not use our service.</p>

    <h2>2. Description of Service</h2>
    <p>SocialPilot Pro is a social media management platform that allows users to schedule posts, analyze performance, and manage multiple social media accounts through official platform APIs (Meta Graph API, YouTube Data API v3).</p>

    <h2>3. Account Responsibilities</h2>
    <ul>
      <li>You are responsible for maintaining the security of your account credentials</li>
      <li>You must not share your account with others</li>
      <li>You are responsible for all activity that occurs under your account</li>
      <li>You must notify us immediately of any unauthorized use</li>
    </ul>

    <h2>4. Acceptable Use</h2>
    <p>You agree not to use SocialPilot Pro to:</p>
    <ul>
      <li>Violate any applicable laws or regulations</li>
      <li>Violate the terms of service of connected social media platforms</li>
      <li>Post spam, misleading content, or engage in inauthentic behavior</li>
      <li>Attempt to gain unauthorized access to our systems</li>
    </ul>

    <h2>5. Social Media Platform Compliance</h2>
    <p>You agree to comply with the terms of service of all social media platforms you connect, including Meta's Platform Terms and YouTube's Terms of Service.</p>

    <h2>6. Subscription and Billing</h2>
    <ul>
      <li>Subscriptions are billed in advance on a monthly or annual basis</li>
      <li>You may cancel at any time; cancellation takes effect at end of billing period</li>
      <li>Refunds are provided at our discretion within 7 days of purchase</li>
    </ul>

    <h2>7. Limitation of Liability</h2>
    <p>SocialPilot Pro is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>

    <h2>8. Contact</h2>
    <p>For questions: <a href="mailto:bamandlajayesh@gmail.com">bamandlajayesh@gmail.com</a></p>

    <a href="${frontendUrl}" class="back">← Back to SocialPilot Pro</a>
  </main>
</body>
</html>`);
  }
}
