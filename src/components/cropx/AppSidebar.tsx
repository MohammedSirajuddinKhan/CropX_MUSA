import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

const NAV = [
  { to: "/console", label: "Scenario Simulator", key: "sim", primary: true },
  { to: "/console/monitor", label: "Risk Monitor", key: "monitor" },
  { to: "/console/signals", label: "Signal Stream", key: "signals" },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <Link
        to="/"
        className="flex h-12 items-center gap-2 border-b border-border px-4"
      >
        <span className="font-mono text-[15px] font-bold tracking-tight text-foreground">
          cropx
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fresh">
          beta
        </span>
      </Link>

      {/* Primary nav — v1 scope only */}
      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-4 pb-1 font-mono-t">Monitor</p>
        <ul className="ruled-rows">
          {NAV.map((item) => {
            const active =
              item.key === "sim"
                ? location.pathname === "/console"
                : location.pathname.startsWith(item.to);
            return (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center justify-between px-4 py-2 text-[13px] transition-colors hover:bg-sidebar-accent",
                    active &&
                      "bg-sidebar-accent font-medium text-foreground",
                  )}
                >
                  <span className={active ? "" : "text-secondary-foreground"}>
                    {item.label}
                  </span>
                  {active && (
                    <span aria-hidden className="font-mono text-[10px] text-fresh">
                      ●
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 px-4">
          <p className="font-mono-t">v1 scope</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Onion · Nashik + Maharashtra districts. Scenario simulator for FPOs —
            additional crops &amp; regions ship with the ML backend.
          </p>
        </div>
      </nav>

      {/* System status */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-fresh" />
            engine online
          </span>
          <span>v1.0</span>
        </div>
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>data sim-stream</span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-1 hover:text-foreground"
            title={user?.email ?? "Sign out"}
          >
            <LogOut className="size-3" /> exit
          </button>
        </div>
      </div>
    </aside>
  );
}
