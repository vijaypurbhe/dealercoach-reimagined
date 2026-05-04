import { Tag, Star, Building2, Paperclip, FileSignature, CheckCircle2, Clock, AlertCircle, Download, Eye, Pen } from "lucide-react";
import type { Dealer } from "@/data/types";

function PanelShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

/* ---------- Programs / Promotions ---------- */
const PROGRAMS = [
  { id: "P-2025-Q2-PARTS", name: "Spring Parts Bonus", window: "Apr 1 – Jun 30, 2025", status: "Active", enrolled: true, payout: "Up to $4,200/mo", desc: "Tiered rebate on filters, brakes, batteries when monthly parts ≥ 105% of objective." },
  { id: "P-2025-CPRO", name: "CPRO Acceleration", window: "Mar 15 – Jul 15, 2025", status: "Active", enrolled: true, payout: "$25 / new CPRO", desc: "Per-customer incentive for first-time service visit within 90 days of vehicle delivery." },
  { id: "P-2025-ACCY-LAUNCH", name: "Outlander PHEV Accessory Launch", window: "May 1 – Aug 31, 2025", status: "Available", enrolled: false, payout: "10% on attached kits", desc: "Co-op marketing + per-vehicle attach bonus when accessory packages sold at delivery." },
  { id: "P-2025-CSI", name: "CSI Excellence Bonus", window: "FY2025", status: "Active", enrolled: true, payout: "$0 – $18,000 / qtr", desc: "Quarterly payout when service CSI ≥ region median + retention ≥ 65%." },
];

export function ProgramsPanel({ dealer }: { dealer: Dealer }) {
  return (
    <PanelShell title="Programs & Promotions" subtitle={`Active and available programs for ${dealer.name}`}>
      <div className="grid gap-3 md:grid-cols-2">
        {PROGRAMS.map((p) => (
          <div key={p.id} className="glass-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{p.id} · {p.window}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${p.enrolled ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {p.enrolled ? "Enrolled" : "Available"}
              </span>
            </div>
            <p className="mt-2 text-xs text-foreground/80">{p.desc}</p>
            <div className="mt-3 flex items-center justify-between border-t border-white/50 pt-2 text-xs">
              <span className="text-muted-foreground">Payout</span>
              <span className="font-medium tabular-nums">{p.payout}</span>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

/* ---------- CSI Audit ---------- */
const CSI_QUESTIONS = [
  { area: "Service Advisor", q: "Greeted within 2 minutes of arrival", score: 4.6 },
  { area: "Service Advisor", q: "Walk-around completed at write-up", score: 3.8 },
  { area: "Service Advisor", q: "Loaner / shuttle offered when needed", score: 4.2 },
  { area: "Repair Quality", q: "Vehicle fixed right the first time", score: 4.4 },
  { area: "Repair Quality", q: "Repair explained in plain language", score: 3.9 },
  { area: "Facility", q: "Lounge clean, stocked, comfortable", score: 4.1 },
  { area: "Facility", q: "Restrooms clean", score: 3.6 },
  { area: "Follow-up", q: "Post-visit call within 48 hours", score: 3.2 },
  { area: "Follow-up", q: "Concerns from prior visit acknowledged", score: 3.5 },
];

function tone(score: number) {
  if (score >= 4.3) return "text-success";
  if (score >= 3.8) return "text-warning-foreground";
  return "text-danger";
}

export function CsiAuditPanel({ dealer }: { dealer: Dealer }) {
  const overall = (CSI_QUESTIONS.reduce((s, q) => s + q.score, 0) / CSI_QUESTIONS.length).toFixed(2);
  const byArea = Array.from(new Set(CSI_QUESTIONS.map((q) => q.area)));
  return (
    <PanelShell title="CSI Audit" subtitle={`Last on-site audit · ${dealer.lastVisit}`}>
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="text-2xl font-semibold tabular-nums">{overall}</span>
            <span className="text-xs text-muted-foreground">/ 5.0 weighted</span>
          </div>
          <div className="text-[11px] text-muted-foreground">{CSI_QUESTIONS.length} items · {byArea.length} areas</div>
        </div>
      </div>
      <div className="space-y-4">
        {byArea.map((area) => (
          <div key={area} className="glass-card overflow-hidden">
            <div className="border-b border-white/50 bg-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {area}
            </div>
            <ul className="divide-y divide-white/50">
              {CSI_QUESTIONS.filter((q) => q.area === area).map((q) => (
                <li key={q.q} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span>{q.q}</span>
                  <span className={`font-semibold tabular-nums ${tone(q.score)}`}>{q.score.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

/* ---------- Franchise / Facility ---------- */
export function FranchisePanel({ dealer }: { dealer: Dealer }) {
  const rows = [
    ["Dealer code", dealer.id.replace("real-", "")],
    ["DBA", dealer.name],
    ["Address", `${dealer.city}, ${dealer.state}`],
    ["Region · District", `${dealer.region} · ${dealer.district}`],
    ["Size band", dealer.sizeBand],
    ["Franchise term", "Renewed Aug 2023 · Expires Aug 2028"],
    ["DOS (Dealer Operating Standard)", "92 / 100"],
    ["Showroom (sq ft)", "8,400"],
    ["Service bays", "14 (incl. 2 EV)"],
    ["EV charging", "2× L2 customer · 1× L3 prep bay"],
    ["Brand identity package", "MRA 3.0 — completed Q4 2024"],
  ];
  return (
    <PanelShell title="Franchise & Facility" subtitle="Agreement, footprint, brand-standard compliance">
      <div className="glass-card overflow-hidden">
        <dl className="divide-y divide-white/50">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="glass-card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Facility notes</div>
          <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
            {dealer.context.facilityNotes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Accessibility</div>
          <p className="mt-2 text-xs">{dealer.context.accessibility}</p>
        </div>
        <div className="glass-card p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Staffing</div>
          <p className="mt-2 text-xs">{dealer.context.staffingNotes}</p>
        </div>
      </div>
    </PanelShell>
  );
}

/* ---------- Attachments ---------- */
const FILES = [
  { name: "Q1-2025 KPI Action Plan.pdf", size: "412 KB", type: "PDF", date: "2025-04-12", by: "D. Reyes (DM)" },
  { name: "Facility walk photos.zip", size: "8.4 MB", type: "ZIP", date: "2025-03-28", by: "D. Reyes (DM)" },
  { name: "Service drive layout - revised.pdf", size: "1.1 MB", type: "PDF", date: "2025-03-15", by: "GM upload" },
  { name: "CSI verbatim export Mar.csv", size: "62 KB", type: "CSV", date: "2025-04-02", by: "System" },
  { name: "Spring promo creative.zip", size: "22.0 MB", type: "ZIP", date: "2025-04-21", by: "Marketing" },
];

export function AttachmentsPanel({ dealer }: { dealer: Dealer }) {
  return (
    <PanelShell title="Attachments" subtitle={`Files linked to ${dealer.name}`}>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">File</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Size</th>
              <th className="px-4 py-2 text-left">Uploaded</th>
              <th className="px-4 py-2 text-left">By</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/50">
            {FILES.map((f) => (
              <tr key={f.name}>
                <td className="px-4 py-2.5 font-medium">
                  <span className="inline-flex items-center gap-2"><Paperclip className="h-3.5 w-3.5 text-muted-foreground" />{f.name}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{f.type}</td>
                <td className="px-4 py-2.5 text-xs tabular-nums text-muted-foreground">{f.size}</td>
                <td className="px-4 py-2.5 text-xs tabular-nums">{f.date}</td>
                <td className="px-4 py-2.5 text-xs">{f.by}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="inline-flex gap-1.5 text-muted-foreground">
                    <button className="rounded-md border border-border p-1 hover:bg-accent" title="Preview"><Eye className="h-3.5 w-3.5" /></button>
                    <button className="rounded-md border border-border p-1 hover:bg-accent" title="Download"><Download className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PanelShell>
  );
}

/* ---------- Sign-Off ---------- */
const SIGNOFF = [
  { role: "District Manager", name: "Daniela Reyes", status: "signed", date: "2025-04-30 14:22" },
  { role: "General Manager", name: "Brent Holloway", status: "signed", date: "2025-04-30 16:05" },
  { role: "Service Manager", name: "Marcus Webb", status: "pending", date: null },
  { role: "Parts Manager", name: "Lisa Tran", status: "pending", date: null },
];

export function SignOffPanel({ dealer }: { dealer: Dealer }) {
  return (
    <PanelShell title="Contact Report Sign-Off" subtitle={`Visit on ${dealer.lastVisit}`}>
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-xs">
          <AlertCircle className="h-3.5 w-3.5 text-warning" />
          <span className="text-muted-foreground">Report locks 7 days after all parties sign. Parties acknowledge KPI plans and corrective actions discussed.</span>
        </div>
      </div>
      <div className="glass-card overflow-hidden">
        <ul className="divide-y divide-white/50">
          {SIGNOFF.map((s) => (
            <li key={s.role} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-[11px] text-muted-foreground">{s.role}</div>
              </div>
              {s.status === "signed" ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                    <CheckCircle2 className="h-3 w-3" /> Signed
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{s.date}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                  <button className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90">
                    <Pen className="h-3 w-3" /> Request signature
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-end gap-2">
        <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent">Export PDF</button>
        <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">Submit for sign-off</button>
      </div>
    </PanelShell>
  );
}
