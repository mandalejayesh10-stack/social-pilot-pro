'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useOrgId } from '@/lib/hooks';
import { inboxApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import clsx from 'clsx';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Search, Filter, RefreshCw, CheckCircle, Circle,
  Send, Sparkles, Instagram, Facebook, Youtube,
  MessageSquare, AlertTriangle, ChevronDown,
  MoreVertical, X, Loader2, Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

dayjs.extend(relativeTime);

// ── Platform config ───────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  YOUTUBE:   { icon: <Youtube size={14} />,   color: 'text-red-400',   bg: 'bg-red-500/15',   label: 'YouTube' },
  INSTAGRAM: { icon: <Instagram size={14} />, color: 'text-pink-400',  bg: 'bg-pink-500/15',  label: 'Instagram' },
  FACEBOOK:  { icon: <Facebook size={14} />,  color: 'text-blue-400',  bg: 'bg-blue-500/15',  label: 'Facebook' },
};

type Tab = 'all' | 'unread' | 'unresolved';
type PlatformFilter = 'all' | 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK';

export default function InboxPage() {
  const orgId = useOrgId();
  const toast = useToast();

  // ── State ─────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('unresolved');
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [loadingConv, setLoadingConv] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [unread, setUnread] = useState<any>({ total: 0, byPlatform: {} });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load conversations ────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (platform !== 'all') params.platform = platform;
      if (tab === 'unresolved') params.status = 'OPEN';
      if (search) params.search = search;

      const res = await inboxApi.getConversations(orgId, params);
      let convs = res.conversations || [];

      if (tab === 'unread') {
        convs = convs.filter((c: any) => c.unreadCount > 0);
      }

      setConversations(convs);
      setTotal(res.total || 0);
    } catch (e: any) {
      toast.error('Failed to load inbox', e.message);
    } finally {
      setLoading(false);
    }
  }, [orgId, tab, platform, search]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load unread count ─────────────────────────────────────
  useEffect(() => {
    if (!orgId) return;
    inboxApi.getUnread(orgId).then(setUnread).catch(() => {});
  }, [orgId, conversations]);

  // ── Load selected conversation ────────────────────────────
  useEffect(() => {
    if (!selectedId || !orgId) return;
    setLoadingConv(true);
    setSuggestions([]);
    inboxApi.getConversation(orgId, selectedId)
      .then(setConversation)
      .catch(() => toast.error('Failed to load conversation'))
      .finally(() => setLoadingConv(false));
  }, [selectedId, orgId]);

  // ── Scroll to bottom on new messages ─────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // ── Send reply ────────────────────────────────────────────
  const sendReply = async () => {
    if (!reply.trim() || !selectedId || !orgId) return;
    setSending(true);
    try {
      const msg = await inboxApi.reply(orgId, selectedId, reply.trim());
      setConversation((prev: any) => ({
        ...prev,
        messages: [...(prev?.messages || []), msg],
      }));
      setReply('');
      setSuggestions([]);
      loadConversations();
    } catch (e: any) {
      toast.error('Failed to send reply', e.message);
    } finally {
      setSending(false);
    }
  };

  // ── Resolve conversation ──────────────────────────────────
  const toggleResolve = async () => {
    if (!selectedId || !orgId || !conversation) return;
    const resolved = conversation.status !== 'RESOLVED';
    try {
      await inboxApi.resolve(orgId, selectedId, resolved);
      setConversation((prev: any) => ({ ...prev, status: resolved ? 'RESOLVED' : 'OPEN' }));
      loadConversations();
      toast.success(resolved ? 'Conversation resolved' : 'Conversation reopened');
    } catch (e: any) {
      toast.error('Failed to update', e.message);
    }
  };

  // ── AI suggestions ────────────────────────────────────────
  const getSuggestions = async () => {
    if (!selectedId || !orgId) return;
    setLoadingSuggestions(true);
    try {
      const res = await inboxApi.suggestReply(orgId, selectedId);
      setSuggestions(res.suggestions || []);
    } catch {
      toast.error('AI unavailable', 'Make sure Ollama is running');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // ── Manual sync ───────────────────────────────────────────
  const handleSync = async () => {
    if (!orgId) return;
    setSyncing(true);
    try {
      const res = await inboxApi.sync(orgId);
      toast.success(`Synced ${res.synced} accounts`, 'New comments loaded');
      loadConversations();
    } catch (e: any) {
      toast.error('Sync failed', e.message);
    } finally {
      setSyncing(false);
    }
  };

  const platformConf = conversation ? PLATFORM_CONFIG[conversation.platform] : null;

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 overflow-hidden">

      {/* ── LEFT SIDEBAR ──────────────────────────────────── */}
      <div className="w-[340px] flex-shrink-0 flex flex-col border-r border-surface-border bg-surface-card">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-surface-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-text-primary">Inbox</h1>
              {unread.total > 0 && (
                <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unread.total}
                </span>
              )}
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-7 h-7 rounded-lg hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              title="Sync now"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-surface-input border border-surface-border rounded-xl pl-8 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Platform filter */}
          <div className="flex gap-1 mb-3">
            {(['all', 'YOUTUBE', 'INSTAGRAM', 'FACEBOOK'] as const).map(p => {
              const conf = p !== 'all' ? PLATFORM_CONFIG[p] : null;
              return (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                    platform === p
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-hover',
                  )}
                >
                  {conf ? conf.icon : <MessageSquare size={12} />}
                  {p === 'all' ? 'All' : conf?.label}
                  {p !== 'all' && unread.byPlatform?.[p.toLowerCase()] > 0 && (
                    <span className="bg-brand-500 text-white text-[9px] px-1 rounded-full">
                      {unread.byPlatform[p.toLowerCase()]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-surface-hover rounded-xl p-1">
            {([
              { id: 'unresolved', label: 'Unresolved' },
              { id: 'unread',     label: 'Unread' },
              { id: 'all',        label: 'All' },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                  tab === t.id ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-surface-border/50">
                  <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Inbox size={28} className="text-text-muted mb-2" />
              <p className="text-sm font-medium text-text-secondary">No conversations</p>
              <p className="text-xs text-text-muted mt-1">
                {tab === 'unresolved' ? 'All caught up!' : 'Connect accounts to see comments'}
              </p>
              <button
                onClick={handleSync}
                className="mt-3 text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <RefreshCw size={11} /> Sync now
              </button>
            </div>
          ) : (
            conversations.map(conv => {
              const conf = PLATFORM_CONFIG[conv.platform];
              const isSelected = selectedId === conv.id;
              const isResolved = conv.status === 'RESOLVED';

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={clsx(
                    'w-full flex items-start gap-3 px-4 py-3 border-b border-surface-border/50 text-left transition-colors',
                    isSelected ? 'bg-brand-500/10 border-l-2 border-l-brand-500' : 'hover:bg-surface-hover',
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center text-sm font-bold text-text-secondary overflow-hidden">
                      {conv.userAvatar ? (
                        <img src={conv.userAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        conv.username?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className={clsx(
                      'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center',
                      conf?.bg,
                    )}>
                      <span className={conf?.color}>{conf?.icon}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={clsx(
                        'text-xs font-semibold truncate',
                        conv.unreadCount > 0 ? 'text-text-primary' : 'text-text-secondary',
                      )}>
                        @{conv.username}
                      </span>
                      <span className="text-[10px] text-text-muted flex-shrink-0 ml-1">
                        {conv.lastMessageAt ? dayjs(conv.lastMessageAt).fromNow(true) : ''}
                      </span>
                    </div>
                    <p className={clsx(
                      'text-xs truncate',
                      conv.unreadCount > 0 ? 'text-text-secondary font-medium' : 'text-text-muted',
                    )}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                    {conv.externalPostTitle && (
                      <p className="text-[10px] text-text-muted truncate mt-0.5">
                        📹 {conv.externalPostTitle}
                      </p>
                    )}
                  </div>

                  {/* Indicators */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {conv.unreadCount > 0 && (
                      <span className="w-4 h-4 bg-brand-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                    {isResolved && (
                      <CheckCircle size={12} className="text-success" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-surface-border">
          <p className="text-[10px] text-text-muted text-center">
            {total} total · syncs every 5 min
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">

        {!selectedId ? (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-text-muted" />
            </div>
            <h3 className="text-base font-semibold text-text-primary mb-1">Select a conversation</h3>
            <p className="text-sm text-text-muted max-w-xs">
              Choose a conversation from the left to view messages and reply
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="mt-4 flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync comments now'}
            </button>
          </div>
        ) : loadingConv ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-text-muted" />
          </div>
        ) : conversation ? (
          <>
            {/* Conversation header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-card flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-sm font-bold overflow-hidden">
                    {conversation.userAvatar ? (
                      <img src={conversation.userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      conversation.username?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  {platformConf && (
                    <div className={clsx('absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center', platformConf.bg)}>
                      <span className={platformConf.color}>{platformConf.icon}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">@{conversation.username}</p>
                  {conversation.externalPostTitle && (
                    <p className="text-xs text-text-muted truncate">
                      {platformConf?.label} · {conversation.externalPostTitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {conversation.externalPostUrl && (
                  <a
                    href={conversation.externalPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    View post →
                  </a>
                )}
                <Button
                  variant={conversation.status === 'RESOLVED' ? 'secondary' : 'outline'}
                  size="sm"
                  icon={conversation.status === 'RESOLVED' ? <Circle size={13} /> : <CheckCircle size={13} />}
                  onClick={toggleResolve}
                >
                  {conversation.status === 'RESOLVED' ? 'Reopen' : 'Resolve'}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {(conversation.messages || []).map((msg: any) => {
                const isOwner = msg.senderType === 'OWNER';
                return (
                  <div key={msg.id} className={clsx('flex gap-3', isOwner && 'flex-row-reverse')}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                      {msg.senderAvatar ? (
                        <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        msg.senderName?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={clsx('max-w-[70%]', isOwner && 'items-end')}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx('text-xs font-medium', isOwner ? 'text-brand-400' : 'text-text-secondary')}>
                          {isOwner ? 'You' : `@${msg.senderName}`}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {dayjs(msg.createdAt).fromNow()}
                        </span>
                        {msg.likeCount > 0 && (
                          <span className="text-[10px] text-text-muted">❤️ {msg.likeCount}</span>
                        )}
                      </div>
                      <div className={clsx(
                        'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        isOwner
                          ? 'bg-brand-500 text-white rounded-tr-sm'
                          : 'bg-surface-card border border-surface-border text-text-primary rounded-tl-sm',
                      )}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-6 py-3 border-t border-surface-border bg-surface-card/50">
                <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
                  <Sparkles size={11} className="text-brand-400" />
                  AI suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setReply(s); setSuggestions([]); }}
                      className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 px-3 py-1.5 rounded-xl hover:bg-brand-500/20 transition-colors text-left"
                    >
                      {s.slice(0, 60)}{s.length > 60 ? '...' : ''}
                    </button>
                  ))}
                  <button onClick={() => setSuggestions([])} className="text-xs text-text-muted hover:text-text-primary">
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Reply composer */}
            <div className="px-6 py-4 border-t border-surface-border bg-surface-card flex-shrink-0">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder="Write a reply... (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="w-full bg-surface-input border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={getSuggestions}
                    disabled={loadingSuggestions}
                    className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 hover:bg-brand-500/20 transition-colors"
                    title="AI suggestions"
                  >
                    {loadingSuggestions ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim() || sending}
                    className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                    title="Send reply"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-text-muted mt-1.5">
                Replying as the connected {platformConf?.label} account
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
