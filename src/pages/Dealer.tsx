import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { KpiActionPlansPanel } from "@/components/app/KpiActionPlansPanel";
import { ArrowLeft, MapPin, Calendar, Users, Building2, Star, Globe, MessageSquare, AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { AppHeader } from "@/components/app/AppHeader";
import { HealthBadge } from "@/components/app/HealthBadge";
import { KpiTrendCard } from "@/components/app/KpiTrendCard";
import { Sparkline } from "@/components/app/Sparkline";
import { CoachInsightsPanel } from "@/components/app/CoachInsights";
import { CoachChat } from "@/components/app/CoachChat";
import { InsightChip } from "@/components/app/InsightChip";
import { PeerRankChip } from "@/components/app/PeerRankChip";
import { DealerSideNav } from "@/components/app/DealerSideNav";
import { ActualVsTargetBars } from "@/components/app/ActualVsTargetBars";
import { ProgramsPanel, CsiAuditPanel, FranchisePanel, AttachmentsPanel, SignOffPanel } from "@/components/app/DealerExtraPanels";
import {
  getRealCode,
  getRealPartsSeries,
  getRealAccySeries,
  getRealCproSeries,
  getRealAvgPartsPerCpro,
} from "@/data/realDealers";
import { DEALERS, getDealer } from "@/data/dealers";
import { computeHealth, formatKpi, gapToTarget, latest } from "@/data/health";
import { getDealerInsight } from "@/data/insights";
import { KPI_META, type KpiKey, type Dealer, type ActionPlan, type DealerHealth } from "@/data/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const KPI_GRID: KpiKey[] = ["retention1y", "retention7y", "csi", "partsSales", "accessorySales", "warrantyLeakage"];
const KPI_STRIP: KpiKey[] = ["retention1y", "csi", "partsSales", "warrantyLeakage"];

export default function DealerPage() {
  const { dealerId } = useParams<{ dealerId: string }>();
  const dealer = dealerId ? getDealer(dealerId) : undefined;
  const [chatOpen, setChatOpen] = useState(false);
  const VALID_TABS = ["overview", "ai-coach", "performance", "kpi-plans", "kpis", "actions", "context", "programs", "csi", "franchise", "attachments", "signoff"];
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab = rawTab && VALID_TABS.includes(rawTab) ? rawTab : "overview";
  const setTab = (v: string) => {
    const next = new URLSearchParams(searchParams);
    if (v === "overview") next.delete("tab");
    else next.set("tab", v);
    setSearchParams(next, { replace: true });
  };

  if (!dealer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Dealer not found</h2>
          <Link to="/" className="mt-3 inline-block text-sm text-primary">Back to portfolio</Link>
        </div>
      </div>
    );
  }

  const peers = DEALERS.filter((d) => dealer.peerIds.includes(d.id));
  const health = computeHealth(dealer);
  const insight = getDealerInsight(dealer);
  const last = latest(dealer);
  const prev = dealer.history[dealer.history.length - 2];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="sticky top-0 z-30 border-b border-white/40 bg-white/50 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/35">
        <div className="mx-auto max-w-7xl px-6 pt-3">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Portfolio
          </Link>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4 pb-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight">{dealer.name}</h1>
                <HealthBadge status={health.status} score={health.score} />
                <TrendChip trend={health.trend} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {dealer.city}, {dealer.state}</span>
                <span className="inline-flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {dealer.region} · {dealer.district} · {dealer.sizeBand}</span>
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Last visit {dealer.lastVisit}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="h-3 w-3" /> {peers.length} peers</span>
              </div>
            </div>
            <Sheet open={chatOpen} onOpenChange={setChatOpen}>
              <SheetTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                  <MessageSquare className="h-4 w-4" /> Coach chat
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full p-0 sm:max-w-md">
                <div className="h-full p-4">
                  <CoachChat dealerId={dealer.id} dealerName={dealer.name} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-2 gap-2 pb-3 md:grid-cols-4">
            {KPI_STRIP.map((k) => (
              <KpiStripItem key={k} kpi={k} value={last[k]} prev={prev[k]} dealer={dealer} peers={peers} />
            ))}
          </div>
          <div className="grid gap-2 pb-3 md:grid-cols-2">
            <InsightChip insight={insight} />
            <FacilityIntelChip dealer={dealer} />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex gap-6">
          <DealerSideNav active={tab} onSelect={setTab} />
          <div className="min-w-0 flex-1">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 h-10 w-full justify-start overflow-x-auto bg-transparent p-0 lg:hidden">
            <TabsTrigger value="overview" className="data-[state=active]:bg-muted">Overview</TabsTrigger>
            <TabsTrigger value="ai-coach" className="data-[state=active]:bg-muted">AI Coach</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-muted">Performance vs Target</TabsTrigger>
            <TabsTrigger value="kpi-plans" className="data-[state=active]:bg-muted">KPI Action Plans</TabsTrigger>
            <TabsTrigger value="kpis" className="data-[state=active]:bg-muted">KPI trends</TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-muted">Actions ({dealer.actions.length})</TabsTrigger>
            <TabsTrigger value="context" className="data-[state=active]:bg-muted">Context</TabsTrigger>
            <TabsTrigger value="programs" className="data-[state=active]:bg-muted">Programs</TabsTrigger>
            <TabsTrigger value="csi" className="data-[state=active]:bg-muted">CSI Audit</TabsTrigger>
            <TabsTrigger value="franchise" className="data-[state=active]:bg-muted">Franchise</TabsTrigger>
            <TabsTrigger value="attachments" className="data-[state=active]:bg-muted">Attachments</TabsTrigger>
            <TabsTrigger value="signoff" className="data-[state=active]:bg-muted">Sign-Off</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 tab-transition">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section>
                  <SectionTitle>Top focus areas</SectionTitle>
                  <FocusCards dealer={dealer} />
                </section>
                <section>
                  <SectionTitle>Recent action plans</SectionTitle>
                  <ActionsList actions={dealer.actions.slice(0, 4)} />
                </section>
              </div>
              <aside className="lg:sticky lg:top-[260px] lg:self-start">
                <SectionTitle>Quick context</SectionTitle>
                <QuickContext dealer={dealer} health={health} peers={peers} />
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-0 tab-transition">
            <PerformanceVsTarget dealer={dealer} />
          </TabsContent>

          <TabsContent value="kpi-plans" className="mt-0 tab-transition">
            <KpiActionPlansPanel dealer={dealer} />
          </TabsContent>

          <TabsContent value="kpis" className="mt-0 tab-transition">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {KPI_GRID.map((k) => (<KpiTrendCard key={k} dealer={dealer} peers={peers} kpi={k} />))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-0 tab-transition">
            <ActionsList actions={dealer.actions} />
          </TabsContent>

          <TabsContent value="context" className="mt-0 tab-transition">
            <div className="grid gap-4 md:grid-cols-2">
              <ContextCard title="Online presence" icon={<Globe className="h-3.5 w-3.5" />}>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-medium">{dealer.context.online.googleRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">· {dealer.context.online.reviewCount} reviews</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {dealer.context.online.recentThemes.map((t) => (
                    <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">"{t}"</span>
                  ))}
                </div>
              </ContextCard>
              <ContextCard title="Facility notes" icon={<Building2 className="h-3.5 w-3.5" />}>
                <ul className="ml-4 list-disc space-y-1 text-sm text-foreground">
                  {dealer.context.facilityNotes.map((n) => <li key={n}>{n}</li>)}
                </ul>
              </ContextCard>
              <ContextCard title="Accessibility" icon={<MapPin className="h-3.5 w-3.5" />}>
                <p className="text-sm">{dealer.context.accessibility}</p>
              </ContextCard>
              <ContextCard title="Staffing" icon={<Users className="h-3.5 w-3.5" />}>
                <p className="text-sm">{dealer.context.staffingNotes}</p>
              </ContextCard>
            </div>
          </TabsContent>

          <TabsContent value="ai-coach" className="mt-0 tab-transition">
            <div className="grid gap-6 lg:grid-cols-2">
              <CoachInsightsPanel dealerId={dealer.id} />
              <CoachChat dealerId={dealer.id} dealerName={dealer.name} />
            </div>
          </TabsContent>

          <TabsContent value="programs" className="mt-0 tab-transition">
            <ProgramsPanel dealer={dealer} />
          </TabsContent>
          <TabsContent value="csi" className="mt-0 tab-transition">
            <CsiAuditPanel dealer={dealer} />
          </TabsContent>
          <TabsContent value="franchise" className="mt-0 tab-transition">
            <FranchisePanel dealer={dealer} />
          </TabsContent>
          <TabsContent value="attachments" className="mt-0 tab-transition">
            <AttachmentsPanel dealer={dealer} />
          </TabsContent>
          <TabsContent value="signoff" className="mt-0 tab-transition">
            <SignOffPanel dealer={dealer} />
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>;
}

function ContextCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function QuickContext({ dealer, health, peers }: { dealer: Dealer; health: DealerHealth; peers: Dealer[] }) {
  const last = latest(dealer);
  const recent = dealer.actions.slice(0, 6);
  const wins = recent.filter((a) => a.outcome === "worked").length;
  const inProgress = recent.filter((a) => a.outcome === "in_progress").length;
  const topIssue = health.topIssue;
  const topMeta = topIssue ? KPI_META[topIssue.kpi] : null;
  const themes = dealer.context.online.recentThemes.slice(0, 2);
  const daysSinceVisit = Math.max(
    0,
    Math.round((Date.now() - new Date(dealer.lastVisit).getTime()) / 86400000),
  );

  return (
    <div className="glass-card p-4 text-sm">
      {/* Reputation row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-warning text-warning" />
          <span className="font-semibold tabular-nums">{dealer.context.online.googleRating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">· {dealer.context.online.reviewCount} reviews</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {dealer.context.online.source === "google_places" ? "Live" : "Sample"}
        </span>
      </div>
      {themes.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {themes.map((t) => (
            <span key={t} className="rounded-md bg-white/60 px-1.5 py-0.5 text-[11px] text-muted-foreground ring-1 ring-white/60">
              "{t}"
            </span>
          ))}
        </div>
      )}

      <div className="my-3 h-px bg-white/60" />

      {/* Snapshot stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Health score" value={`${health.score}`} hint={`Trend ${health.trend}`} />
        <Stat label="CSI" value={`${last.csi.toFixed(0)}%`} hint={`Target ${KPI_META.csi.target}%`} />
        <Stat label="1Y retention" value={`${last.retention1y.toFixed(0)}%`} hint={`Target ${KPI_META.retention1y.target}%`} />
        <Stat label="Parts (mo)" value={`$${Math.round(last.partsSales / 1000)}k`} hint={`Target $${Math.round(KPI_META.partsSales.target / 1000)}k`} />
      </div>

      <div className="my-3 h-px bg-white/60" />

      {/* Top issue */}
      {topIssue && topMeta ? (
        <div className="rounded-lg bg-danger/10 p-2.5 ring-1 ring-danger/20">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-danger">
            <AlertTriangle className="h-3 w-3" /> Biggest gap
          </div>
          <div className="mt-1 text-xs text-foreground">
            <span className="font-medium">{topMeta.label}</span> is{" "}
            {topMeta.unit === "$"
              ? `$${Math.round(topIssue.gap).toLocaleString()}`
              : `${topIssue.gap.toFixed(1)}pt`}{" "}
            below target.
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-success/10 p-2.5 ring-1 ring-success/20 text-xs text-success">
          All KPIs at or above target.
        </div>
      )}

      <div className="my-3 h-px bg-white/60" />

      {/* Peer rank */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Peer rank · {dealer.region} {dealer.sizeBand}
        </div>
        <PeerRankChip dealer={dealer} peers={peers} kpi="csi" />
        <PeerRankChip dealer={dealer} peers={peers} kpi="retention1y" />
      </div>

      <div className="my-3 h-px bg-white/60" />
      <dl className="space-y-1.5 text-xs">
        <Row label="Last visit" value={`${dealer.lastVisit} · ${daysSinceVisit}d ago`} />
        <Row label="Peer set" value={`${peers.length} dealers · ${dealer.region}`} />
        <Row label="Recent actions" value={`${wins} wins · ${inProgress} in progress`} />
        <Row label="Staffing" value={dealer.context.staffingNotes} />
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {dealer.modelMix.map((m) => (
          <span key={m} className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] text-foreground ring-1 ring-white/60">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-white/55 p-2 ring-1 ring-white/60">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

function KpiStripItem({ kpi, value, prev, dealer, peers }: { kpi: KpiKey; value: number; prev: number; dealer: Dealer; peers: Dealer[] }) {
  const meta = KPI_META[kpi];
  const delta = value - prev;
  const goodUp = meta.goodDirection === "up";
  const positive = goodUp ? delta >= 0 : delta <= 0;
  const gap = gapToTarget(dealer, kpi);
  const series = dealer.history.map((p) => p[kpi]);
  return (
    <div className="glass-subtle rounded-lg px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{meta.label}</div>
            <PeerRankChip dealer={dealer} peers={peers} kpi={kpi} compact />
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-base font-semibold tabular-nums">{formatKpi(kpi, value)}</span>
            <span className={cn("text-[10px] tabular-nums", positive ? "text-success" : "text-danger")}>
              {delta >= 0 ? "+" : ""}{meta.unit === "$" ? `$${Math.round(delta).toLocaleString()}` : `${delta.toFixed(1)}pt`}
            </span>
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {gap > 0 ? <span className="text-danger">−{meta.unit === "$" ? `$${Math.round(gap).toLocaleString()}` : `${gap.toFixed(1)}pt`} vs target</span> : <span className="text-success">at/above target</span>}
          </div>
        </div>
        <div className="h-8 w-16 shrink-0">
          <Sparkline values={series} tone={positive ? "success" : "danger"} height={32} />
        </div>
      </div>
    </div>
  );
}

function FocusCards({ dealer }: { dealer: Dealer }) {
  const kpis = (Object.keys(KPI_META) as KpiKey[])
    .map((k) => {
      const meta = KPI_META[k];
      const range = meta.unit === "$" ? meta.target * 0.4 : meta.goodDirection === "up" ? 30 : 15;
      return { k, gap: gapToTarget(dealer, k), range };
    })
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap / b.range - a.gap / a.range)
    .slice(0, 3);

  if (kpis.length === 0) {
    return (
      <div className="glass-card p-5 text-sm text-muted-foreground">
        All KPIs at or above target — keep coaching to maintain momentum.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {kpis.map(({ k, gap }) => {
        const meta = KPI_META[k];
        const v = latest(dealer)[k];
        return (
          <div key={k} className="glass-card p-4 ring-1 ring-warning/30">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-warning-foreground">
              <AlertTriangle className="h-3 w-3 text-warning" /> Focus
            </div>
            <div className="mt-1 text-sm font-medium">{meta.label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{formatKpi(k, v)}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {meta.unit === "$" ? `$${Math.round(gap).toLocaleString()}` : `${gap.toFixed(1)}pt`} below {formatKpi(k, meta.target)} target
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionsList({ actions }: { actions: ActionPlan[] }) {
  return (
    <div className="glass-card overflow-hidden">
      <ul className="divide-y divide-white/50">
        {actions.map((a) => (
          <li key={a.id} className="flex items-start gap-4 px-4 py-3 text-sm">
            <div className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">{a.date}</div>
            <div className="flex-1">
              <div className="font-medium">{a.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{a.category} · {a.description}</div>
            </div>
            <OutcomePill outcome={a.outcome} liftPct={a.liftPct} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrendChip({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success"><TrendingUp className="h-3 w-3" /> Improving</span>;
  if (trend === "down") return <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger"><TrendingDown className="h-3 w-3" /> Declining</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"><Minus className="h-3 w-3" /> Stable</span>;
}

function OutcomePill({ outcome, liftPct }: { outcome: string; liftPct?: number }) {
  const map: Record<string, string> = {
    worked: "bg-success/15 text-success",
    no_change: "bg-muted text-muted-foreground",
    negative: "bg-danger/15 text-danger",
    in_progress: "bg-warning/20 text-warning-foreground",
  };
  const label = outcome === "worked" ? `Worked${liftPct ? ` +${liftPct}pt` : ""}` : outcome === "no_change" ? "No change" : outcome === "negative" ? "Negative" : "In progress";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[outcome]}`}>{label}</span>;
}

function PerformanceVsTarget({ dealer }: { dealer: Dealer }) {
  const code = getRealCode(dealer);
  if (!code) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Actual-vs-target charts are available for dealers with source data feeds.
        Open <span className="font-medium text-foreground">Birmingham Mitsubishi</span> or{" "}
        <span className="font-medium text-foreground">Long Lewis Mitsubishi</span> to see the customer's real KPI series.
      </div>
    );
  }
  const parts = getRealPartsSeries(code);
  const accy = getRealAccySeries(code);
  const cpro = getRealCproSeries(code);
  const avgPC = getRealAvgPartsPerCpro(code);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
        Showing <span className="font-semibold">real Mitsubishi CRS data</span> for dealer {code}. Green bars =
        achieved monthly target, red bars = below target.
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ActualVsTargetBars title="Part Sales" subtitle="Actual vs target ($)" data={parts} unit="$" />
        <ActualVsTargetBars title="Accessory Sales" subtitle="Actual vs target ($)" data={accy} unit="$" />
        <ActualVsTargetBars title="CPRO Count" subtitle="New vehicle retention monthly" data={cpro} unit="#" />
        <ActualVsTargetBars title="Avg Parts $ / CPRO" subtitle="Per-customer parts revenue" data={avgPC} unit="$" />
      </div>
    </div>
  );
}
