import Link from 'next/link';
import { Zap } from 'lucide-react';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-surface-border px-6 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-text-primary">SocialPilot Pro</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Terms of Service</h1>
        <p className="text-text-muted mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-text-secondary text-sm leading-relaxed">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using SocialPilot Pro, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>SocialPilot Pro is a social media management platform that allows users to schedule posts, analyze performance, and manage multiple social media accounts through official platform APIs.</p>
          </Section>

          <Section title="3. Account Responsibilities">
            <ul>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must not share your account with others</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>You must notify us immediately of any unauthorized use</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to use SocialPilot Pro to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Violate the terms of service of connected social media platforms</li>
              <li>Post spam, misleading content, or engage in inauthentic behavior</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Reverse engineer or attempt to extract our source code</li>
            </ul>
          </Section>

          <Section title="5. Social Media Platform Compliance">
            <p>You agree to comply with the terms of service of all social media platforms you connect to SocialPilot Pro, including but not limited to Meta's Platform Terms and YouTube's Terms of Service.</p>
          </Section>

          <Section title="6. Subscription and Billing">
            <ul>
              <li>Subscriptions are billed in advance on a monthly or annual basis</li>
              <li>You may cancel your subscription at any time; cancellation takes effect at the end of the current billing period</li>
              <li>Refunds are provided at our discretion within 7 days of purchase</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>SocialPilot Pro is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </Section>

          <Section title="8. Termination">
            <p>We reserve the right to terminate or suspend your account for violations of these terms. You may terminate your account at any time by contacting us.</p>
          </Section>

          <Section title="9. Contact">
            <p>For questions about these Terms, contact us at: <a href="mailto:support@socialpilotpro.com" className="text-brand-400">support@socialpilotpro.com</a></p>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-text-primary mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
