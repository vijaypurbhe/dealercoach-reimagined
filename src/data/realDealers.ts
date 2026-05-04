import type { Dealer, KpiPoint } from "./types";
import partsRaw from "./real/parts.json";
import accyRaw from "./real/accessories.json";
import kpiRaw from "./real/kpiPlans.json";

interface PartsRow { dlr_cd: string; ym_date: string; parts_cst: number; parts_obj: number; percent_obj: number; uio_utm: number }
interface AccyRow { dlr_cd: string; ym_date: string; accy_cst: number; accy_obj: number; percent_obj: number; nvr: number }
export interface RealKpiPlan {
  dlr_cd: string;
  contact_yyyymm: number;
  contact_date: string;
  kpi_type: string;
  root_cause: string;
  corrective_action: string;
  expected_result: string;
  isKpiMet: "Y" | "N" | string;
}

const parts = partsRaw as PartsRow[];
const accy = accyRaw as AccyRow[];
const kpiPlans = kpiRaw as RealKpiPlan[];

export const REAL_DEALER_IDS = new Set(["02042", "02048"]);

const dealerMeta: Record<string, { name: string; city: string; state: string }> = {
  "02042": { name: "Long Lewis Mitsubishi", city: "Hoover", state: "AL" },
  "02048": { name: "Birmingham Mitsubishi", city: "Birmingham", state: "AL" },
};

function ymToMonth(ym: string) {
  return `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
}

function buildHistory(dlr: string): KpiPoint[] {
  const pRows = parts.filter((r) => r.dlr_cd === dlr).sort((a, b) => a.ym_date.localeCompare(b.ym_date));
  const aRows = accy.filter((r) => r.dlr_cd === dlr).sort((a, b) => a.ym_date.localeCompare(b.ym_date));
  const months = pRows.map((r) => r.ym_date);
  const last12 = months.slice(-12);
  const planFor = (ym: string) => kpiPlans.filter((k) => k.dlr_cd === dlr && String(k.contact_yyyymm) === ym);
  return last12.map((ym) => {
    const p = pRows.find((r) => r.ym_date === ym)!;
    const a = aRows.find((r) => r.ym_date === ym);
    const plans = planFor(ym);
    const csiPlans = plans.filter((x) => x.kpi_type === "CSI");
    const csiMet = csiPlans.length === 0 ? 1 : csiPlans.filter((x) => x.isKpiMet === "Y").length / csiPlans.length;
    const csi = Math.round((86 + csiMet * 8) * 10) / 10;
    const retPlans = plans.filter((x) => x.kpi_type === "1 Year Retention");
    const retMet = retPlans.length === 0 ? 0.7 : retPlans.filter((x) => x.isKpiMet === "Y").length / retPlans.length;
    return {
      month: ymToMonth(ym),
      partsSales: Math.round(p.parts_cst),
      accessorySales: Math.round(a?.accy_cst ?? 0),
      retention1y: Math.round((58 + retMet * 12) * 10) / 10,
      retention7y: Math.round((30 + retMet * 8) * 10) / 10,
      csi,
      warrantyLeakage: Math.round((10 + (1 - csiMet) * 6) * 10) / 10,
    } as KpiPoint;
  });
}

export interface ActualVsTargetPoint { month: string; actual: number; target: number; pct: number }

export function getRealPartsSeries(dlr: string): ActualVsTargetPoint[] {
  return parts
    .filter((r) => r.dlr_cd === dlr)
    .sort((a, b) => a.ym_date.localeCompare(b.ym_date))
    .slice(-12)
    .map((r) => ({ month: ymToMonth(r.ym_date), actual: Math.round(r.parts_cst), target: Math.round(r.parts_obj), pct: r.percent_obj }));
}

export function getRealAccySeries(dlr: string): ActualVsTargetPoint[] {
  return accy
    .filter((r) => r.dlr_cd === dlr)
    .sort((a, b) => a.ym_date.localeCompare(b.ym_date))
    .slice(-12)
    .map((r) => ({ month: ymToMonth(r.ym_date), actual: Math.round(r.accy_cst), target: Math.round(r.accy_obj), pct: r.percent_obj }));
}

export function getRealCproSeries(dlr: string): ActualVsTargetPoint[] {
  // CPRO Count proxy = NVR; target = avg NVR
  const rows = accy.filter((r) => r.dlr_cd === dlr).sort((a, b) => a.ym_date.localeCompare(b.ym_date)).slice(-12);
  const tgt = Math.round(rows.reduce((s, r) => s + r.nvr, 0) / Math.max(1, rows.length));
  return rows.map((r) => ({ month: ymToMonth(r.ym_date), actual: r.nvr, target: tgt, pct: tgt ? (r.nvr / tgt) * 100 : 0 }));
}

export function getRealAvgPartsPerCpro(dlr: string): ActualVsTargetPoint[] {
  const pRows = parts.filter((r) => r.dlr_cd === dlr).sort((a, b) => a.ym_date.localeCompare(b.ym_date)).slice(-12);
  const aRows = accy.filter((r) => r.dlr_cd === dlr).sort((a, b) => a.ym_date.localeCompare(b.ym_date)).slice(-12);
  const target = 95;
  return pRows.map((p) => {
    const cpro = aRows.find((a) => a.ym_date === p.ym_date)?.nvr ?? 0;
    const actual = cpro > 0 ? Math.round(p.parts_cst / cpro) : 0;
    return { month: ymToMonth(p.ym_date), actual, target, pct: target ? (actual / target) * 100 : 0 };
  });
}

export function getRealKpiPlans(dlr: string): RealKpiPlan[] {
  return kpiPlans.filter((k) => k.dlr_cd === dlr);
}

export const REAL_DEALERS: Dealer[] = (["02042", "02048"] as const).map((id) => {
  const meta = dealerMeta[id];
  const history = buildHistory(id);
  return {
    id: `real-${id}`,
    name: meta.name,
    city: meta.city,
    state: meta.state,
    region: "Central",
    district: "Central-1",
    sizeBand: "Mid",
    modelMix: ["Outlander", "Eclipse Cross", "Mirage"],
    lastVisit: kpiPlans.find((k) => k.dlr_cd === id)?.contact_date ?? "2026-04-16",
    history,
    actions: kpiPlans
      .filter((k) => k.dlr_cd === id)
      .slice(0, 12)
      .map((k, i) => ({
        id: `${id}-rp${i}`,
        date: k.contact_date,
        title: k.corrective_action.slice(0, 80),
        category:
          k.kpi_type === "CSI" ? "CSI" : k.kpi_type.includes("Accessory") ? "Accessories" : k.kpi_type.includes("Retention") ? "Retention" : "Parts",
        description: k.root_cause,
        outcome: k.isKpiMet === "Y" ? "worked" : k.isKpiMet === "N" ? "in_progress" : "no_change",
        liftPct: k.isKpiMet === "Y" ? 4 : 0,
      })),
    context: {
      facilityNotes: ["Service drive busy at 8–10am peak", "Parts counter visible from service lane"],
      online: { googleRating: 4.2, reviewCount: 312, recentThemes: ["Knowledgeable advisors", "Wait times", "Honest pricing"], source: "mock" },
      accessibility: "Strong directional signage from main road.",
      staffingNotes: "Stable team; one technician vacancy open.",
    },
    peerIds: [],
    realDealerCode: id,
  } as Dealer & { realDealerCode: string };
});

export function isRealDealer(d: Dealer): boolean {
  return d.id.startsWith("real-");
}

export function getRealCode(d: Dealer): string | null {
  return isRealDealer(d) ? d.id.replace("real-", "") : null;
}
