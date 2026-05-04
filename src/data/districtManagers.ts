import { DEALERS } from "./dealers";
import type { Dealer } from "./types";

export interface DistrictManager {
  id: string;
  name: string;
  initials: string;
  region: Dealer["region"];
  title: string;
  dealerIds: string[];
}

// Deterministically assign each dealer to a DM based on region
const ROSTER: Omit<DistrictManager, "dealerIds">[] = [
  { id: "dm-west-1", name: "Sam Reynolds", initials: "SR", region: "West", title: "District Manager · West-1" },
  { id: "dm-west-2", name: "Maya Alvarez", initials: "MA", region: "West", title: "District Manager · West-2" },
  { id: "dm-central-1", name: "Devon Park", initials: "DP", region: "Central", title: "District Manager · Central-1" },
  { id: "dm-central-2", name: "Priya Shah", initials: "PS", region: "Central", title: "District Manager · Central-2" },
  { id: "dm-east-1", name: "Jordan Lee", initials: "JL", region: "East", title: "District Manager · East-1" },
  { id: "dm-east-2", name: "Riley Chen", initials: "RC", region: "East", title: "District Manager · East-2" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const DISTRICT_MANAGERS: DistrictManager[] = ROSTER.map((r) => ({ ...r, dealerIds: [] }));

const dealerToDm = new Map<string, string>();
for (const d of DEALERS) {
  const candidates = DISTRICT_MANAGERS.filter((m) => m.region === d.region);
  const pool = candidates.length ? candidates : DISTRICT_MANAGERS;
  const dm = pool[hash(d.id) % pool.length];
  dm.dealerIds.push(d.id);
  dealerToDm.set(d.id, dm.id);
}

export function getDmForDealer(dealerId: string): DistrictManager | undefined {
  const id = dealerToDm.get(dealerId);
  return DISTRICT_MANAGERS.find((m) => m.id === id);
}

export function getDm(id: string) {
  return DISTRICT_MANAGERS.find((m) => m.id === id);
}

export function getDmDealers(id: string): Dealer[] {
  const dm = getDm(id);
  if (!dm) return [];
  return DEALERS.filter((d) => dm.dealerIds.includes(d.id));
}
