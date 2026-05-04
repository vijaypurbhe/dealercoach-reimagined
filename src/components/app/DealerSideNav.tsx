import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BarChart3, ClipboardList, Tag, Star, Building, Paperclip, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";

export function DealerSideNav({ dealerId }: { dealerId: string }) {
  const { pathname } = useLocation();
  const items = [
    { label: "Dashboard", to: `/dealers/${dealerId}`, icon: LayoutDashboard, enabled: true },
    { label: "Parts Performance", to: `/dealers/${dealerId}#performance`, icon: BarChart3, enabled: true, hash: true },
    { label: "KPI Action Plans", to: `/dealers/${dealerId}/kpi-plans`, icon: ClipboardList, enabled: true },
    { label: "Programs / Promotions", to: "#", icon: Tag, enabled: false },
    { label: "CSI Audit", to: "#", icon: Star, enabled: false },
    { label: "Franchise / Facility", to: "#", icon: Building, enabled: false },
    { label: "Attachments", to: "#", icon: Paperclip, enabled: false },
    { label: "Sign-Off", to: "#", icon: FileSignature, enabled: false },
  ];
  return (
    <aside className="hidden lg:block sticky top-24 w-56 shrink-0 self-start">
      <div className="rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
        <div className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contact Report
        </div>
        <nav className="flex flex-col gap-0.5">
          {items.map((it) => {
            const active =
              it.enabled &&
              !it.hash &&
              (pathname === it.to || (it.label === "KPI Action Plans" && pathname.endsWith("/kpi-plans")));
            const Icon = it.icon;
            const inner = (
              <span
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : it.enabled
                      ? "text-foreground hover:bg-accent"
                      : "cursor-not-allowed text-muted-foreground/60",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="truncate">{it.label}</span>
                {!it.enabled && <span className="ml-auto text-[9px] uppercase opacity-70">soon</span>}
              </span>
            );
            return it.enabled ? (
              <Link key={it.label} to={it.to}>
                {inner}
              </Link>
            ) : (
              <div key={it.label}>{inner}</div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
