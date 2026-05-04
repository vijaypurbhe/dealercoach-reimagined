import { LayoutDashboard, BarChart3, ClipboardList, Tag, Star, Building, Paperclip, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DealerNavProps {
  active: string;
  onSelect: (tab: string) => void;
}

const items: { value: string; label: string; icon: any; enabled: boolean }[] = [
  { value: "overview", label: "Dashboard", icon: LayoutDashboard, enabled: true },
  { value: "performance", label: "Parts Performance", icon: BarChart3, enabled: true },
  { value: "kpi-plans", label: "KPI Action Plans", icon: ClipboardList, enabled: true },
  { value: "kpis", label: "KPI Trends", icon: BarChart3, enabled: true },
  { value: "actions", label: "Actions History", icon: ClipboardList, enabled: true },
  { value: "context", label: "Context", icon: Building, enabled: true },
  { value: "_programs", label: "Programs / Promotions", icon: Tag, enabled: false },
  { value: "_csi", label: "CSI Audit", icon: Star, enabled: false },
  { value: "_franchise", label: "Franchise / Facility", icon: Building, enabled: false },
  { value: "_attach", label: "Attachments", icon: Paperclip, enabled: false },
  { value: "_signoff", label: "Sign-Off", icon: FileSignature, enabled: false },
];

export function DealerSideNav({ active, onSelect }: DealerNavProps) {
  return (
    <aside className="hidden lg:block sticky top-[260px] w-56 shrink-0 self-start">
      <div className="rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
        <div className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contact Report
        </div>
        <nav className="flex flex-col gap-0.5">
          {items.map((it) => {
            const isActive = it.enabled && active === it.value;
            const Icon = it.icon;
            const cls = cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : it.enabled
                  ? "text-foreground hover:bg-accent"
                  : "cursor-not-allowed text-muted-foreground/60",
            );
            return (
              <button
                key={it.value}
                type="button"
                disabled={!it.enabled}
                onClick={() => it.enabled && onSelect(it.value)}
                className={cls}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="truncate">{it.label}</span>
                {!it.enabled && <span className="ml-auto text-[9px] uppercase opacity-70">soon</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
