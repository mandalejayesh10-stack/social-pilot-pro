'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, TrendingUp, Users, Heart, Eye } from 'lucide-react';

const STATS = [
  { label: 'Followers', value: '124.8K', change: '+12.4%', icon: Users, color: 'text-violet-400' },
  { label: 'Engagement', value: '8.6%', change: '+2.1%', icon: Heart, color: 'text-pink-400' },
  { label: 'Reach', value: '2.4M', change: '+34%', icon: Eye, color: 'text-blue-400' },
  { label: 'Growth', value: '+18%', change: 'this month', icon: TrendingUp, color: 'text-emerald-400' },
];

const PLATFORMS = [
  { name: 'Instagram', color: '#e1306c', followers: '48.2K', growth: '+8.3%' },
  { name: 'Facebook', color: '#1877f2', followers: '31.5K', growth: '+4.1%' },
  { name: 'YouTube', color: '#ff0000', followers: '45.1K', growth: '+22.6%' },
];

export function HeroSection() {
  const [activeBar, setActiveBar] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveBar(p => (p + 1) % 7), 800);
    return () => clearInterval(t);
  }, []);

  const bars = [65, 80, 55, 90, 70, 85, 95];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#080812]">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-purple-800/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Copy */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-semibold text-violet-300 tracking-wide uppercase">
                Next-gen social media OS
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight">
                Grow every
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  platform
                </span>
                <br />
                with real data.
              </h1>
              <p className="text-lg text-white/50 leading-relaxed max-w-md">
                Schedule posts, track analytics, generate AI content, and manage your entire social presence — all from one premium dashboard.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link href="/register"
                className="group flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5">
                Start for free
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-6 py-3 rounded-xl transition-all">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <Play size={10} className="text-white ml-0.5" fill="white" />
                </div>
                Watch demo
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['V', 'A', 'M', 'R', 'K'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#080812] flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `hsl(${i * 60 + 240}, 70%, 50%)` }}>
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-white/40 mt-0.5">Trusted by 2,400+ creators</p>
              </div>
            </div>
          </div>

          {/* Right — Dashboard preview */}
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-violet-500/10 rounded-3xl blur-3xl scale-110" />

            {/* Main card */}
            <div className="relative bg-[#0f0f1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-xs text-white/30 font-mono">dashboard.socialpilotpro.com</span>
                <div className="w-16" />
              </div>

              <div className="p-5 space-y-4">
                {/* Metric cards row */}
                <div className="grid grid-cols-4 gap-3">
                  {STATS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                        <Icon size={14} className={s.color} />
                        <p className="text-base font-bold text-white mt-1.5">{s.value}</p>
                        <p className="text-[10px] text-emerald-400 font-medium">{s.change}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Chart */}
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-white/70">Follower Growth</span>
                    <span className="text-xs text-emerald-400 font-medium">+18.4% this month</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-16">
                    {bars.map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${h}%`,
                          background: i === activeBar
                            ? 'linear-gradient(to top, #7c3aed, #a855f7)'
                            : 'rgba(124,58,237,0.25)',
                        }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                      <span key={d} className="text-[9px] text-white/20">{d}</span>
                    ))}
                  </div>
                </div>

                {/* Platform rows */}
                <div className="space-y-2">
                  {PLATFORMS.map((p) => (
                    <div key={p.name} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: p.color + '33', border: `1px solid ${p.color}44` }}>
                        {p.name[0]}
                      </div>
                      <span className="text-xs font-medium text-white/70 flex-1">{p.name}</span>
                      <span className="text-xs font-bold text-white">{p.followers}</span>
                      <span className="text-[10px] text-emerald-400 font-medium">{p.growth}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl px-4 py-2.5 shadow-xl shadow-violet-500/30 border border-violet-400/20">
              <p className="text-[10px] text-violet-200 font-medium">AI Generated</p>
              <p className="text-sm font-bold text-white">Caption ready ✨</p>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[#0f0f1e] border border-white/10 rounded-2xl px-4 py-2.5 shadow-xl">
              <p className="text-[10px] text-white/40">Scheduled</p>
              <p className="text-sm font-bold text-white">3 posts today 📅</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
