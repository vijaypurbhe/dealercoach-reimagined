import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  ShieldAlert,
  Trophy,
  ArrowUpRight,
  Activity,
  Target,
} from "lucide-react";
import { AppHeader } from "@/components/app/AppHeader";
import { HealthBadge } from "@/components/app/HealthBadge";
import { Sparkline } from "@/components/app/Sparkline";
import { DEALERS } from "@/data/dealers";
import { computeHealth } from "@/data/health";
import { KPI_META, type KpiKey } from "@/data/types";
import {
  networkKpis,
  dmLeaderboard,
  topRiskDealers,
  topMovers,
  regionRollup,
  revenueVsPlan,
  programAdoption,
  networkSeries,
  executiveInsights,
} from "@/data/network";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts";

function formatVal(k: KpiKey, v: number) {
  const meta = KPI_META[k];
  if (meta.unit === "$") {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
    return `$${Math.round(v)}`;
  }
  return `${v.toFixed(1)}%`;
}

export default function ExecutivePage() {
  const kpis = networkKpis();
  const leaderboard = dmLeaderboard();
  const risk = topRiskDealers(5);
  const movers = topMovers(4);
  const regions = regionRollup();
  const revenue = revenueVsPlan().slice(-6);
  const programs = programAdoption();
  const insights = executiveInsights();

  const headlineKpis: KpiKey[] = ["csi", "retention1y", "partsSales", "warrantyLeakage"];

  // Network composite health
  const allHealth = DEALERS.map((d) => computeHealth(d));
  const networkHealth = Math.round(allHealth.reduce((a, h) => a + h.score, 0) / allHealth.length);
  const onTrackPct = Math.round((allHealth.filter((h) => h.status === "on_track").length / allHealth.length) * 100);
  const attentionCount = allHealth.filter((h) => h.status === "attention").length;

  const partsRow = kpis.find((k) => k.kpi === "partsSales")!;
  const partsAttainment = Math.round((partsRow.value / partsRow.target) * 100);
  const ytdRevenue = revenueVsPlan().reduce((a, r) => a + r.parts + r.accessories, 0);
  const ytdPlan = revenueVsPlan().reduce((a, r) => a + r.partsPlan + r.accyPlan, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* HERO */}
      <div className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 opacity-90"
             style={{ background: "var(--gradient-mesh)" }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/30 to-background/80" />
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                <Sparkles className="h-3 w-3 text-primary" />
                Executive Dashboard · MMNA
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Network is{" "}
                <span className={cn(
                  networkHealth >= 80 ? "text-success" : networkHealth >= 60 ? "text-warning" : "text-danger",
                )}>
                  {networkHealth >= 80 ? "on track" : networkHealth >= 60 ? "watching" : "needs attention"}
                </span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {DEALERS.length} dealers across {leaderboard.length} District Managers and 3 regions ·
                {" "}{onTrackPct}% on plan · {attentionCount} flagged for attention · Parts at {partsAttainment}% of plan
              </p>
            </div>

            {/* Hero stat cluster */}
            <div className="flex flex-wrap items-stretch gap-3">
              <HeroStat
                label="Network health"
                value={`${networkHealth}`}
                suffix="/100"
                tone={networkHealth >= 80 ? "success" : networkHealth >= 60 ? "warning" : "danger"}
                spark={allHealth.map((h) => h.score).slice(0, 30)}
              />
              <HeroStat
                label="YTD revenue vs plan"
                value={`${Math.round((ytdRevenue / ytdPlan) * 100)}%`}
                tone={ytdRevenue >= ytdPlan ? "success" : "warning"}
                spark={networkSeries("partsSales", 12)}
              />
              <HeroStat
                label="Dealers on plan"
                value={`${onTrackPct}%`}
                tone={onTrackPct >= 70 ? "success" : onTrackPct >= 50 ? "warning" : "danger"}
                spark={networkSeries("csi", 12)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* AI INSIGHTS — top priority */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="h-4 w-4 text-primary" />
                AI Insights for the Executive
              </h2>
              <p className="text-[11px] text-muted-foreground">Synthesized from {DEALERS.length} dealer scorecards · Updated today</p>
            </div>
            <span className="text-[11px] text-muted-foreground">{insights.length} insights this week</span>
          </div>
          <div className={cn(
            "grid gap-3",
            insights.length === 1 && "grid-cols-1",
            insights.length === 2 && "md:grid-cols-2",
            insights.length === 3 && "md:grid-cols-2 lg:grid-cols-3",
            insights.length >= 4 && "md:grid-cols-2 xl:grid-cols-4",
          )}>
            {insights.map((ins, i) => (
              <InsightCard key={i} {...ins} />
            ))}
          </div>
        </section>

        {/* Headline KPI strip with sparklines */}
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {headlineKpis.map((k) => {
            const row = kpis.find((x) => x.kpi === k)!;
            const meta = KPI_META[k];
            const goodUp = meta.goodDirection === "up";
            const mom = row.value - row.prev;
            const yoy = row.value - row.yoy;
            const momPositive = goodUp ? mom >= 0 : mom <= 0;
            const yoyPositive = goodUp ? yoy >= 0 : yoy <= 0;
            const targetVal = meta.unit === "$" ? row.target : meta.target;
            const series = networkSeries(k, 12);
            const tone = row.pctOnTrack >= 70 ? "success" : row.pctOnTrack >= 50 ? "warning" : "danger";
            return (
              <div key={k} className="glass-card group relative overflow-hidden p-4 transition hover:shadow-lg">
                <div className={cn(
                  "absolute inset-x-0 top-0 h-0.5",
                  tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger",
                )} />
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {meta.label}
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    tone === "success" ? "bg-success/15 text-success" : tone === "warning" ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger",
                  )}>
                    {row.pctOnTrack}% on track
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-3xl font-semibold tabular-nums tracking-tight">{formatVal(k, row.value)}</div>
                  <div className="text-[11px] text-muted-foreground">/ {formatVal(k, targetVal)}</div>
                </div>
                <div className="mt-1 h-8">
                  <Sparkline values={series} tone={tone === "success" ? "success" : tone === "danger" ? "danger" : "primary"} height={32} />
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px]">
                  <DeltaPill label="MoM" positive={momPositive} text={formatVal(k, Math.abs(mom))} />
                  <DeltaPill label="YoY" positive={yoyPositive} text={formatVal(k, Math.abs(yoy))} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Revenue chart (prominent) + Region health */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="glass-card p-5 lg:col-span-2">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="h-4 w-4 text-primary" />
                  Parts &amp; Accessory revenue vs plan
                </h2>
                <p className="text-[11px] text-muted-foreground">Last 6 months · network total</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold tabular-nums">{Math.round((ytdRevenue / ytdPlan) * 100)}%</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">YTD attainment</div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenue}>
                  <defs>
                    <linearGradient id="partsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="accyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.7 0.18 260)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="oklch(0.7 0.18 260)" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => `$${Math.round(v).toLocaleString()}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="parts" name="Parts actual" fill="url(#partsGrad)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="accessories" name="Accessory actual" fill="url(#accyGrad)" radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="partsPlan" name="Parts plan" stroke="var(--danger)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Regional health</h2>
            </div>
            <div className="space-y-3">
              {regions.map((r) => {
                const tone = r.avgHealth >= 80 ? "success" : r.avgHealth >= 60 ? "warning" : "danger";
                return (
                  <div key={r.region} className="rounded-xl border border-border/60 bg-card/60 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{r.region}</div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.dealerCount} dealers</span>
                    </div>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <div className="text-2xl font-semibold tabular-nums">{r.avgHealth}</div>
                      {r.attentionCount > 0 && (
                        <span className="rounded-md bg-danger/15 px-2 py-0.5 text-[10px] font-semibold text-danger">
                          {r.attentionCount} attn
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full transition-all",
                          tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-danger")}
                        style={{ width: `${r.avgHealth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Risk + Movers + Programs */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldAlert className="h-4 w-4 text-danger" />
                Top at-risk dealers
              </h2>
              <span className="text-[11px] text-muted-foreground">Largest gap</span>
            </div>
            <ul className="divide-y divide-border/60">
              {risk.map((r) => (
                <li key={r.dealer.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link to={`/dealers/${r.dealer.id}`} className="flex items-center gap-1 truncate text-sm font-medium hover:text-primary">
                      {r.dealer.name}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                    <div className="text-[11px] text-muted-foreground">
                      {r.dealer.city}, {r.dealer.state} · {KPI_META[r.topKpi].label}
                    </div>
                  </div>
                  <HealthBadge status={computeHealth(r.dealer).status} score={r.score} />
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Trophy className="h-4 w-4 text-success" />
                Movers (3-month)
              </h2>
              <span className="text-[11px] text-muted-foreground">CSI + retention</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-success">▲ Improving</div>
                <ul className="space-y-2">
                  {movers.up.map((m) => (
                    <li key={m.dealer.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link to={`/dealers/${m.dealer.id}`} className="truncate hover:text-primary">{m.dealer.name}</Link>
                      <span className="shrink-0 rounded bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold text-success tabular-nums">+{m.delta.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-danger">▼ Declining</div>
                <ul className="space-y-2">
                  {movers.down.map((m) => (
                    <li key={m.dealer.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link to={`/dealers/${m.dealer.id}`} className="truncate hover:text-primary">{m.dealer.name}</Link>
                      <span className="shrink-0 rounded bg-danger/10 px-1.5 py-0.5 text-[11px] font-semibold text-danger tabular-nums">{m.delta.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Program adoption</h2>
              <span className="text-[11px] text-muted-foreground">% participating</span>
            </div>
            <ul className="space-y-3">
              {programs.map((p) => (
                <li key={p.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">{p.pct}% · {p.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full",
                        p.pct >= 70 ? "bg-success" : p.pct >= 40 ? "bg-warning" : "bg-danger")}
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* DM Leaderboard */}
        <section className="glass-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">District Manager leaderboard</h2>
            <span className="text-[11px] text-muted-foreground">Ranked by avg portfolio health</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">DM</th>
                  <th className="py-2 pr-3">Region</th>
                  <th className="py-2 pr-3 text-right">Dealers</th>
                  <th className="py-2 pr-3 text-right">Avg score</th>
                  <th className="py-2 pr-3 text-right">% on track</th>
                  <th className="py-2 pr-3 text-right">Attention</th>
                  <th className="py-2 pr-3 text-right">Visits 30d</th>
                  <th className="py-2 pr-3 text-right">Action close</th>
                  <th className="py-2 pr-3 text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={row.dm.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-[11px] tabular-nums text-muted-foreground">{i + 1}</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                          {row.dm.initials}
                        </div>
                        <span className="font-medium">{row.dm.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{row.dm.region}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{row.dealerCount}</td>
                    <td className="py-2.5 pr-3 text-right">
                      <span className={cn(
                        "inline-block rounded px-1.5 py-0.5 font-semibold tabular-nums",
                        row.avgHealth >= 80 ? "bg-success/15 text-success" : row.avgHealth >= 60 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger",
                      )}>
                        {row.avgHealth}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{row.pctOnTrack}%</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">
                      {row.attentionCount > 0 ? <span className="text-danger">{row.attentionCount}</span> : <span className="text-muted-foreground">0</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{row.visitsLast30}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{row.actionCloseRate}%</td>
                    <td className="py-2.5 pr-3 text-right">
                      <TrendIcon trend={row.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function HeroStat({
  label,
  value,
  suffix,
  tone,
  spark,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone: "success" | "warning" | "danger";
  spark: number[];
}) {
  return (
    <div className="glass-card min-w-[160px] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
          tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-danger",
        )}>{value}</div>
        {suffix && <div className="text-xs text-muted-foreground">{suffix}</div>}
      </div>
      <div className="mt-1 h-6">
        <Sparkline values={spark} tone={tone === "success" ? "success" : tone === "danger" ? "danger" : "primary"} height={24} />
      </div>
    </div>
  );
}

function InsightCard({
  tone,
  title,
  detail,
  impact,
  confidence,
}: {
  tone: "opportunity" | "risk" | "win";
  title: string;
  detail: string;
  impact: string;
  confidence: number;
}) {
  const config = {
    opportunity: { icon: Lightbulb, ring: "ring-primary/30", bar: "bg-primary", chip: "bg-primary/10 text-primary", label: "Opportunity" },
    risk: { icon: AlertTriangle, ring: "ring-danger/30", bar: "bg-danger", chip: "bg-danger/10 text-danger", label: "Risk" },
    win: { icon: Trophy, ring: "ring-success/30", bar: "bg-success", chip: "bg-success/10 text-success", label: "Win" },
  }[tone];
  const Icon = config.icon;
  return (
    <div className={cn("glass-card group relative overflow-hidden p-4 ring-1 transition hover:shadow-lg", config.ring)}>
      <div className={cn("absolute inset-y-0 left-0 w-1", config.bar)} />
      <div className="flex items-start justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", config.chip)}>
          <Icon className="h-3 w-3" />
          {config.label}
        </span>
        <span className="text-[10px] text-muted-foreground">{Math.round(confidence * 100)}% conf</span>
      </div>
      <h3 className="mt-2 text-sm font-semibold leading-snug">{title}</h3>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground line-clamp-4">{detail}</p>
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2">
        <span className="text-[11px] font-semibold text-foreground tabular-nums">{impact}</span>
        <Sparkles className="h-3 w-3 text-primary opacity-60" />
      </div>
    </div>
  );
}

function DeltaPill({ label, positive, text }: { label: string; positive: boolean; text: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium", positive ? "text-success" : "text-danger")}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{text}</span>
    </span>
  );
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp className="ml-auto h-4 w-4 text-success" />;
  if (trend === "down") return <TrendingDown className="ml-auto h-4 w-4 text-danger" />;
  return <Minus className="ml-auto h-4 w-4 text-muted-foreground" />;
}
