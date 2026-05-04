import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Dealer } from "@/data/types";
import { getRealCode, getRealKpiPlans, type RealKpiPlan } from "@/data/realDealers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const KPI_OPTIONS = [
  "CSI",
  "Part Sales",
  "Accessory Sales",
  "CPRO Count",
  "PART CPRO",
  "1 Year Retention",
  "Other",
];

export function KpiActionPlansPanel({ dealer }: { dealer: Dealer }) {
  const realCode = getRealCode(dealer);
  const seedPlans = useMemo<RealKpiPlan[]>(
    () => (realCode ? getRealKpiPlans(realCode) : []),
    [realCode],
  );
  const [drafts, setDrafts] = useState<RealKpiPlan[]>([]);
  const [kpi, setKpi] = useState<string>("");
  const [rootCause, setRootCause] = useState("");
  const [action, setAction] = useState("");
  const [expected, setExpected] = useState("");

  const allPlans = [...drafts, ...seedPlans];

  const submit = () => {
    if (!kpi || !rootCause.trim()) return;
    const today = new Date();
    const draft: RealKpiPlan = {
      dlr_cd: realCode ?? dealer.id,
      contact_yyyymm: Number(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`),
      contact_date: today.toISOString().slice(0, 10),
      kpi_type: kpi,
      root_cause: rootCause,
      corrective_action: action,
      expected_result: expected,
      isKpiMet: "N",
    };
    setDrafts((d) => [draft, ...d]);
    setKpi("");
    setRootCause("");
    setAction("");
    setExpected("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">KPI Improvement Action Plans</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Capture root cause, corrective action, and expected outcome for each KPI needing attention.
        </p>
      </div>
      {!realCode && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          This dealer is using sample data. Action plans you add here are local to this demo session.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            KPI Needing Attention
          </span>
          <Select value={kpi} onValueChange={setKpi}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select KPI…" />
            </SelectTrigger>
            <SelectContent>
              {KPI_OPTIONS.map((k) => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Root Cause for Performance" value={rootCause} onChange={setRootCause} />
          <FormField label="Corrective Action" value={action} onChange={setAction} />
          <FormField label="Expected Results & Timeline" value={expected} onChange={setExpected} />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={submit}
            disabled={!kpi || !rootCause.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Save action plan
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">KPI Type</th>
              <th className="px-3 py-2 font-medium">Contact Date</th>
              <th className="px-3 py-2 font-medium">Month</th>
              <th className="px-3 py-2 font-medium">Root Cause</th>
              <th className="px-3 py-2 font-medium">Corrective Action</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {allPlans.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">
                  No action plans yet for this dealer.
                </td>
              </tr>
            )}
            {allPlans.map((p, i) => (
              <tr key={i} className="border-b border-border last:border-0 align-top hover:bg-accent/30">
                <td className="px-3 py-2 font-medium">{p.kpi_type}</td>
                <td className="px-3 py-2 text-muted-foreground tabular-nums">{p.contact_date}</td>
                <td className="px-3 py-2 text-muted-foreground tabular-nums">{p.contact_yyyymm}</td>
                <td className="max-w-[280px] px-3 py-2 text-xs text-foreground">
                  <Truncated text={p.root_cause} />
                </td>
                <td className="max-w-[280px] px-3 py-2 text-xs text-foreground">
                  <Truncated text={p.corrective_action} />
                </td>
                <td className="px-3 py-2"><StatusPill met={p.isKpiMet} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-primary">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full resize-y rounded-md border border-border bg-background px-2.5 py-1.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </label>
  );
}

function Truncated({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span className="text-muted-foreground">—</span>;
  if (text.length <= 140) return <span>{text}</span>;
  return (
    <span>
      {open ? text : text.slice(0, 140) + "…"}{" "}
      <button onClick={() => setOpen((v) => !v)} className="text-primary hover:underline">
        {open ? "less" : "more"}
      </button>
    </span>
  );
}

function StatusPill({ met }: { met: string }) {
  const tone =
    met === "Y"
      ? { cls: "bg-success/15 text-success", Icon: CheckCircle2, label: "Met" }
      : met === "N"
        ? { cls: "bg-warning/20 text-warning-foreground", Icon: Clock, label: "In progress" }
        : { cls: "bg-danger/15 text-danger", Icon: XCircle, label: "Not met" };
  const Icon = tone.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", tone.cls)}>
      <Icon className="h-3 w-3" /> {tone.label}
    </span>
  );
}
