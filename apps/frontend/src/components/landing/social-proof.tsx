import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Content Creator · 280K followers',
    avatar: 'S',
    color: '#7c3aed',
    text: 'Finally a tool that shows real data. I can see exactly which posts drive growth and the AI captions save me 2 hours every week.',
    stars: 5,
  },
  {
    name: 'Marcus Rivera',
    role: 'Social Media Manager · Agency',
    avatar: 'M',
    color: '#2563eb',
    text: 'Managing 12 brands from one dashboard is a game changer. The PDF reports with AI insights are something my clients love.',
    stars: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'E-commerce Brand · 95K followers',
    avatar: 'P',
    color: '#db2777',
    text: 'The analytics pipeline is incredible. Data updates every 15 minutes and the best posting time feature actually works.',
    stars: 5,
  },
  {
    name: 'James Okafor',
    role: 'YouTuber · 450K subscribers',
    avatar: 'J',
    color: '#dc2626',
    text: 'YouTube analytics + Instagram in one place. The cross-platform comparison charts helped me understand where to focus.',
    stars: 5,
  },
  {
    name: 'Lena Müller',
    role: 'Digital Agency Owner',
    avatar: 'L',
    color: '#059669',
    text: 'Switched from Metricool. The UI is cleaner, the data is more accurate, and the AI features are genuinely useful.',
    stars: 5,
  },
  {
    name: 'Alex Thompson',
    role: 'Brand Strategist',
    avatar: 'A',
    color: '#d97706',
    text: 'The media processing feature alone is worth it. Trim videos, merge audio, and publish — all without leaving the dashboard.',
    stars: 5,
  },
];

const LOGOS = ['Instagram', 'Facebook', 'YouTube', 'Meta', 'Google'];

export function SocialProofSection() {
  return (
    <section className="py-20 bg-[#080812] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 p-8 bg-white/[0.02] border border-white/5 rounded-2xl">
          {[
            { value: '2,400+', label: 'Active users' },
            { value: '18M+', label: 'Posts scheduled' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '< 1s', label: 'Dashboard load' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-sm text-white/40 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white">
            Loved by creators
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent"> worldwide</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.15] transition-colors">
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              <p className="text-sm text-white/70 leading-relaxed mb-4">"{t.text}"</p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: t.color + '33', border: `1px solid ${t.color}55` }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* API logos */}
        <div className="mt-16 text-center">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-6">Powered by official APIs</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { name: 'Meta Graph API', color: '#1877f2' },
              { name: 'Instagram API', color: '#e1306c' },
              { name: 'YouTube Data API', color: '#ff0000' },
              { name: 'Google OAuth', color: '#4285f4' },
              { name: 'Stripe', color: '#635bff' },
            ].map((api) => (
              <div key={api.name} className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity">
                <div className="w-2 h-2 rounded-full" style={{ background: api.color }} />
                <span className="text-sm text-white font-medium">{api.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
