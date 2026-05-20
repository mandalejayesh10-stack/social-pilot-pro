'use client';

import { useState, useEffect } from 'react';
import { useOrgId } from '@/lib/hooks';
import { analyticsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import clsx from 'clsx';
import dayjs from 'dayjs';
import {
  Youtube, Plus, Trash2, RefreshCw, Download,
  Star, MoreVertical, TrendingUp, Eye, ThumbsUp,
  MessageSquare, Users, Search,
} from 'lucide-react';

function fmt(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function CompetitorsPage() {
  const orgId = useOrgId();
  const toast = useToast();
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [myChannels, setMyChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [addInput, setAddInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const stats = await analyticsApi.youtubeStats(orgId);
      setMyChannels(stats || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [orgId]);

  const handleSync = async () => {
    if (!orgId) return;
    setSyncing(true);
    try {
      await analyticsApi.forceSync(orgId);
      await loadData();
      toast.success('Synced!', 'Real data fetched from YouTube API');
    } catch (e: any) {
      toast.error('Sync failed', e.message);
    } finally { setSyncing(false); }
  };

  const addCompetitor = async () => {
    if (!addInput.trim()) return;
    setAdding(true);
    try {
      // Store competitor locally (in a real app, this would be saved to DB)
      const newComp = {
        id: Date.now().toString(),
        name: addInput.trim(),
        channelUrl: addInput.trim(),
        subscribers: 0,
        totalViews: 0,
        videoCount: 0,
        avgLikes: 0,
        avgComments: 0,
        starred: false,
        addedAt: new Date().toISOString(),
      };
      setCompetitors((prev) => [...prev, newComp]);
      setAddInput('');
      toast.success('Competitor added', 'Connect YouTube API to fetch their public stats');
    } catch (e: any) {
      toast.error('Failed to add', e.message);
    } finally { setAdding(false); }
  };

  const removeCompetitor = (id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    toast.success('Competitor removed');
  };

  const toggleStar = (id: string) => {
    setCompetitors((prev) => prev.map((c) => c.id === id ? { ...c, starred: !c.starred } : c));
  };

  const exportCSV = () => {
    const allData = [...myChannels.map((c) => ({ ...c, type: 'Mine' })), ...competitors.map((c) => ({ ...c, type: 'Competitor' }))];
    const headers = ['Name', 'Type', 'Subscribers', 'Total Views', 'Videos', 'Avg Likes', 'Avg Comments'];
    const rows = allData.map((c) => [
      `"${c.channelName || c.name}"`, c.type,
      c.subscribers || 0, c.totalViews || 0, c.videoCount || 0,
      c.avgLikes || 0, c.avgComments || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `competitors-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const allRows = [
    ...myChannels.map((c) => ({
      id: c.integrationId,
      name: c.channelName || 'My Channel',
      subscribers: c.subscribers || 0,
      totalViews: c.totalViews || 0,
      videoCount: c.videoCount || 0,
      avgLikes: c.totalLikes ? Math.round(c.totalLikes / Math.max(c.videoCount, 1)) : 0,
      avgComments: c.totalComments ? Math.round(c.totalComments / Math.max(c.videoCount, 1)) : 0,
      isOwn: true,
      starred: false,
    })),
    ...competitors,
  ].filter((r) => !search || r.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Competitors</h1>
          <p className="text-sm text-text-muted mt-0.5">Compare your YouTube channel against competitors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />} loading={syncing} onClick={handleSync}>
            Sync
          </Button>
          <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={exportCSV} disabled={allRows.length === 0}>
            Download CSV
          </Button>
        </div>
      </div>

      {/* Add competitor */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Add Competitor Channel</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Youtube size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
            <input
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCompetitor()}
              placeholder="Channel name or YouTube URL..."
              className="w-full bg-surface-input border border-surface-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <Button size="sm" icon={<Plus size={14} />} loading={adding} onClick={addCompetitor} disabled={!addInput.trim()}>
            Add
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          Note: Public competitor stats require YouTube Data API access. Your own channel stats are fetched automatically.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels..."
          className="w-full bg-surface-input border border-surface-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Competitors table */}
      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase">Name</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">
                <div className="flex items-center justify-end gap-1"><Users size={11} /> Subscribers</div>
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">
                <div className="flex items-center justify-end gap-1"><Eye size={11} /> Video Views</div>
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">Videos</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">
                <div className="flex items-center justify-end gap-1"><ThumbsUp size={11} /> Avg Likes</div>
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase">
                <div className="flex items-center justify-end gap-1"><MessageSquare size={11} /> Avg Comments</div>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/50">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4"><div className="skeleton h-4 w-32" /></td>
                  {[1,2,3,4,5].map((j) => <td key={j} className="px-4 py-4"><div className="skeleton h-4 w-16 ml-auto" /></td>)}
                  <td className="px-4 py-4" />
                </tr>
              ))
            ) : allRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <Youtube size={28} className="text-text-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-text-secondary">No channels yet</p>
                  <p className="text-xs text-text-muted mt-1">Connect YouTube and sync to see your channel stats, then add competitors above</p>
                  <Button className="mt-4" size="sm" onClick={handleSync} loading={syncing}>Sync My Channel</Button>
                </td>
              </tr>
            ) : (
              allRows.map((row) => (
                <tr key={row.id} className={clsx('hover:bg-surface-hover/30 transition-colors', row.isOwn && 'bg-brand-500/3')}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', row.isOwn ? 'bg-brand-500' : 'bg-red-600')}>
                        {row.isOwn ? '★' : row.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{row.name}</p>
                        {row.isOwn && <span className="text-[10px] bg-brand-500/15 text-brand-400 px-1.5 py-0.5 rounded-full">Your channel</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">{fmt(row.subscribers)}</td>
                  <td className="px-4 py-3 text-right text-sm text-text-secondary">{fmt(row.totalViews)}</td>
                  <td className="px-4 py-3 text-right text-sm text-text-secondary">{fmt(row.videoCount)}</td>
                  <td className="px-4 py-3 text-right text-sm text-text-secondary">{fmt(row.avgLikes)}</td>
                  <td className="px-4 py-3 text-right text-sm text-text-secondary">{fmt(row.avgComments)}</td>
                  <td className="px-4 py-3 text-right">
                    {!row.isOwn && (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => toggleStar(row.id)} className={clsx('w-7 h-7 rounded-lg flex items-center justify-center transition-colors', row.starred ? 'text-amber-400' : 'text-text-muted hover:text-amber-400')}>
                          <Star size={13} fill={row.starred ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={() => removeCompetitor(row.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-error transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Comparison chart */}
      {allRows.length >= 2 && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Subscriber Comparison</h3>
          <div className="space-y-3">
            {allRows.slice(0, 5).map((row) => {
              const maxSubs = Math.max(...allRows.map((r) => r.subscribers || 0), 1);
              const pct = Math.round(((row.subscribers || 0) / maxSubs) * 100);
              return (
                <div key={row.id} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-text-secondary truncate flex-shrink-0">{row.name}</div>
                  <div className="flex-1 h-6 bg-surface-hover rounded-lg overflow-hidden relative">
                    <div
                      className={clsx('h-full rounded-lg transition-all', row.isOwn ? 'bg-brand-500' : 'bg-red-500/70')}
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-text-secondary">
                      {fmt(row.subscribers || 0)}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
