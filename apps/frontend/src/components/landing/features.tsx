'use client';

import { BarChart3, Calendar, Bot, FileText, Users, Zap, TrendingUp, Hash, Image, Shield } from 'lucide-react';

const FEATURES = [
  {
    icon: BarChart3,
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/20',
    title: 'Real Analytics Pipeline',
    desc: 'No fake data. Every metric is fetched directly from Meta Graph API and YouTube Data API, processed through our background pipeline, and served instantly.',
    tags: ['Instagram', 'Facebook', 'YouTube'],
  },
  {
    icon: Calendar,
    color: 'from-blue-500 to-cyan-600',
    glow: 'shadow-blue-500/20',
    title: 'Smart Content Scheduler',
    desc: 'Visual calendar, bulk scheduling, multi-platform posting. Schedule once, publish everywhere. Automatic retry on failure.',
    tags: ['Bulk schedule', 'Calendar view', 'Auto-retry'],
  },
  {
    icon: Bot,
    color: 'from-pink-500 to-rose-600',
    glow: 'shadow-pink-500/20',
    title: 'AI Studio (Zero Cost)',
    desc: 'Powered by Ollama running locally. Generate captions, suggest hashtags, get analytics insights — all free, all private, no API costs.',
    tags: ['Captions', 'Hashtags', 'Insights'],
  },
  {
    icon: FileText,
    color: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/20',
    title: 'PDF Reports',
    desc: 'Generate beautiful PDF analytics reports with AI-written summaries. Schedule weekly reports to your inbox automatically.',
    tags: ['PDF export', 'Email delivery', 'AI summaries'],
  },
  {
    icon: Users,
    color: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
    title: 'Team Collaboration',
    desc: 'Multi-brand workspaces with role-based access. Invite editors and viewers, assign tasks, manage multiple clients from one account.',
    tags: ['Multi-brand', 'Roles', 'Tasks'],
  },
  {
    icon: Image,
    color: 'from-indigo-500 to-violet-600',
    glow: 'shadow-indigo-500/20',
    title: 'Media Processing',
    desc: 'Upload videos, trim clips, merge audio tracks, adjust volume — all powered by FFmpeg. Process before publishing.',
    tags: ['FFmpeg', 'Trim', 'Audio merge'],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 bg-[#080812] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-violet-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5">
            <Zap size={12} className="text-violet-400" />
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">Everything you need</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
            Built for serious
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent"> creators</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Every feature you need to grow your social presence, powered by real APIs and real data.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title}
                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.15] rounded-2xl p-6 transition-all duration-300 cursor-default">
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg ${f.glow} group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className="text-white" />
                </div>

                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-4">{f.desc}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {f.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-medium text-white/40 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.04] transition-opacity pointer-events-none`} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
