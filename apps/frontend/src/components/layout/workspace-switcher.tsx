'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { orgApi, integrationApi, resolveMediaUrl } from '@/lib/api';
import { mutate } from 'swr';
import clsx from 'clsx';
import {
  ChevronDown, Check, Plus, X, Upload, Loader2,
  Instagram, Facebook, Youtube, Building2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

// ── Platform icon map ─────────────────────────────────────────
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  INSTAGRAM: <Instagram size={10} />,
  FACEBOOK:  <Facebook size={10} />,
  YOUTUBE:   <Youtube size={10} />,
};

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: 'bg-gradient-to-br from-purple-500 to-pink-500',
  FACEBOOK:  'bg-blue-600',
  YOUTUBE:   'bg-red-600',
};

// ── Brand avatar ──────────────────────────────────────────────
function BrandAvatar({
  org,
  size = 'md',
}: {
  org: { name: string; logoUrl?: string; brandColor?: string };
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' };
  const color = org.brandColor || '#6366f1';
  const resolvedLogo = resolveMediaUrl(org.logoUrl);

  if (resolvedLogo) {
    return (
      <img
        src={resolvedLogo}
        alt={org.name}
        className={clsx('rounded-lg object-cover flex-shrink-0', sizeClasses[size])}
      />
    );
  }

  return (
    <div
      className={clsx('rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0', sizeClasses[size])}
      style={{ backgroundColor: color }}
    >
      {org.name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Add Brand Modal ───────────────────────────────────────────
function AddBrandModal({ onClose, onCreated }: { onClose: () => void; onCreated: (org: any) => void }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [brandColor, setBrandColor] = useState('#6366f1');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo',
    'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland',
  ];

  const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#06b6d4',
  ];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Brand name is required'); return; }
    setLoading(true);
    try {
      let logoUrl: string | undefined;

      // Upload logo if provided
      if (logoFile) {
        const { mediaApi } = await import('@/lib/api');
        // We need an orgId to upload — create org first, then update with logo
      }

      const org = await orgApi.create({ name: name.trim(), timezone, brandColor });

      // If logo was selected, upload it now using the new org's id
      if (logoFile) {
        try {
          const { mediaApi, resolveMediaUrl } = await import('@/lib/api');
          const uploaded = await mediaApi.upload(org.id, logoFile);
          const resolvedUrl = resolveMediaUrl(uploaded.url);
          await orgApi.update(org.id, { logoUrl: resolvedUrl });
          org.logoUrl = resolvedUrl;
        } catch {
          // Logo upload failed — org still created, just without logo
        }
      }

      toast.success(`Brand "${org.name}" created`);
      onCreated(org);
    } catch (e: any) {
      toast.error('Failed to create brand', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-text-primary">Add Brand</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Logo upload */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center cursor-pointer border-2 border-dashed border-surface-border hover:border-brand-500/50 transition-colors overflow-hidden flex-shrink-0"
              style={{ backgroundColor: logoPreview ? 'transparent' : brandColor + '20' }}
              onClick={() => fileRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload size={16} className="text-text-muted" />
                  <span className="text-[10px] text-text-muted">Logo</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Brand Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Agency, Client Brand..."
                className="w-full bg-surface-input border border-surface-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Brand color */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">Brand Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBrandColor(c)}
                  className={clsx(
                    'w-7 h-7 rounded-lg transition-all',
                    brandColor === c && 'ring-2 ring-offset-2 ring-offset-surface-card ring-white scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer border border-surface-border bg-transparent"
                title="Custom color"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-surface-input border border-surface-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-500 transition-colors"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-surface-hover rounded-xl p-3 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: logoPreview ? 'transparent' : brandColor }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase() || 'B'
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{name || 'Brand Name'}</p>
              <p className="text-xs text-text-muted">{timezone}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-text-secondary border border-surface-border rounded-xl hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Brand
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main WorkspaceSwitcher ────────────────────────────────────
export function WorkspaceSwitcher() {
  const { currentOrg, organizations, setCurrentOrg, setOrganizations } = useAppStore();
  const [open, setOpen] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [orgIntegrations, setOrgIntegrations] = useState<Record<string, any[]>>({});
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load integrations for all orgs when dropdown opens (for platform icons)
  useEffect(() => {
    if (!open) return;
    organizations.forEach(async (org) => {
      if (orgIntegrations[org.id]) return; // already loaded
      try {
        const integrations = await integrationApi.list(org.id);
        setOrgIntegrations((prev) => ({ ...prev, [org.id]: integrations }));
      } catch {
        setOrgIntegrations((prev) => ({ ...prev, [org.id]: [] }));
      }
    });
  }, [open, organizations]);

  const handleSwitch = useCallback((org: any) => {
    setCurrentOrg(org);
    setOpen(false);
    // Invalidate all SWR caches so data reloads for new workspace
    mutate(() => true, undefined, { revalidate: true });
  }, [setCurrentOrg]);

  const handleBrandCreated = async (newOrg: any) => {
    // Refresh org list from server
    const { orgApi } = await import('@/lib/api');
    const orgs = await orgApi.list();
    setOrganizations(orgs);
    // Switch to new brand
    const created = orgs.find((o: any) => o.id === newOrg.id) || newOrg;
    setCurrentOrg({ ...created, role: 'ADMIN' });
    setShowAddBrand(false);
    setOpen(false);
    mutate(() => true, undefined, { revalidate: true });
  };

  const currentIntegrations = orgIntegrations[currentOrg?.id || ''] || [];
  // Deduplicate by platform for the trigger button icons
  const uniquePlatforms = [...new Set(currentIntegrations.map((i: any) => i.platform))].slice(0, 3);

  return (
    <>
      <div ref={ref} className="relative">
        {/* Trigger button */}
        <button
          onClick={() => setOpen(!open)}
          className={clsx(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all',
            open
              ? 'border-brand-500/50 bg-surface-hover'
              : 'border-surface-border hover:border-brand-500/30 hover:bg-surface-hover/50',
          )}
        >
          {/* Brand avatar */}
          {currentOrg ? (
            <BrandAvatar org={currentOrg} size="sm" />
          ) : (
            <div className="w-6 h-6 rounded-lg bg-surface-border flex items-center justify-center">
              <Building2 size={12} className="text-text-muted" />
            </div>
          )}

          {/* Name */}
          <span className="text-sm font-medium text-text-primary max-w-[120px] truncate hidden sm:block">
            {currentOrg?.name || 'Select workspace'}
          </span>

          {/* Platform icons */}
          {uniquePlatforms.length > 0 && (
            <div className="hidden md:flex items-center gap-0.5">
              {uniquePlatforms.map((platform) => (
                <div
                  key={platform}
                  className={clsx('w-4 h-4 rounded-full flex items-center justify-center text-white', PLATFORM_COLORS[platform])}
                >
                  {PLATFORM_ICONS[platform]}
                </div>
              ))}
            </div>
          )}

          <ChevronDown
            size={13}
            className={clsx('text-text-muted transition-transform flex-shrink-0', open && 'rotate-180')}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 top-full mt-2 w-72 bg-surface-card border border-surface-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-4 py-3 border-b border-surface-border">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Your Brands</p>
            </div>

            {/* Org list */}
            <div className="max-h-72 overflow-y-auto py-1">
              {organizations.map((org) => {
                const integrations = orgIntegrations[org.id] || [];
                const platforms = [...new Set(integrations.map((i: any) => i.platform))].slice(0, 4);
                const isActive = currentOrg?.id === org.id;

                return (
                  <button
                    key={org.id}
                    onClick={() => handleSwitch(org)}
                    className={clsx(
                      'flex items-center gap-3 w-full px-4 py-3 transition-all text-left',
                      isActive
                        ? 'bg-brand-500/8'
                        : 'hover:bg-surface-hover',
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <BrandAvatar org={org} size="md" />
                      {isActive && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-card" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={clsx('text-sm font-medium truncate', isActive ? 'text-text-primary' : 'text-text-secondary')}>
                          {org.name}
                        </p>
                        {isActive && (
                          <span className="text-[10px] bg-brand-500/15 text-brand-400 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      {/* Platform icons row */}
                      {platforms.length > 0 ? (
                        <div className="flex items-center gap-1 mt-1">
                          {platforms.map((platform) => (
                            <div
                              key={platform}
                              className={clsx('w-4 h-4 rounded-full flex items-center justify-center text-white', PLATFORM_COLORS[platform])}
                            >
                              {PLATFORM_ICONS[platform]}
                            </div>
                          ))}
                          <span className="text-[10px] text-text-muted ml-0.5">
                            {integrations.length} account{integrations.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-text-muted mt-0.5">No accounts connected</p>
                      )}
                    </div>

                    {isActive && <Check size={14} className="text-brand-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Add Brand button */}
            <div className="border-t border-surface-border p-2">
              <button
                onClick={() => { setOpen(false); setShowAddBrand(true); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-brand-400 hover:bg-brand-500/8 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg border-2 border-dashed border-brand-500/40 flex items-center justify-center">
                  <Plus size={13} className="text-brand-400" />
                </div>
                Add Brand
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Brand Modal */}
      {showAddBrand && (
        <AddBrandModal
          onClose={() => setShowAddBrand(false)}
          onCreated={handleBrandCreated}
        />
      )}
    </>
  );
}
