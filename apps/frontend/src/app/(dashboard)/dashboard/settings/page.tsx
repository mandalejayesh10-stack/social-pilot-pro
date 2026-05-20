'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { settingsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useForm } from 'react-hook-form';
import { User, Globe, Building2 } from 'lucide-react';
import useSWR from 'swr';

export default function ProfileSettingsPage() {
  const { user, setUser, currentOrg } = useAppStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);

  // Usage stats
  const { data: usage } = useSWR(
    currentOrg ? ['settings/usage', currentOrg.id] : null,
    () => fetch('/api/settings/usage', {
      credentials: 'include',
      headers: { 'x-org-id': currentOrg!.id },
    }).then(r => r.json()),
  );

  const { register: regProfile, handleSubmit: handleProfile } = useForm({
    defaultValues: {
      name: user?.name || '',
      bio: '',
      timezone: 'UTC',
      language: 'en',
    },
  });

  const { register: regOrg, handleSubmit: handleOrg } = useForm({
    defaultValues: {
      name: currentOrg?.name || '',
      description: '',
      website: '',
      timezone: currentOrg?.timezone || 'UTC',
    },
  });

  const onProfileSubmit = async (data: any) => {
    setLoading(true);
    try {
      const updated = await settingsApi.updateProfile(data);
      setUser({ ...user!, ...updated });
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error('Failed to update profile', e.message);
    } finally {
      setLoading(false);
    }
  };

  const onOrgSubmit = async (data: any) => {
    setOrgLoading(true);
    try {
      await fetch('/api/settings/organization', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': currentOrg!.id,
        },
        body: JSON.stringify(data),
      });
      toast.success('Workspace settings updated');
    } catch (e: any) {
      toast.error('Failed to update workspace', e.message);
    } finally {
      setOrgLoading(false);
    }
  };

  const TIMEZONES = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern (ET)' },
    { value: 'America/Chicago', label: 'Central (CT)' },
    { value: 'America/Denver', label: 'Mountain (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Profile */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <User size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Profile Information</h2>
            <p className="text-xs text-text-muted">Update your personal details</p>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-surface-border">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400 text-2xl font-bold flex-shrink-0">
            {user?.pictureUrl ? (
              <img src={user.pictureUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
            <p className="text-xs text-text-muted">{user?.email}</p>
            <p className="text-xs text-text-muted mt-0.5 capitalize">
              {user?.providerName?.toLowerCase()} account
            </p>
          </div>
        </div>

        <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
          <Input label="Display name" {...regProfile('name')} />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Bio</label>
            <textarea
              {...regProfile('bio')}
              rows={3}
              placeholder="Tell us about yourself..."
              className="w-full bg-surface-input border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Timezone</label>
              <select
                {...regProfile('timezone')}
                className="w-full bg-surface-input border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-500 transition-colors"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Language</label>
              <select
                {...regProfile('language')}
                className="w-full bg-surface-input border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="hi">हिन्दी</option>
                <option value="pt">Português</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>

          <Button type="submit" loading={loading}>Save Profile</Button>
        </form>
      </div>

      {/* Workspace settings */}
      {currentOrg && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Workspace Settings</h2>
              <p className="text-xs text-text-muted">Configure your brand workspace</p>
            </div>
          </div>

          <form onSubmit={handleOrg(onOrgSubmit)} className="space-y-4">
            <Input label="Workspace name" {...regOrg('name')} />
            <Input label="Website" type="url" placeholder="https://yourwebsite.com" {...regOrg('website')} />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
              <textarea
                {...regOrg('description')}
                rows={2}
                placeholder="Brief description of your brand..."
                className="w-full bg-surface-input border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Timezone</label>
              <select
                {...regOrg('timezone')}
                className="w-full bg-surface-input border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-500 transition-colors"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <Button type="submit" loading={orgLoading}>Save Workspace</Button>
          </form>
        </div>
      )}

      {/* Usage summary */}
      {usage && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-brand-400" />
            <h3 className="text-sm font-semibold text-text-primary">This Month's Usage</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Posts Published', ...usage.posts },
              { label: 'Accounts Connected', ...usage.accounts },
              { label: 'AI Credits Used', ...usage.aiCredits },
              { label: 'Reports Generated', ...usage.reports },
            ].map((item) => (
              <div key={item.label} className="bg-surface-hover rounded-xl p-3">
                <p className="text-xs text-text-muted mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-text-primary">
                  {item.used} / {item.unlimited ? '∞' : item.limit}
                </p>
                {!item.unlimited && (
                  <div className="mt-1.5 h-1 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min((item.used / (item.limit || 1)) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
