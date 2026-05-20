'use client';

import { useState } from 'react';
import { Bot, Sparkles, Hash, MessageSquare, Send, Loader2 } from 'lucide-react';

const DEMO_MESSAGES = [
  { role: 'user', text: 'Why did my engagement drop this week?' },
  { role: 'ai', text: 'Your engagement dropped 18% this week. Looking at your data, you posted 40% less than usual (3 vs 5 posts). Your best-performing content type is Reels — you published none this week. I recommend posting 1-2 Reels between 6-8 PM when your audience is most active.' },
  { role: 'user', text: 'Generate a caption for a product launch post' },
  { role: 'ai', text: '🚀 The wait is over. Introducing something we\'ve been building for months — and it\'s finally here.\n\nThis isn\'t just a product. It\'s the result of listening to every piece of feedback, every late night, every "what if we tried this?"\n\nLink in bio to be first. ✨\n\n#ProductLaunch #NewRelease #Innovation' },
];

const HASHTAG_SUGGESTIONS = [
  '#socialmedia', '#contentcreator', '#digitalmarketing',
  '#growthhacking', '#instagram', '#reels',
  '#marketing', '#brand', '#entrepreneur',
];

export function AiSection() {
  const [activeTab, setActiveTab] = useState<'chat' | 'caption' | 'hashtags'>('chat');
  const [input, setInput] = useState('');

  return (
    <section id="ai" className="py-28 bg-[#080812] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-pink-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-4 py-1.5">
              <Bot size={12} className="text-pink-400" />
              <span className="text-xs font-semibold text-pink-300 uppercase tracking-wide">AI Studio — Zero cost</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              AI that runs
              <br />
              <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
                on your machine.
              </span>
            </h2>

            <p className="text-white/50 text-lg leading-relaxed">
              Powered by Ollama — a local LLM that runs entirely on your hardware. No API costs, no data sent to third parties, no monthly AI bills.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: MessageSquare, label: 'AI Chatbot', desc: 'Ask anything about your analytics' },
                { icon: Sparkles, label: 'Captions', desc: 'Platform-optimized copy' },
                { icon: Hash, label: 'Hashtags', desc: 'Data-driven suggestions' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center mx-auto mb-2">
                      <Icon size={16} className="text-pink-400" />
                    </div>
                    <p className="text-xs font-semibold text-white">{item.label}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <p className="text-sm text-emerald-300 font-medium">
                Powered by <span className="font-bold">Ollama + Llama 3.2</span> — runs locally, completely free
              </p>
            </div>
          </div>

          {/* Right — AI demo */}
          <div className="relative">
            <div className="absolute inset-0 bg-pink-500/5 rounded-3xl blur-3xl" />
            <div className="relative bg-[#0d0d1e]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Tabs */}
              <div className="flex border-b border-white/5">
                {[
                  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
                  { id: 'caption', label: 'Caption', icon: Sparkles },
                  { id: 'hashtags', label: 'Hashtags', icon: Hash },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all flex-1 justify-center ${
                        activeTab === tab.id
                          ? 'text-pink-400 border-b-2 border-pink-400 bg-pink-500/5'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      <Icon size={12} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Chat tab */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-80">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {DEMO_MESSAGES.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                          msg.role === 'ai' ? 'bg-pink-500/20 text-pink-400' : 'bg-violet-500/20 text-violet-400'
                        }`}>
                          {msg.role === 'ai' ? <Bot size={12} /> : 'U'}
                        </div>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                          msg.role === 'ai'
                            ? 'bg-white/[0.05] text-white/80 rounded-tl-sm'
                            : 'bg-pink-500/20 text-pink-100 rounded-tr-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-white/5 flex gap-2">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Ask about your analytics..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50"
                    />
                    <button className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 hover:bg-pink-500/30 transition-colors">
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Caption tab */}
              {activeTab === 'caption' && (
                <div className="p-4 space-y-3 h-80 overflow-y-auto">
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Platform</p>
                    <div className="flex gap-2">
                      {['Instagram', 'Facebook', 'YouTube'].map((p, i) => (
                        <button key={p} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${i === 0 ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-white/5 text-white/40 border border-white/5'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Topic</p>
                    <input placeholder="New product launch..." className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none" />
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-violet-600 text-white text-xs font-semibold py-2.5 rounded-xl">
                    <Sparkles size={12} />
                    Generate Caption
                  </button>
                  <div className="bg-white/[0.03] border border-pink-500/20 rounded-xl p-3">
                    <p className="text-[10px] text-pink-400 mb-2 font-medium">✨ Generated</p>
                    <p className="text-xs text-white/70 leading-relaxed">
                      🚀 Something big is coming. We've been working on this for months and we can't wait to share it with you. Drop a 🔥 if you're ready. Link in bio. #Launch #NewProduct #Excited
                    </p>
                  </div>
                </div>
              )}

              {/* Hashtags tab */}
              {activeTab === 'hashtags' && (
                <div className="p-4 space-y-3 h-80 overflow-y-auto">
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Your content</p>
                    <textarea placeholder="Paste your caption here..." rows={3}
                      className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none resize-none" />
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white text-xs font-semibold py-2.5 rounded-xl">
                    <Hash size={12} />
                    Suggest Hashtags
                  </button>
                  <div>
                    <p className="text-[10px] text-white/40 mb-2">Suggested hashtags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {HASHTAG_SUGGESTIONS.map(tag => (
                        <span key={tag} className="text-[11px] bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full cursor-pointer hover:bg-violet-500/20 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
