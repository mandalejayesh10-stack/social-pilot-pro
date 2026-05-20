"use client";

import { useState } from "react";
import clsx from "clsx";

interface HeatmapProps {
  data: number[][];           // [day 0-6][hour 0-23] = 0-100 engagement score
  confidenceMap?: number[][]; // [day 0-6][hour 0-23] = 0-100 confidence
  topSlots?: any[];           // BestTimeSlot[] with .why field
  platform: string;
  showPercentage?: boolean;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  if (h < 12) return h + "am";
  return (h - 12) + "pm";
});

function getCellStyle(score: number, confidence: number): React.CSSProperties {
  if (score === 0) return { backgroundColor: "transparent" };
  // Base pink intensity from score
  const opacity = 0.05 + (score / 100) * 0.80;
  // Desaturate slightly if low confidence
  const saturation = confidence > 0 ? Math.max(40, confidence) : 40;
  return {
    backgroundColor: `rgba(236, 72, 153, ${opacity})`,
    filter: confidence > 0 && confidence < 40 ? `saturate(${saturation}%)` : undefined,
  };
}

export function BestTimeHeatmap({ data, confidenceMap, topSlots, platform, showPercentage = false }: HeatmapProps) {
  const [tooltip, setTooltip] = useState<{ day: number; hour: number; x: number; y: number } | null>(null);

  if (!data || data.length === 0) return null;

  // Build a quick lookup for slot "why" text
  const slotWhy: Record<string, string> = {};
  if (topSlots) {
    for (const slot of topSlots) {
      slotWhy[`${slot.day}_${slot.hour}`] = slot.why || '';
    }
  }

  const activeTooltip = tooltip
    ? {
        score: data[tooltip.day]?.[tooltip.hour] || 0,
        confidence: confidenceMap?.[tooltip.day]?.[tooltip.hour] || 0,
        why: slotWhy[`${tooltip.day}_${tooltip.hour}`] || '',
        day: DAY_LABELS[tooltip.day],
        hour: HOUR_LABELS[tooltip.hour],
      }
    : null;

  return (
    <div className="overflow-x-auto relative">
      <div className="min-w-[600px]">
        {/* Hour headers — every 3 hours */}
        <div className="flex mb-1 ml-10">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex-1 text-center text-[9px] text-text-muted">
              {i % 3 === 0 ? HOUR_LABELS[i] : ""}
            </div>
          ))}
        </div>

        {/* Day rows */}
        {DAY_LABELS.map((day, dayIdx) => (
          <div key={dayIdx} className="flex items-center mb-0.5">
            <div className="w-10 flex-shrink-0 text-[10px] text-text-muted text-right pr-2">{day}</div>
            <div className="flex-1 flex gap-px">
              {Array.from({ length: 24 }, (_, hour) => {
                const score = data[dayIdx]?.[hour] || 0;
                const confidence = confidenceMap?.[dayIdx]?.[hour] || 0;
                const isTop = topSlots?.some((s) => s.day === dayIdx && s.hour === hour && s.score >= 70);

                return (
                  <div
                    key={hour}
                    className={clsx(
                      "flex-1 h-6 rounded-sm transition-all cursor-pointer relative",
                      isTop && "ring-1 ring-pink-400 ring-offset-0",
                    )}
                    style={getCellStyle(score, confidence)}
                    onMouseEnter={(e) => {
                      if (score > 0) {
                        setTooltip({ day: dayIdx, hour, x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {showPercentage && score > 60 && (
                      <span className="text-[8px] text-white flex items-center justify-center h-full font-bold">
                        {score}
                      </span>
                    )}
                    {/* Confidence dot — low confidence = faded dot */}
                    {score > 0 && confidence > 0 && confidence < 40 && (
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400 opacity-70" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <div className="w-2 h-2 rounded-full bg-amber-400 opacity-70" />
            Low confidence (limited data)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted">Less</span>
            {[0, 15, 30, 50, 70, 90].map((s) => (
              <div key={s} className="w-5 h-4 rounded-sm" style={getCellStyle(s, 100)} />
            ))}
            <span className="text-[10px] text-text-muted">More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {activeTooltip && activeTooltip.score > 0 && (
        <div
          className="fixed z-50 bg-surface-card border border-surface-border rounded-xl shadow-2xl p-3 w-64 pointer-events-none"
          style={{ left: Math.min(tooltip!.x + 12, window.innerWidth - 280), top: tooltip!.y - 10 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-primary">
              {activeTooltip.day} · {activeTooltip.hour}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `rgba(236, 72, 153, ${(activeTooltip.score / 100) * 0.3 + 0.1})`, color: '#ec4899' }}
            >
              {activeTooltip.score}%
            </span>
          </div>

          {/* Score bar */}
          <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full"
              style={{
                width: `${activeTooltip.score}%`,
                backgroundColor: `rgba(236, 72, 153, ${(activeTooltip.score / 100) * 0.8 + 0.1})`,
              }}
            />
          </div>

          {/* Confidence */}
          {activeTooltip.confidence > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className={clsx(
                "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                activeTooltip.confidence >= 65 ? "bg-green-500/15 text-green-400" :
                activeTooltip.confidence >= 40 ? "bg-amber-500/15 text-amber-400" :
                "bg-surface-hover text-text-muted",
              )}>
                {activeTooltip.confidence}% confidence
              </div>
            </div>
          )}

          {/* Why */}
          {activeTooltip.why && (
            <p className="text-[11px] text-text-muted leading-relaxed">{activeTooltip.why}</p>
          )}
          {!activeTooltip.why && (
            <p className="text-[11px] text-text-muted">
              {activeTooltip.score >= 80 ? 'Peak engagement window' :
               activeTooltip.score >= 60 ? 'Above-average engagement' :
               'Moderate engagement expected'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
