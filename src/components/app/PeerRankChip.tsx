import { Trophy } from "lucide-react";
import type { Dealer, KpiKey } from "@/data/types";
import { KPI_META } from "@/data/types";
import { latest } from "@/data/health";
import { cn } from "@/lib/utils";

export function computePeerRank(dealer: Dealer, peers: Dealer[], kpi: KpiKey) {
  const meta = KPI_META[kpi];
  const all = [dealer, ...peers].map((d) => ({ id: d.id, v: latest(d)[kpi] }));
  const sorted = [...all].sort((a, b) => (meta.goodDirection === "up" ? b.v - a.v : a.v - b.v));
  const rank = sorted.findIndex((x) => x.id === dealer.id) + 1;
  const total = sorted.length;
  const leader = sorted[0];
  const dealerVal = latest(dealer)[kpi];
  const gapToLeader = meta.goodDirection === "up" ? leader.v - dealerVal : dealerVal - leader.v;
  const percentile = Math.round(((total - rank) / Math.max(1, total - 1)) * 100);
  return { rank, total, percentile, gapToLeader, leaderId: leader.id, leaderVal: leader.v };
}

export function PeerRankChip({
  dealer,
  peers,
  kpi,
  compact,
}: {
  dealer: Dealer;
  peers: Dealer[];
  kpi: KpiKey;
  compact?: boolean;
}) {
  const meta = KPI_META[kpi];
  const r = computePeerRank(dealer, peers, kpi);
  const top = r.rank === 1;
  const bottomThird = r.percentile < 34;
  const tone = top
    ? "bg-success/15 text-success ring-success/30"
    : bottomThird
      ? "bg-danger/10 text-danger ring-danger/20"
      : "bg-muted text-muted-foreground ring-border";

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ring-1",
          tone,
        )}
        title={`Rank ${r.rank} of ${r.total} on ${meta.label}`}
      >
        {top && <Trophy className="h-3 w-3" />}#{r.rank}/{r.total}
      </span>
    );
  }

  const formatGap = (v: number) =>
    meta.unit === "$" ? `$${Math.round(Math.abs(v)).toLocaleString()}` : `${Math.abs(v).toFixed(1)}pt`;

  return (
    <div className="rounded-lg bg-white/55 p-2 ring-1 ring-white/60">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {meta.label} rank
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 tabular-nums",
            tone,
          )}
        >
          {top && <Trophy className="h-3 w-3" />}
          #{r.rank} of {r.total}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            top ? "bg-success" : bottomThird ? "bg-danger" : "bg-primary",
          )}
          style={{ width: `${Math.max(6, r.percentile)}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{r.percentile}th pctile in peer set</span>
        <span>
          {top ? "Leader" : `${formatGap(r.gapToLeader)} behind leader`}
        </span>
      </div>
    </div>
  );
}
