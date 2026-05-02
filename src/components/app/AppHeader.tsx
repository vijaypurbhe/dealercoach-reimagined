import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { pathname } = useLocation();
  const navCls = (active: boolean) =>
    cn(
      "rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground",
      active ? "bg-accent text-foreground" : "text-muted-foreground",
    );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
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
          <Link to="/" className={navCls(pathname === "/")}>
            Portfolio
          </Link>
          <Link to="/data" className={navCls(pathname === "/data")}>
            Data Sources
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <div className="hidden text-right sm:block">
            <div className="font-medium">Sam Reynolds</div>
            <div className="text-xs text-muted-foreground">District Manager · West-1</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
            SR
          </div>
        </div>
      </div>
    </header>
  );
}
