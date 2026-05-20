import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="py-28 bg-[#06060f] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-violet-600/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-8">
          <Zap size={12} className="text-violet-400" />
          <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">Start today — it's free</span>
        </div>

        <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
          Your social media
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            operating system.
          </span>
        </h2>

        <p className="text-xl text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
          Connect your accounts, start scheduling, and watch your analytics grow — all from one premium dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register"
            className="group flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 text-base">
            Get started for free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login"
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl transition-all text-base">
            Sign in to dashboard
          </Link>
        </div>

        <p className="text-sm text-white/30 mt-6">
          No credit card required · Free plan forever · Cancel anytime
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-10">
          {[
            '✅ Real Meta Graph API',
            '✅ YouTube Data API',
            '✅ AI powered by Ollama',
            '✅ PDF reports',
            '✅ No fake data',
          ].map(f => (
            <span key={f} className="text-xs text-white/40 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
