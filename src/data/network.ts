import { DEALERS } from "./dealers";
import { DISTRICT_MANAGERS, getDmDealers, type DistrictManager } from "./districtManagers";
import { computeHealth, latest, gapToTarget } from "./health";
import { KPI_META, type KpiKey, type Dealer } from "./types";

export interface NetworkKpi {
  kpi: KpiKey;
  value: number; // network avg (or sum for $)
  target: number;
  prev: number; // prior month
  yoy: number; // value 12mo ago
  pctOnTrack: number; // 0-100, % of dealers at/above target
}

const ALL_KPIS: KpiKey[] = ["csi", "retention1y", "partsSales", "accessorySales", "warrantyLeakage", "retention7y"];

function aggregate(dealers: Dealer[], kpi: KpiKey, monthIdx: number): number {
  const meta = KPI_META[kpi];
  const vals = dealers
    .map((d) => d.history[monthIdx]?.[kpi])
    .filter((v): v is number => typeof v === "number");
  if (!vals.length) return 0;
  if (meta.unit === "$") return vals.reduce((a, b) => a + b, 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function networkKpis(dealers: Dealer[] = DEALERS): NetworkKpi[] {
  const sample = dealers[0];
  const last = sample ? sample.history.length - 1 : 0;
  return ALL_KPIS.map((kpi) => {
    const meta = KPI_META[kpi];
    const value = aggregate(dealers, kpi, last);
    const prev = aggregate(dealers, kpi, Math.max(0, last - 1));
    const yoy = aggregate(dealers, kpi, 0);
    const onTrack = dealers.filter((d) => {
      const v = latest(d)[kpi];
      return meta.goodDirection === "up" ? v >= meta.target : v <= meta.target;
    }).length;
    return {
      kpi,
      value,
      target: meta.unit === "$" ? meta.target * dealers.length : meta.target,
      prev,
      yoy,
      pctOnTrack: dealers.length ? Math.round((onTrack / dealers.length) * 100) : 0,
    };
  });
}

export interface DmRollup {
  dm: DistrictManager;
  dealerCount: number;
  avgHealth: number;
  pctOnTrack: number;
  attentionCount: number;
  trend: "up" | "down" | "flat";
  visitsLast30: number;
  actionCloseRate: number; // % of recent actions with outcome === "worked"
}

export function dmLeaderboard(): DmRollup[] {
  return DISTRICT_MANAGERS.map((dm) => {
    const dealers = getDmDealers(dm.id);
    const healths = dealers.map((d) => computeHealth(d));
    const avg = healths.length ? Math.round(healths.reduce((a, h) => a + h.score, 0) / healths.length) : 0;
    const onTrack = healths.filter((h) => h.status === "on_track").length;
    const attention = healths.filter((h) => h.status === "attention").length;
    const ups = healths.filter((h) => h.trend === "up").length;
    const downs = healths.filter((h) => h.trend === "down").length;
    const trend: DmRollup["trend"] = ups > downs ? "up" : downs > ups ? "down" : "flat";

    const cutoff = Date.now() - 30 * 86400000;
    const visits = dealers.filter((d) => new Date(d.lastVisit).getTime() >= cutoff).length;

    const recentActions = dealers.flatMap((d) => d.actions.slice(0, 5));
    const closed = recentActions.filter((a) => a.outcome === "worked").length;
    const closeRate = recentActions.length ? Math.round((closed / recentActions.length) * 100) : 0;

    return {
      dm,
      dealerCount: dealers.length,
      avgHealth: avg,
      pctOnTrack: dealers.length ? Math.round((onTrack / dealers.length) * 100) : 0,
      attentionCount: attention,
      trend,
      visitsLast30: visits,
      actionCloseRate: closeRate,
    };
  }).sort((a, b) => b.avgHealth - a.avgHealth);
}

export interface RiskRow {
  dealer: Dealer;
  score: number;
  topKpi: KpiKey;
  gapDollars: number;
}

export function topRiskDealers(n = 6): RiskRow[] {
  return DEALERS
    .map((d) => {
      const h = computeHealth(d);
      let worstKpi: KpiKey = "csi";
      let worstDollars = 0;
      (Object.keys(KPI_META) as KpiKey[]).forEach((k) => {
        const meta = KPI_META[k];
        const gap = gapToTarget(d, k);
        if (gap <= 0) return;
        const dollars = meta.unit === "$" ? gap : gap * 1500; // rough $ proxy per pt
        if (dollars > worstDollars) {
          worstDollars = dollars;
          worstKpi = k;
        }
      });
      return { dealer: d, score: h.score, topKpi: worstKpi, gapDollars: Math.round(worstDollars) };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, n);
}

export interface MoverRow {
  dealer: Dealer;
  delta: number; // health score MoM-ish (recent vs prev csi+ret)
  direction: "up" | "down";
}

export function topMovers(n = 5): { up: MoverRow[]; down: MoverRow[] } {
  const rows = DEALERS.map((d) => {
    const h = d.history;
    const recent = (h[h.length - 1].csi + h[h.length - 1].retention1y) / 2;
    const prior = (h[h.length - 4].csi + h[h.length - 4].retention1y) / 2;
    const delta = recent - prior;
    return { dealer: d, delta, direction: (delta >= 0 ? "up" : "down") as "up" | "down" };
  });
  const up = [...rows].sort((a, b) => b.delta - a.delta).slice(0, n);
  const down = [...rows].sort((a, b) => a.delta - b.delta).slice(0, n);
  return { up, down };
}

export function regionRollup() {
  const regions: Dealer["region"][] = ["West", "Central", "East"];
  return regions.map((r) => {
    const dealers = DEALERS.filter((d) => d.region === r);
    const healths = dealers.map((d) => computeHealth(d));
    const avg = healths.length ? Math.round(healths.reduce((a, h) => a + h.score, 0) / healths.length) : 0;
    const attention = healths.filter((h) => h.status === "attention").length;
    return { region: r, dealerCount: dealers.length, avgHealth: avg, attentionCount: attention };
  });
}

export function revenueVsPlan() {
  // Build monthly parts+accy actual vs plan (sum of targets) for last 12 months
  const sample = DEALERS[0];
  return sample.history.map((_, i) => {
    const month = sample.history[i].month;
    const partsActual = DEALERS.reduce((a, d) => a + (d.history[i]?.partsSales ?? 0), 0);
    const accyActual = DEALERS.reduce((a, d) => a + (d.history[i]?.accessorySales ?? 0), 0);
    const partsPlan = KPI_META.partsSales.target * DEALERS.length;
    const accyPlan = KPI_META.accessorySales.target * DEALERS.length;
    return {
      month,
      parts: Math.round(partsActual),
      partsPlan,
      accessories: Math.round(accyActual),
      accyPlan,
    };
  });
}

export function networkSeries(kpi: KpiKey, months = 12): number[] {
  const sample = DEALERS[0];
  if (!sample) return [];
  const len = sample.history.length;
  const start = Math.max(0, len - months);
  const meta = KPI_META[kpi];
  const out: number[] = [];
  for (let i = start; i < len; i++) {
    const vals = DEALERS.map((d) => d.history[i]?.[kpi]).filter((v): v is number => typeof v === "number");
    if (!vals.length) { out.push(0); continue; }
    out.push(meta.unit === "$" ? vals.reduce((a, b) => a + b, 0) : vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return out;
}

export interface ExecInsight {
  tone: "opportunity" | "risk" | "win";
  title: string;
  detail: string;
  impact: string;
  confidence: number;
}

export function executiveInsights(): ExecInsight[] {
  const kpis = networkKpis();
  const regions = regionRollup();
  const insights: ExecInsight[] = [];

  const parts = kpis.find((k) => k.kpi === "partsSales")!;
  const partsAttainment = (parts.value / parts.target) * 100;
  if (partsAttainment < 100) {
    const gap = parts.target - parts.value;
    insights.push({
      tone: "opportunity",
      title: `Parts revenue tracking ${partsAttainment.toFixed(0)}% of plan`,
      detail: `Network is $${Math.round(gap / 1000)}k below monthly plan. Top quartile dealers convert 6–8% more attach at delivery — replicating their menu pricing across the bottom 20% recovers ~$${Math.round(gap * 0.6 / 1000)}k.`,
      impact: `+$${Math.round(gap * 0.6 / 1000)}k / mo`,
      confidence: 0.78,
    });
  }

  const csi = kpis.find((k) => k.kpi === "csi")!;
  const csiMom = csi.value - csi.prev;
  if (Math.abs(csiMom) >= 0.3) {
    insights.push({
      tone: csiMom >= 0 ? "win" : "risk",
      title: csiMom >= 0
        ? `CSI up ${csiMom.toFixed(1)}pt MoM — momentum holding`
        : `CSI slipped ${Math.abs(csiMom).toFixed(1)}pt MoM`,
      detail: csiMom >= 0
        ? `${csi.pctOnTrack}% of dealers at or above target. Reinforce service-drive playbook in the bottom ${100 - csi.pctOnTrack}% before quarter close.`
        : `${100 - csi.pctOnTrack}% of dealers now below target. Service wait time and advisor turnover are the dominant themes in recent surveys.`,
      impact: `${csi.pctOnTrack}% on plan`,
      confidence: 0.82,
    });
  }

  const worstRegion = [...regions].sort((a, b) => a.avgHealth - b.avgHealth)[0];
  if (worstRegion && worstRegion.attentionCount >= 1) {
    insights.push({
      tone: "risk",
      title: `${worstRegion.region} region concentrates risk`,
      detail: `Avg health ${worstRegion.avgHealth} with ${worstRegion.attentionCount} dealer${worstRegion.attentionCount > 1 ? "s" : ""} flagged for attention. Recommend an exec touchpoint with the regional DM before next cycle.`,
      impact: `${worstRegion.attentionCount} dealers`,
      confidence: 0.74,
    });
  }

  const warranty = kpis.find((k) => k.kpi === "warrantyLeakage")!;
  if (warranty.value > KPI_META.warrantyLeakage.target) {
    insights.push({
      tone: "opportunity",
      title: `Warranty leakage at ${warranty.value.toFixed(1)}% — above ${KPI_META.warrantyLeakage.target}% threshold`,
      detail: `Network avg leakage exceeds target by ${(warranty.value - KPI_META.warrantyLeakage.target).toFixed(1)}pt. Tightening claim documentation in the worst quartile typically recovers 1.5–2pt within 60 days.`,
      impact: `~1.8pt recoverable`,
      confidence: 0.7,
    });
  }

  return insights.slice(0, 4);
}

export function programAdoption() {
  // Use action categories as a proxy for program participation
  const programs = ["Retention", "CSI", "Parts", "Accessories", "Warranty"] as const;
  return programs.map((p) => {
    const participating = DEALERS.filter((d) => d.actions.some((a) => a.category === p)).length;
    return { name: p, pct: Math.round((participating / DEALERS.length) * 100), count: participating };
  });
}
