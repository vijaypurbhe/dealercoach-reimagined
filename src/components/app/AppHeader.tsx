import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, ChevronDown, LayoutDashboard, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersona } from "@/lib/persona";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const PERSONAS = {
  dm: { name: "Sam Reynolds", initials: "SR", title: "District Manager · West-1" },
  exec: { name: "Alex Morgan", initials: "AM", title: "VP, Dealer Network · MMNA" },
};

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { persona, setPersona } = usePersona();
  const me = PERSONAS[persona];

  const navCls = (active: boolean) =>
    cn(
      "rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground",
      active ? "bg-accent text-foreground" : "text-muted-foreground",
    );

  const switchTo = (p: "dm" | "exec") => {
    setPersona(p);
    navigate(p === "exec" ? "/executive" : "/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-white/55 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to={persona === "exec" ? "/executive" : "/"} className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground shadow-[var(--shadow-elegant)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">MMNA AI Coach</span>
            <span className="text-[11px] text-muted-foreground">Dealer Performance Companion</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {persona === "exec" ? (
            <>
              <Link to="/executive" className={navCls(pathname === "/executive")}>Executive</Link>
              <Link to="/" className={navCls(pathname === "/")}>Portfolio</Link>
            </>
          ) : (
            <>
              <Link to="/" className={navCls(pathname === "/")}>Portfolio</Link>
              <Link to="/data" className={navCls(pathname === "/data")}>Data Sources</Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-accent">
              <div className="hidden text-right sm:block">
                <div className="font-medium leading-tight">{me.name}</div>
                <div className="text-xs text-muted-foreground leading-tight">{me.title}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {me.initials}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Switch persona
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => switchTo("dm")} className={cn("gap-2", persona === "dm" && "bg-accent")}>
                <Users className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">District Manager</span>
                  <span className="text-[11px] text-muted-foreground">Sam Reynolds · West-1</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchTo("exec")} className={cn("gap-2", persona === "exec" && "bg-accent")}>
                <LayoutDashboard className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">Executive (C-Suite)</span>
                  <span className="text-[11px] text-muted-foreground">VP, Dealer Network</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-muted-foreground">
                Demo only — switches the dashboard view
              </DropdownMenuLabel>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
