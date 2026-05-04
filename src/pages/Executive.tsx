import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowUpRight, Sparkles } from "lucide-react";
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
} from "@/data/network";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

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
  const risk = topRiskDealers(6);
  const movers = topMovers(4);
  const regions = regionRollup();
  const revenue = revenueVsPlan().slice(-6);
  const programs = programAdoption();

  const headlineKpis: KpiKey[] = ["csi", "retention1y", "partsSales", "warrantyLeakage"];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="border-b border-border/60 bg-gradient-to-b from-background to-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Executive Dashboard
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Network Performance — MMNA</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {DEALERS.length} dealers · {leaderboard.length} District Managers · 3 regions
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              Period: rolling 12 months · Updated today
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* Network KPI strip */}
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
            return (
              <div key={k} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {meta.label}
                  </div>
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    row.pctOnTrack >= 70 ? "bg-success/15 text-success" : row.pctOnTrack >= 50 ? "bg-warning/15 text-warning" : "bg-danger/15 text-danger",
                  )}>
                    {row.pctOnTrack}% on track
                  </span>
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{formatVal(k, row.value)}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  Target {formatVal(k, targetVal)}
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px]">
                  <DeltaPill label="MoM" positive={momPositive} text={formatVal(k, Math.abs(mom))} />
                  <DeltaPill label="YoY" positive={yoyPositive} text={formatVal(k, Math.abs(yoy))} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Region heatmap + AI briefing */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="glass-card p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Regional health</h2>
              <span className="text-[11px] text-muted-foreground">Avg dealer health by region</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {regions.map((r) => (
                <div key={r.region} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{r.region}</div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.dealerCount} dealers</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-semibold tabular-nums">{r.avgHealth}</div>
                      <div className="text-[11px] text-muted-foreground">avg score</div>
                    </div>
                    <div className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-semibold",
                      r.attentionCount >= 2 ? "bg-danger/15 text-danger" : r.attentionCount === 1 ? "bg-warning/15 text-warning" : "bg-success/15 text-success",
                    )}>
                      {r.attentionCount} need attention
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full", r.avgHealth >= 80 ? "bg-success" : r.avgHealth >= 60 ? "bg-warning" : "bg-danger")}
                      style={{ width: `${r.avgHealth}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Executive briefing</h2>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              Network CSI holds at <strong>{kpis.find(k => k.kpi === "csi")!.value.toFixed(1)}%</strong> with{" "}
              <strong>{kpis.find(k => k.kpi === "csi")!.pctOnTrack}%</strong> of dealers at target.
              Parts revenue is tracking{" "}
              <strong>
                {((kpis.find(k => k.kpi === "partsSales")!.value / kpis.find(k => k.kpi === "partsSales")!.target) * 100).toFixed(0)}%
              </strong>{" "}
              of plan. Largest concentration of risk sits in{" "}
              <strong>{regions.sort((a, b) => a.avgHealth - b.avgHealth)[0].region}</strong>{" "}
              region. Top movers and DM rankings below.
            </p>
            <div className="mt-3 rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground">
              AI-generated weekly summary · synthesized from {DEALERS.length} dealer scorecards
            </div>
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
                {leaderboard.map((row) => (
                  <tr key={row.dm.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
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
                      {row.attentionCount > 0 ? (
                        <span className="text-danger">{row.attentionCount}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
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

        {/* Risk + Movers */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-danger" />
                Top at-risk dealers
              </h2>
              <span className="text-[11px] text-muted-foreground">By health score · biggest gap</span>
            </div>
            <ul className="divide-y divide-border/60">
              {risk.map((r) => (
                <li key={r.dealer.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link to={`/dealers/${r.dealer.id}`} className="truncate text-sm font-medium hover:underline">
                      {r.dealer.name}
                    </Link>
                    <div className="text-[11px] text-muted-foreground">
                      {r.dealer.city}, {r.dealer.state} · {KPI_META[r.topKpi].label}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <HealthBadge status={computeHealth(r.dealer).status} score={r.score} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Movers (3-month)</h2>
              <span className="text-[11px] text-muted-foreground">CSI + retention composite</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-success">▲ Improving</div>
                <ul className="space-y-2">
                  {movers.up.map((m) => (
                    <li key={m.dealer.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link to={`/dealers/${m.dealer.id}`} className="truncate hover:underline">{m.dealer.name}</Link>
                      <span className="shrink-0 text-success tabular-nums">+{m.delta.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-danger">▼ Declining</div>
                <ul className="space-y-2">
                  {movers.down.map((m) => (
                    <li key={m.dealer.id} className="flex items-center justify-between gap-2 text-sm">
                      <Link to={`/dealers/${m.dealer.id}`} className="truncate hover:underline">{m.dealer.name}</Link>
                      <span className="shrink-0 text-danger tabular-nums">{m.delta.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Revenue vs Plan + Programs */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="glass-card p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Parts &amp; Accessory revenue vs plan</h2>
              <span className="text-[11px] text-muted-foreground">Last 6 months · network total</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => `$${Math.round(v).toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="parts" name="Parts actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="partsPlan" name="Parts plan" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accessories" name="Accy actual" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accyPlan" name="Accy plan" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                    <div className="h-full bg-primary" style={{ width: `${p.pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
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
