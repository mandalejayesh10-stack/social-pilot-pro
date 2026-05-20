import Link from 'next/link';
import { Zap, Twitter, Github, Linkedin } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-[#040408] border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Zap size={15} className="text-white" />
              </div>
              <span className="font-bold text-white">SocialPilot Pro</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              The next-generation social media operating system. Real data, real growth.
            </p>
            <div className="flex gap-3 mt-5">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: 'Product',
              links: [
                { label: 'Features', href: '#features' },
                { label: 'Analytics', href: '#analytics' },
                { label: 'AI Studio', href: '#ai' },
                { label: 'Pricing', href: '#pricing' },
              ],
            },
            {
              title: 'Platform',
              links: [
                { label: 'Instagram', href: '/dashboard/instagram' },
                { label: 'Facebook', href: '/dashboard/facebook' },
                { label: 'YouTube', href: '/dashboard/youtube' },
                { label: 'Reports', href: '/dashboard/reports' },
              ],
            },
            {
              title: 'Legal',
              links: [
                { label: 'Privacy Policy', href: '/legal/privacy' },
                { label: 'Terms of Service', href: '/legal/terms' },
                { label: 'Cookie Policy', href: '/legal/privacy' },
                { label: 'GDPR', href: '/legal/privacy' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/40 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} SocialPilot Pro. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/20">Powered by</span>
            {['Meta Graph API', 'YouTube Data API', 'Stripe', 'Ollama'].map(t => (
              <span key={t} className="text-xs text-white/30">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
