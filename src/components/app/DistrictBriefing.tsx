import { ArrowUpRight, Sparkles, TrendingDown, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { DEALERS } from "@/data/dealers";
import { computeHealth, latest } from "@/data/health";
import { KPI_META, type KpiKey } from "@/data/types";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .replace("Mitsubishi", "")
    .replace("of", "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function DistrictBriefing() {
  const data = useMemo(() => {
    const enriched = DEALERS.map((d) => {
      const h = computeHealth(d);
      const last = latest(d);
      const prev = d.history[d.history.length - 2];
      const csiDelta = last.csi - prev.csi;
      const retDelta = last.retention1y - prev.retention1y;
      // composite mover score
      const mover = csiDelta + retDelta;
      return { dealer: d, health: h, mover, csiDelta, retDelta };
    });

    const districtScore = Math.round(enriched.reduce((s, e) => s + e.health.score, 0) / enriched.length);
    const attention = enriched.filter((e) => e.health.status === "attention");
    const watch = enriched.filter((e) => e.health.status === "watch");
    const onTrack = enriched.filter((e) => e.health.status === "on_track");

    const topMover = [...enriched].sort((a, b) => b.mover - a.mover)[0];
    const biggestDrop = [...enriched].sort((a, b) => a.mover - b.mover)[0];

    // Top risk KPI across district
    const riskCounts: Record<string, number> = {};
    enriched.forEach((e) => {
      if (e.health.topIssue) riskCounts[e.health.topIssue.kpi] = (riskCounts[e.health.topIssue.kpi] ?? 0) + 1;
    });
    const topRisk = Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0];

    // Days since last visit; flag stale
    const stale = enriched
      .map((e) => ({
        ...e,
        days: Math.round((Date.now() - new Date(e.dealer.lastVisit).getTime()) / 86400000),
      }))
      .sort((a, b) => b.days - a.days);
    const staleCount = stale.filter((s) => s.days > 30).length;

    const focusList = [...attention, ...watch].slice(0, 5);

    const narrative = (() => {
      const parts: string[] = [];
      if (topRisk) {
        const meta = KPI_META[topRisk[0] as KpiKey];
        parts.push(`${topRisk[1]} of ${enriched.length} dealers flag ${meta.label.toLowerCase()} as their top gap.`);
      }
      if (attention.length) {
        parts.push(`${attention.length} need attention this week.`);
      }
      if (topMover && topMover.mover > 0.5) {
        parts.push(`${topMover.dealer.name.split(" of ")[0]} is your fastest mover — capture the playbook.`);
      }
      if (!parts.length) parts.push("District is stable. Focus this week on protecting watch-list dealers.");
      return parts.join(" ");
    })();

    return { enriched, districtScore, attention, watch, onTrack, topMover, biggestDrop, topRisk, staleCount, focusList, narrative };
  }, []);

  const scoreTone =
    data.districtScore >= 80 ? "text-success" : data.districtScore >= 60 ? "text-warning-foreground" : "text-danger";

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div
        className="relative px-6 py-5 text-primary-foreground"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px ai-shimmer opacity-70" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider opacity-90">
              <Sparkles className="h-3.5 w-3.5" /> Morning briefing · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </div>
            <h2 className="mt-1 text-xl font-semibold leading-snug md:text-2xl">{data.narrative}</h2>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/15 px-4 py-2 ring-1 ring-white/25 backdrop-blur">
            <div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">District health</div>
              <div className="text-3xl font-semibold tabular-nums leading-none">{data.districtScore}</div>
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div className="text-xs leading-tight opacity-90">
              <div>{data.onTrack.length} on track</div>
              <div>{data.watch.length} watch</div>
              <div>{data.attention.length} attention</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-3">
        <BriefingCell
          label="Top mover"
          tone="success"
          icon={<TrendingUp className="h-4 w-4" />}
          dealerName={data.topMover.dealer.name}
          dealerId={data.topMover.dealer.id}
          metric={`${data.topMover.mover >= 0 ? "+" : ""}${data.topMover.mover.toFixed(1)}pt composite`}
          sub={`CSI ${data.topMover.csiDelta >= 0 ? "+" : ""}${data.topMover.csiDelta.toFixed(1)} · 1Y Ret ${data.topMover.retDelta >= 0 ? "+" : ""}${data.topMover.retDelta.toFixed(1)}`}
        />
        <BriefingCell
          label="Biggest drop"
          tone="danger"
          icon={<TrendingDown className="h-4 w-4" />}
          dealerName={data.biggestDrop.dealer.name}
          dealerId={data.biggestDrop.dealer.id}
          metric={`${data.biggestDrop.mover.toFixed(1)}pt composite`}
          sub={`CSI ${data.biggestDrop.csiDelta >= 0 ? "+" : ""}${data.biggestDrop.csiDelta.toFixed(1)} · 1Y Ret ${data.biggestDrop.retDelta >= 0 ? "+" : ""}${data.biggestDrop.retDelta.toFixed(1)}`}
        />
        <div className="bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> Stale visits
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {data.staleCount}
            <span className="ml-1 text-xs font-normal text-muted-foreground">dealers &gt;30d</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Auto-prioritize this week's route by recency × health score.
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 px-6 py-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <AlertTriangle className="h-3 w-3" /> Focus today
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {data.focusList.length === 0 && (
            <span className="text-xs text-muted-foreground">No dealers below threshold — keep the pressure on.</span>
          )}
          {data.focusList.map((e) => (
            <Link
              key={e.dealer.id}
              to={`/dealers/${e.dealer.id}`}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                  e.health.status === "attention" ? "bg-danger" : "bg-warning",
                )}
              >
                {initials(e.dealer.name)}
              </span>
              <span className="truncate max-w-[160px]">{e.dealer.name.split(" of ")[0]}</span>
              <span className="tabular-nums text-muted-foreground">· {e.health.score}</span>
              <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
          <span className={cn("ml-auto text-[10px] font-medium uppercase tracking-wider", scoreTone)}>
            {data.attention.length === 0 ? "All clear" : `${data.attention.length} red · ${data.watch.length} amber`}
          </span>
        </div>
      </div>
    </div>
  );
}

function BriefingCell({
  label,
  icon,
  tone,
  dealerName,
  dealerId,
  metric,
  sub,
}: {
  label: string;
  icon: React.ReactNode;
  tone: "success" | "danger";
  dealerName: string;
  dealerId: string;
  metric: string;
  sub: string;
}) {
  return (
    <Link to={`/dealers/${dealerId}`} className="group block bg-card p-4 transition-colors hover:bg-accent/40">
      <div
        className={cn(
          "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider",
          tone === "success" ? "text-success" : "text-danger",
        )}
      >
        {icon} {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold">{dealerName}</div>
      <div className={cn("mt-0.5 text-base font-semibold tabular-nums", tone === "success" ? "text-success" : "text-danger")}>
        {metric}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </Link>
  );
}
