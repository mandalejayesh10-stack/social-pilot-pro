'use client';

import { useState } from 'react';
import { TrendingUp, Eye, Heart, Users, BarChart2 } from 'lucide-react';

const CHART_DATA = [
  { day: 'Mon', ig: 42, fb: 28, yt: 35 },
  { day: 'Tue', ig: 58, fb: 35, yt: 48 },
  { day: 'Wed', ig: 45, fb: 42, yt: 52 },
  { day: 'Thu', ig: 72, fb: 38, yt: 61 },
  { day: 'Fri', ig: 65, fb: 55, yt: 70 },
  { day: 'Sat', ig: 88, fb: 62, yt: 78 },
  { day: 'Sun', ig: 95, fb: 70, yt: 85 },
];

const METRICS = [
  { label: 'Total Reach', value: '2.4M', change: '+34%', icon: Eye, color: 'text-blue-400' },
  { label: 'Engagement', value: '8.6%', change: '+2.1%', icon: Heart, color: 'text-pink-400' },
  { label: 'Followers', value: '124.8K', change: '+12.4%', icon: Users, color: 'text-violet-400' },
  { label: 'Growth Rate', value: '+18%', change: 'this month', icon: TrendingUp, color: 'text-emerald-400' },
];

export function AnalyticsSection() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const maxVal = 100;

  return (
    <section id="analytics" className="py-28 bg-[#06060f] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-violet-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Analytics dashboard mockup */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-violet-500/5 rounded-3xl blur-3xl" />
            <div className="relative bg-[#0d0d1e]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 size={16} className="text-violet-400" />
                  <span className="text-sm font-semibold text-white">Analytics Overview</span>
                </div>
                <div className="flex gap-1">
                  {['7d', '30d', '90d'].map((p, i) => (
                    <button key={p} className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${i === 1 ? 'bg-violet-500/20 text-violet-300' : 'text-white/30 hover:text-white/60'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Metric cards */}
                <div className="grid grid-cols-2 gap-3">
                  {METRICS.map((m) => {
                    const Icon = m.icon;
                    return (
                      <div key={m.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <Icon size={14} className={m.color} />
                          <span className="text-[10px] text-emerald-400 font-semibold">{m.change}</span>
                        </div>
                        <p className="text-xl font-black text-white">{m.value}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{m.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Multi-platform chart */}
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-white/70">Platform Comparison</span>
                    <div className="flex items-center gap-3">
                      {[
                        { label: 'Instagram', color: '#e1306c' },
                        { label: 'Facebook', color: '#1877f2' },
                        { label: 'YouTube', color: '#ff0000' },
                      ].map(p => (
                        <div key={p.label} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                          <span className="text-[9px] text-white/40">{p.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end gap-2 h-24">
                    {CHART_DATA.map((d, i) => (
                      <div key={d.day} className="flex-1 flex items-end gap-0.5"
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)}>
                        {[
                          { val: d.ig, color: '#e1306c' },
                          { val: d.fb, color: '#1877f2' },
                          { val: d.yt, color: '#ff0000' },
                        ].map((bar, j) => (
                          <div key={j} className="flex-1 rounded-t-sm transition-all duration-300"
                            style={{
                              height: `${(bar.val / maxVal) * 100}%`,
                              background: hoveredBar === i ? bar.color : bar.color + '55',
                            }} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {CHART_DATA.map(d => (
                      <span key={d.day} className="text-[9px] text-white/20 flex-1 text-center">{d.day}</span>
                    ))}
                  </div>
                </div>

                {/* Best posting time */}
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Best time to post: 7:00 PM</p>
                    <p className="text-[11px] text-white/40">Based on your last 90 days of data</p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-emerald-400">+42% reach</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Copy */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5">
              <BarChart2 size={12} className="text-blue-400" />
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Real analytics</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Data that actually
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                means something.
              </span>
            </h2>

            <p className="text-white/50 text-lg leading-relaxed">
              Every metric is fetched directly from official APIs — no estimates, no guesses. Our background pipeline runs every 15 minutes so your dashboard is always fresh.
            </p>

            <div className="space-y-3">
              {[
                { title: 'Background data pipeline', desc: 'Cron jobs fetch data every 15 min, 1 hour, and daily — never on page load.' },
                { title: 'Cross-platform comparison', desc: 'See Instagram, Facebook, and YouTube side-by-side in one unified view.' },
                { title: 'AI-powered insights', desc: 'Get actionable recommendations based on your actual historical performance.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
