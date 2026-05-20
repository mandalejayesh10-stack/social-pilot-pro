'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Menu, X } from 'lucide-react';
import clsx from 'clsx';

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Analytics', href: '#analytics' },
    { label: 'AI Studio', href: '#ai' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-[#0a0a14]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl'
        : 'bg-transparent',
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">SocialPilot Pro</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              className="text-sm text-white/60 hover:text-white transition-colors font-medium">
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors font-medium px-4 py-2">
            Sign in
          </Link>
          <Link href="/register"
            className="text-sm font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-5 py-2 rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40">
            Start free →
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white/70 hover:text-white">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a14]/98 backdrop-blur-xl border-b border-white/5 px-6 py-4 space-y-3">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="block text-sm text-white/70 hover:text-white py-2 transition-colors">
              {l.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Link href="/login" className="text-sm text-center text-white/70 py-2">Sign in</Link>
            <Link href="/register" className="text-sm text-center font-semibold bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2.5 rounded-xl">
              Start free →
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
