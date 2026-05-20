'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrgId } from '@/lib/hooks';
import { aiApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';
import {
  Sparkles, Hash, MessageSquare, Send,
  Copy, Check, Bot, User, Wand2,
} from 'lucide-react';

type Tab = 'caption' | 'hashtags' | 'chat';

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual & Fun' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
  { value: 'promotional', label: 'Promotional' },
];

export default function AiStudioPage() {
  const [tab, setTab] = useState<Tab>('caption');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">AI Studio</h1>
        <p className="text-sm text-text-muted mt-0.5">Powered by Ollama — runs locally, zero cost</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1 w-fit">
        {[
          { id: 'caption',  label: 'Caption Generator', icon: <Wand2 size={14} /> },
          { id: 'hashtags', label: 'Hashtag Suggester', icon: <Hash size={14} /> },
          { id: 'chat',     label: 'AI Assistant',      icon: <MessageSquare size={14} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.id ? 'bg-brand-500 text-white' : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'caption'  && <CaptionGenerator />}
      {tab === 'hashtags' && <HashtagSuggester />}
      {tab === 'chat'     && <AiChatbot />}
    </div>
  );
}

// ── Caption Generator ─────────────────────────────────────────
function CaptionGenerator() {
  const orgId = useOrgId();
  const [platform, setPlatform] = useState('instagram');
  const [tone, setTone] = useState('professional');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<{ caption: string; hashtags: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await aiApi.generateCaption(orgId, { platform, tone, topic, includeHashtags: true });
      setResult(res);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCaption = () => {
    if (!result) return;
    const text = `${result.caption}\n\n${result.hashtags.map((h) => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Input */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Generate Caption</h3>

        <Select
          label="Platform"
          options={PLATFORMS}
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        />

        <Select
          label="Tone"
          options={TONES}
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        />

        <Textarea
          label="Topic / Description"
          placeholder="Describe what your post is about..."
          rows={4}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <Button
          onClick={generate}
          loading={loading}
          icon={<Sparkles size={15} />}
          className="w-full"
        >
          Generate Caption
        </Button>
      </div>

      {/* Output */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Generated Caption</h3>
          {result && (
            <button
              onClick={copyCaption}
              className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy all'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-4/6" />
            <div className="skeleton h-4 w-3/6" />
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="bg-surface-hover rounded-xl p-4">
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{result.caption}</p>
            </div>
            {result.hashtags.length > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-2">Suggested hashtags</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags.map((h) => (
                    <span key={h} className="text-xs bg-brand-500/10 text-brand-400 px-2 py-1 rounded-lg">
                      #{h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Wand2 size={32} className="text-text-muted mb-3" />
            <p className="text-sm text-text-muted">Your generated caption will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hashtag Suggester ─────────────────────────────────────────
function HashtagSuggester() {
  const orgId = useOrgId();
  const [platform, setPlatform] = useState('instagram');
  const [content, setContent] = useState('');
  const [niche, setNiche] = useState('');
  const [count, setCount] = useState(20);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const generate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await aiApi.suggestHashtags(orgId, { platform, content, niche, count });
      setHashtags(res.hashtags || []);
      setSelected(new Set());
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setSelected(next);
  };

  const copySelected = () => {
    const tags = (selected.size > 0 ? Array.from(selected) : hashtags).map((h) => `#${h}`).join(' ');
    navigator.clipboard.writeText(tags);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-surface-card border border-surface-border rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Hashtag Suggester</h3>

        <Select label="Platform" options={PLATFORMS} value={platform} onChange={(e) => setPlatform(e.target.value)} />

        <Textarea
          label="Post content"
          placeholder="Paste your post content here..."
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Niche (optional)</label>
            <input
              className="w-full bg-surface-input border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="fitness, tech..."
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Count</label>
            <input
              type="number"
              min="5"
              max="30"
              className="w-full bg-surface-input border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-500 transition-colors"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
            />
          </div>
        </div>

        <Button onClick={generate} loading={loading} icon={<Hash size={15} />} className="w-full">
          Suggest Hashtags
        </Button>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Suggested Hashtags
            {hashtags.length > 0 && <span className="text-text-muted font-normal ml-1">({hashtags.length})</span>}
          </h3>
          {hashtags.length > 0 && (
            <button onClick={copySelected} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Copy {selected.size > 0 ? `selected (${selected.size})` : 'all'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="skeleton h-7 rounded-lg" style={{ width: `${60 + Math.random() * 60}px` }} />
            ))}
          </div>
        ) : hashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={clsx(
                  'text-sm px-3 py-1.5 rounded-xl border transition-all',
                  selected.has(tag)
                    ? 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                    : 'bg-surface-hover border-surface-border text-text-secondary hover:text-text-primary',
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Hash size={32} className="text-text-muted mb-3" />
            <p className="text-sm text-text-muted">Hashtags will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Chatbot ────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string; }

function AiChatbot() {
  const orgId = useOrgId();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your AI analytics assistant. Ask me anything about your social media performance — like \"Why is my engagement low?\" or \"What's the best time to post?\"" },
  ]);
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await aiApi.chat(orgId, {
        message: userMsg,
        platform,
        conversationHistory: history,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please ensure Ollama is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTIONS = [
    'Why is my engagement low?',
    'Best time to post on Instagram?',
    'How can I grow my followers?',
    'What content performs best?',
  ];

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center">
            <Bot size={16} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">AI Assistant</p>
            <p className="text-xs text-text-muted">Powered by Ollama</p>
          </div>
        </div>
        <Select
          options={PLATFORMS}
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-36 py-1.5 text-xs"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              msg.role === 'assistant' ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-hover text-text-secondary',
            )}>
              {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className={clsx(
              'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'assistant'
                ? 'bg-surface-hover text-text-primary rounded-tl-sm'
                : 'bg-brand-500 text-white rounded-tr-sm',
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center">
              <Bot size={14} className="text-brand-400" />
            </div>
            <div className="bg-surface-hover rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); }}
              className="text-xs bg-surface-hover border border-surface-border text-text-secondary hover:text-text-primary hover:border-brand-500/30 px-3 py-1.5 rounded-xl transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-5 py-4 border-t border-surface-border">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about your analytics..."
            className="flex-1 bg-surface-input border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors"
          />
          <Button onClick={send} disabled={!input.trim() || loading} icon={<Send size={15} />}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
