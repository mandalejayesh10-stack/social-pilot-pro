import Link from 'next/link';
import { Zap } from 'lucide-react';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
        <p className="text-text-muted mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-invert max-w-none space-y-8 text-text-secondary">
          <Section title="1. Information We Collect">
            <p>We collect information you provide directly to us, such as when you create an account, connect social media accounts, or contact us for support.</p>
            <ul>
              <li><strong>Account information:</strong> Name, email address, password</li>
              <li><strong>Social media data:</strong> Access tokens, profile information, post metrics (fetched via official APIs)</li>
              <li><strong>Usage data:</strong> How you interact with our platform</li>
              <li><strong>Payment information:</strong> Processed securely by Stripe — we never store card details</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve the platform</li>
            </ul>
          </Section>

          <Section title="3. Social Media Data">
            <p>We access your social media accounts only with your explicit permission via official OAuth flows. We use this access to:</p>
            <ul>
              <li>Fetch analytics data (followers, engagement, reach)</li>
              <li>Schedule and publish posts on your behalf</li>
              <li>Display performance metrics in your dashboard</li>
            </ul>
            <p>We do not sell your social media data to third parties. All tokens are encrypted at rest using AES-256-GCM.</p>
          </Section>

          <Section title="4. Data Retention">
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us at {process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'support@socialpilotpro.com'}.</p>
          </Section>

          <Section title="5. GDPR Rights (EU Users)">
            <p>If you are located in the European Union, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>
          </Section>

          <Section title="6. Security">
            <p>We implement industry-standard security measures including encryption at rest and in transit, regular security audits, and access controls. However, no method of transmission over the Internet is 100% secure.</p>
          </Section>

          <Section title="7. Contact Us">
            <p>If you have questions about this Privacy Policy, please contact us at: <a href="mailto:support@socialpilotpro.com" className="text-brand-400">support@socialpilotpro.com</a></p>
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
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
