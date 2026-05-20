'use client';

import { useState } from 'react';
import { useOrgId } from '@/lib/hooks';
import { settingsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Key, Copy, RefreshCw, Eye, EyeOff, Code } from 'lucide-react';

export default function ApiKeysPage() {
  const orgId = useOrgId();
  const toast = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadKey = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getApiKey(orgId);
      setApiKey(res.apiKey);
      setShowKey(true);
    } catch (e: any) {
      toast.error('Failed to load API key', e.message);
    } finally {
      setLoading(false);
    }
  };

  const regenerate = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.regenerateApiKey(orgId);
      setApiKey(res.apiKey);
      setShowKey(true);
      setShowConfirm(false);
      toast.success('API key regenerated', 'Your old key is now invalid');
    } catch (e: any) {
      toast.error('Failed to regenerate', e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    toast.success('Copied to clipboard');
  };

  const maskedKey = apiKey
    ? `${apiKey.slice(0, 8)}${'•'.repeat(24)}${apiKey.slice(-4)}`
    : null;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* API Key */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Key size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">API Key</h2>
            <p className="text-xs text-text-muted">Use this key to authenticate API requests</p>
          </div>
        </div>

        {!apiKey ? (
          <Button onClick={loadKey} loading={loading} variant="secondary" icon={<Eye size={14} />}>
            Reveal API Key
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-surface-hover border border-surface-border rounded-xl px-4 py-2.5 text-sm font-mono text-brand-400 truncate">
                {showKey ? apiKey : maskedKey}
              </code>
              <button
                onClick={() => setShowKey(!showKey)}
                className="w-9 h-9 rounded-xl bg-surface-hover border border-surface-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={copy}
                className="w-9 h-9 rounded-xl bg-surface-hover border border-surface-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={() => setShowConfirm(true)}
              loading={loading}
            >
              Regenerate Key
            </Button>
          </div>
        )}
      </div>

      {/* Usage examples */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code size={16} className="text-brand-400" />
          <h3 className="text-sm font-semibold text-text-primary">Usage Examples</h3>
        </div>

        <div className="space-y-4">
          {[
            {
              label: 'HTTP Header',
              code: `Authorization: Bearer YOUR_API_KEY`,
            },
            {
              label: 'cURL',
              code: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "x-org-id: YOUR_ORG_ID" \\
  ${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/analytics/overview`,
            },
            {
              label: 'JavaScript (fetch)',
              code: `const res = await fetch('/api/analytics/overview', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'x-org-id': 'YOUR_ORG_ID',
  }
});`,
            },
          ].map((ex) => (
            <div key={ex.label}>
              <p className="text-xs font-medium text-text-muted mb-1.5">{ex.label}</p>
              <pre className="bg-surface-hover border border-surface-border rounded-xl px-4 py-3 text-xs text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap">
                {ex.code}
              </pre>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-brand-500/5 border border-brand-500/20 rounded-xl p-3">
          <p className="text-xs text-text-secondary">
            <span className="text-brand-400 font-medium">API Docs:</span>{' '}
            <a
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:underline"
            >
              {process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/docs
            </a>
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Regenerate API Key?"
        message="Your current API key will be permanently invalidated. Any integrations using it will stop working immediately."
        confirmLabel="Regenerate"
        loading={loading}
        onConfirm={regenerate}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
