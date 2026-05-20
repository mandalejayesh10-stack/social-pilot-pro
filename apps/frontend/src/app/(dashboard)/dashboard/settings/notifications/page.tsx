'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Bell, Mail, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

interface NotifSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  email: boolean;
  inApp: boolean;
}

const DEFAULT_SETTINGS: NotifSetting[] = [
  {
    id: 'post_published',
    label: 'Post Published',
    description: 'When a scheduled post is successfully published',
    icon: <CheckCircle size={15} className="text-success" />,
    email: false,
    inApp: true,
  },
  {
    id: 'post_failed',
    label: 'Post Failed',
    description: 'When a post fails to publish after all retries',
    icon: <AlertCircle size={15} className="text-error" />,
    email: true,
    inApp: true,
  },
  {
    id: 'token_expiring',
    label: 'Token Expiring',
    description: 'When a social account token is about to expire',
    icon: <AlertCircle size={15} className="text-warning" />,
    email: true,
    inApp: true,
  },
  {
    id: 'report_ready',
    label: 'Report Ready',
    description: 'When a PDF report has been generated',
    icon: <CheckCircle size={15} className="text-success" />,
    email: false,
    inApp: true,
  },
  {
    id: 'analytics_weekly',
    label: 'Weekly Analytics Summary',
    description: 'Weekly digest of your top performing content',
    icon: <TrendingUp size={15} className="text-brand-400" />,
    email: true,
    inApp: false,
  },
  {
    id: 'payment_success',
    label: 'Payment Confirmed',
    description: 'When a subscription payment is processed',
    icon: <CheckCircle size={15} className="text-success" />,
    email: true,
    inApp: true,
  },
  {
    id: 'payment_failed',
    label: 'Payment Failed',
    description: 'When a subscription payment fails',
    icon: <AlertCircle size={15} className="text-error" />,
    email: true,
    inApp: true,
  },
];

export default function NotificationsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string, channel: 'email' | 'inApp') => {
    setSettings(prev =>
      prev.map(s => s.id === id ? { ...s, [channel]: !s[channel] } : s),
    );
  };

  const save = async () => {
    setSaving(true);
    // In production: POST /api/settings/notifications
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success('Notification preferences saved');
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-border">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Bell size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Notification Preferences</h2>
            <p className="text-xs text-text-muted">Choose how you want to be notified</p>
          </div>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1fr_80px_80px] gap-4 px-6 py-3 border-b border-surface-border">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Event</span>
          <div className="flex items-center justify-center gap-1 text-xs font-medium text-text-muted">
            <Mail size={12} /> Email
          </div>
          <div className="flex items-center justify-center gap-1 text-xs font-medium text-text-muted">
            <Bell size={12} /> In-App
          </div>
        </div>

        <div className="divide-y divide-surface-border/50">
          {settings.map((s) => (
            <div key={s.id} className="grid grid-cols-[1fr_80px_80px] gap-4 px-6 py-4 items-center hover:bg-surface-hover/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">{s.icon}</div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{s.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{s.description}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Toggle checked={s.email} onChange={() => toggle(s.id, 'email')} />
              </div>
              <div className="flex justify-center">
                <Toggle checked={s.inApp} onChange={() => toggle(s.id, 'inApp')} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={save} loading={saving}>Save Preferences</Button>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={clsx(
        'relative w-9 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        checked ? 'bg-brand-500' : 'bg-surface-border',
      )}
    >
      <div className={clsx(
        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
        checked ? 'translate-x-4' : 'translate-x-0.5',
      )} />
    </button>
  );
}
