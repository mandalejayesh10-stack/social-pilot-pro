'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Shield, Lock, Smartphone } from 'lucide-react';

export default function SecurityPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>();

  const newPassword = watch('newPassword');

  const onSubmit = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password updated successfully');
      reset();
    } catch (e: any) {
      toast.error('Failed to update password', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Change password */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Lock size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Change Password</h2>
            <p className="text-xs text-text-muted">Use a strong password with at least 8 characters</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            placeholder="••••••••"
            {...register('currentPassword', { required: 'Required' })}
            error={errors.currentPassword?.message}
          />
          <Input
            label="New password"
            type="password"
            placeholder="Min 8 characters"
            hint="Use letters, numbers, and symbols for a stronger password"
            {...register('newPassword', {
              required: 'Required',
              minLength: { value: 8, message: 'Minimum 8 characters' },
            })}
            error={errors.newPassword?.message}
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword', {
              required: 'Required',
              validate: (v) => v === newPassword || 'Passwords do not match',
            })}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" loading={loading} icon={<Shield size={14} />}>
            Update Password
          </Button>
        </form>
      </div>

      {/* 2FA — coming soon */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6 opacity-60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center text-text-muted">
            <Smartphone size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Two-Factor Authentication</h2>
            <p className="text-xs text-text-muted">Add an extra layer of security to your account</p>
          </div>
          <span className="ml-auto text-xs bg-surface-border text-text-muted px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        </div>
        <p className="text-sm text-text-muted">
          Two-factor authentication will be available in a future update.
        </p>
      </div>

      {/* Active sessions */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Shield size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Session Security</h2>
            <p className="text-xs text-text-muted">Your JWT session expires in 7 days</p>
          </div>
        </div>
        <div className="bg-surface-hover rounded-xl p-4 text-sm text-text-secondary">
          <p>Sessions are secured with JWT tokens stored in HTTP-only cookies.</p>
          <p className="mt-1 text-xs text-text-muted">Tokens are automatically refreshed on activity.</p>
        </div>
      </div>
    </div>
  );
}
