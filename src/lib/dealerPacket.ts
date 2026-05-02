import type { Dealer } from "@/data/types";
import { DEALERS } from "@/data/dealers";

export function buildDealerPacket(dealer: Dealer) {
  const peers = DEALERS.filter((d) => dealer.peerIds.includes(d.id));
  const last = dealer.history[dealer.history.length - 1];
  const first = dealer.history[0];
  const lastQuarter = dealer.history.slice(-3);
  const peerLast = peers.map((p) => p.history[p.history.length - 1]);
  const peerAvg = (k: keyof typeof last) =>
    peerLast.reduce((s, r) => s + (r[k] as number), 0) / Math.max(1, peerLast.length);

  const kpis = ["retention1y", "retention7y", "partsSales", "accessorySales", "csi", "warrantyLeakage"] as const;
  const snapshot = kpis.map((k) => ({
    kpi: k,
    current: last[k],
    yoyDelta: Math.round((last[k] - first[k]) * 10) / 10,
    last3moAvg: Math.round((lastQuarter.reduce((s, p) => s + p[k], 0) / 3) * 10) / 10,
    peerAvg: Math.round(peerAvg(k) * 10) / 10,
  }));

  return {
    dealer: {
      name: dealer.name, city: dealer.city, state: dealer.state,
      region: dealer.region, sizeBand: dealer.sizeBand, modelMix: dealer.modelMix,
    },
    kpis: snapshot,
    context: dealer.context,
    recentActions: dealer.actions.slice(0, 8).map((a) => ({
      date: a.date, title: a.title, category: a.category, outcome: a.outcome, liftPct: a.liftPct,
    })),
    peerHistoricalActions: peers.flatMap((p) =>
      p.actions.filter((a) => a.outcome === "worked").slice(0, 3).map((a) => ({
        peer: p.name, title: a.title, category: a.category, liftPct: a.liftPct,
      })),
    ),
  };
}
