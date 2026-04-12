import { calcReliability } from "@/lib/reliability";

interface Props {
  gamesPlayed: number;
  showLabel?: boolean;  // show "Rating Reliability" label above bar
  compact?: boolean;    // smaller version for cards
}

export function ReliabilityBar({ gamesPlayed, showLabel = false, compact = false }: Props) {
  const pct    = Math.round(calcReliability(gamesPlayed) * 100);
  const color  = pct >= 80 ? "bg-teal-500" : pct >= 40 ? "bg-yellow-500" : "bg-slate-500";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
      </div>
    );
  }

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-slate-400">Rating Reliability</span>
          <span className={`text-xs font-semibold tabular-nums ${
            pct >= 80 ? "text-teal-400" : pct >= 40 ? "text-yellow-400" : "text-slate-400"
          }`}>{pct}%</span>
        </div>
      )}
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      {!showLabel && (
        <p className="text-xs text-slate-500 mt-1 text-right tabular-nums">{pct}%</p>
      )}
    </div>
  );
}
