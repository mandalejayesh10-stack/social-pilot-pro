"use client";

import { useState, useEffect } from "react";
import { useOrgId } from "@/lib/hooks";
import { analyticsApi, resolveMediaUrl } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { BestTimeHeatmap } from "@/components/ui/best-time-heatmap";
import clsx from "clsx";
import dayjs from "dayjs";
import { Instagram, Facebook, Youtube, Download, RefreshCw, TrendingUp, Clock, Sparkles, ChevronUp, ChevronDown, Search, Filter } from "lucide-react";

type SortKey = "publishDate" | "likes" | "comments" | "reach" | "engagementRate" | "shares";
type SortDir = "asc" | "desc";

function fmt(n: number): string {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  INSTAGRAM: <Instagram size={13} />,
  FACEBOOK:  <Facebook size={13} />,
  YOUTUBE:   <Youtube size={13} />,
};

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "bg-pink-500 text-white",
  FACEBOOK:  "bg-blue-600 text-white",
  YOUTUBE:   "bg-red-600 text-white",
};

export default function PostPerformancePage() {
  const orgId = useOrgId();
  const toast = useToast();
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [period, setPeriod] = useState("30d");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("publishDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [bestTimes, setBestTimes] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "heatmap" | "insights">("posts");

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [postsData, btData] = await Promise.all([
        analyticsApi.topPosts(orgId, platform, period),
        analyticsApi.bestTimes(orgId, platform, "Asia/Kolkata"),
      ]);
      setPosts(postsData || []);
      setBestTimes(btData);
    } catch (e: any) {
      toast.error("Failed to load", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!orgId) return;
    setSyncing(true);
    try {
      await analyticsApi.forceSync(orgId);
      toast.success("Synced!", "Real data fetched from APIs");
      await loadData();
    } catch (e: any) {
      toast.error("Sync failed", e.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { loadData(); }, [orgId, platform, period]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortedPosts = [...posts]
    .filter((p) => !search || p.content?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av = 0, bv = 0;
      if (sortKey === "publishDate") { av = new Date(a.publishDate).getTime(); bv = new Date(b.publishDate).getTime(); }
      else { av = a.metrics?.[sortKey] || 0; bv = b.metrics?.[sortKey] || 0; }
      return sortDir === "asc" ? av - bv : bv - av;
    });

  const exportCSV = () => {
    const headers = ["Date", "Content", "Likes", "Comments", "Shares", "Reach", "Impressions", "Engagement %"];
    const rows = sortedPosts.map((p) => [
      dayjs(p.publishDate).format("YYYY-MM-DD"),
      '"' + (p.content || "").replace(/"/g, "").slice(0, 100) + '"',
      p.metrics?.likes || 0, p.metrics?.comments || 0, p.metrics?.shares || 0,
      p.metrics?.reach || 0, p.metrics?.impressions || 0,
      (p.metrics?.engagementRate || 0).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = platform.toLowerCase() + "-posts-" + dayjs().format("YYYY-MM-DD") + ".csv";
    a.click();
    toast.success("CSV exported");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Post Performance</h1>
          <p className="text-sm text-text-muted mt-0.5">Real analytics from your connected accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} className={syncing ? "animate-spin" : ""} />} loading={syncing} onClick={handleSync}>Sync</Button>
          <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={exportCSV} disabled={!posts.length}>Export CSV</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1">
          {["INSTAGRAM", "FACEBOOK", "YOUTUBE"].map((p) => (
            <button key={p} onClick={() => setPlatform(p)}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                platform === p ? "bg-brand-500 text-white" : "text-text-muted hover:text-text-primary")}>
              <span className={clsx("w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]", PLATFORM_COLORS[p])}>{PLATFORM_ICONS[p]}</span>
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1">
          {["7d", "30d", "90d"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                period === p ? "bg-brand-500 text-white" : "text-text-muted hover:text-text-primary")}>
              {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-surface-card border border-surface-border rounded-xl p-1 ml-auto">
          {[{ id: "posts", label: "Posts", icon: <Filter size={12} /> }, { id: "heatmap", label: "Heatmap", icon: <Clock size={12} /> }, { id: "insights", label: "AI Insights", icon: <Sparkles size={12} /> }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === tab.id ? "bg-brand-500 text-white" : "text-text-muted hover:text-text-primary")}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "posts" && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..."
              className="w-full bg-surface-input border border-surface-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
          <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase">Post</th>
                  {[{ key: "publishDate" as SortKey, label: "Date" }, { key: "likes" as SortKey, label: "Likes" }, { key: "comments" as SortKey, label: "Comments" }, { key: "shares" as SortKey, label: "Shares" }, { key: "reach" as SortKey, label: "Reach" }, { key: "engagementRate" as SortKey, label: "Eng. %" }].map((col) => (
                    <th key={col.key} className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase cursor-pointer hover:text-text-primary" onClick={() => handleSort(col.key)}>
                      <div className="flex items-center justify-end gap-1">{col.label}
                        {sortKey === col.key ? (sortDir === "asc" ? <ChevronUp size={12} className="text-brand-400" /> : <ChevronDown size={12} className="text-brand-400" />) : <ChevronDown size={12} className="opacity-30" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td className="px-5 py-4"><div className="skeleton h-4 w-48" /></td>{[1,2,3,4,5,6].map((j) => <td key={j} className="px-4 py-4"><div className="skeleton h-4 w-12 ml-auto" /></td>)}</tr>
                )) : sortedPosts.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center">
                    <TrendingUp size={24} className="text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-muted">No post data yet</p>
                    <button onClick={handleSync} className="mt-2 text-xs text-brand-400 hover:text-brand-300">Click Sync to fetch real data</button>
                  </td></tr>
                ) : sortedPosts.map((post, i) => (
                  <tr key={`${post.postId || ''}-${post.platform || ''}-${i}`} className="hover:bg-surface-hover/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {post.mediaUrls?.[0] && <img src={resolveMediaUrl(post.mediaUrls[0])} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                        <p className="text-sm text-text-primary line-clamp-2 max-w-xs">{post.content || "(No caption)"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-muted whitespace-nowrap">{dayjs(post.publishDate).format("MMM D, YYYY")}</td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">{fmt(post.metrics?.likes || 0)}</td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">{fmt(post.metrics?.comments || 0)}</td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">{fmt(post.metrics?.shares || 0)}</td>
                    <td className="px-4 py-3 text-right text-sm text-text-secondary">{fmt(post.metrics?.reach || 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full",
                        (post.metrics?.engagementRate || 0) > 3 ? "bg-success/15 text-success" :
                        (post.metrics?.engagementRate || 0) > 1 ? "bg-warning/15 text-warning" : "bg-surface-hover text-text-muted")}>
                        {(post.metrics?.engagementRate || 0).toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "heatmap" && (
        <div className="bg-surface-card border border-surface-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Best Time to Post</h3>
              <p className="text-xs text-text-muted mt-0.5">
                {bestTimes?.topSlots?.length > 0 ? "Best: " + bestTimes.topSlots[0].dayLabel + " at " + bestTimes.topSlots[0].label + " (" + bestTimes.topSlots[0].score + "% score)" : "Sync real data for personalized recommendations"}
              </p>
            </div>
            {bestTimes?.topSlots?.length > 0 && (
              <div className="flex gap-2">
                {bestTimes.topSlots.slice(0, 3).map((slot: any, i: number) => (
                  <div key={i} className="text-center bg-brand-500/10 border border-brand-500/20 rounded-xl px-3 py-2">
                    <p className="text-xs font-bold text-brand-400">{slot.score}%</p>
                    <p className="text-[10px] text-text-muted">{slot.dayLabel.slice(0, 3)} {slot.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {bestTimes?.heatmap ? <BestTimeHeatmap data={bestTimes.heatmap} platform={platform} /> : (
            <div className="h-48 flex items-center justify-center">
              <button onClick={handleSync} className="text-sm text-brand-400 hover:text-brand-300">Click Sync to generate heatmap</button>
            </div>
          )}
        </div>
      )}

      {activeTab === "insights" && (
        <div className="space-y-4">
          {bestTimes?.insights?.length > 0 ? (
            <div className="grid gap-3">
              {bestTimes.insights.map((insight: string, i: number) => (
                <div key={i} className="bg-surface-card border border-surface-border rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 flex-shrink-0"><Sparkles size={16} /></div>
                  <p className="text-sm text-text-primary leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-card border border-surface-border rounded-2xl p-12 text-center">
              <Sparkles size={28} className="text-text-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-text-secondary">No insights yet</p>
              <button onClick={handleSync} className="mt-3 text-xs text-brand-400 hover:text-brand-300">Sync now</button>
            </div>
          )}
          {bestTimes?.topSlots?.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Top 5 Best Times</h3>
              <div className="space-y-2">
                {bestTimes.topSlots.slice(0, 5).map((slot: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-text-muted w-5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-primary">{slot.dayLabel} at {slot.label}</span>
                        <span className="text-xs font-semibold text-brand-400">{slot.score}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: slot.score + "%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
