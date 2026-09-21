import { useEffect, useState, Suspense, lazy } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/i18n";
import { ThemeToggle, LanguageToggle } from "@/components/cropx/Controls";
import { DATA_REFRESHED_EVENT } from "@/components/cropx/LiveRefresh";
import { CLERK_ENABLED } from "@/lib/clerk-config";
import { VERCEL_DEPLOY_LABEL, VERCEL_ENV, VERCEL_GIT_COMMIT_SHA, VERCEL_REGION, VERCEL_ENV_LABEL } from "@/lib/vercel-config";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

/** Clerk-only UI, code-split so it never loads in the default build. */
const ClerkIdentity = lazy(
  () => import("@/components/cropx/ClerkSignInPanel").then((m) => ({ default: m.ClerkIdentity })),
);

const NAV = [
  { to: "/console", labelKey: "nav.simulator", key: "sim", primary: true },
  { to: "/console/monitor", labelKey: "nav.monitor", key: "monitor" },
  { to: "/console/signals", labelKey: "nav.signals", key: "signals" },
] as const;

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t, lang } = useLang();

  // "Live data synced HH:MM" — updates when LiveRefresh completes a pass.
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  useEffect(() => {
    const mark = () => setSyncedAt(Date.now());
    window.addEventListener(DATA_REFRESHED_EVENT, mark);
    return () => window.removeEventListener(DATA_REFRESHED_EVENT, mark);
  }, []);

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
        <p className="px-4 pb-1 font-mono-t">{t("nav.monitorGroup")}</p>
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
                    active && "bg-sidebar-accent font-medium text-foreground",
                  )}
                >
                  <span className={active ? "" : "text-secondary-foreground"}>
                    {t(item.labelKey)}
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
          <p className="font-mono-t">{t("nav.scopeTitle")}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {t("nav.scopeBody")}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 px-4">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </nav>

      {/* System status */}
      <div className="border-t border-border px-4 py-3">
        {CLERK_ENABLED && (
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/60 pb-2">
            <Suspense fallback={null}>
              <ClerkIdentity />
            </Suspense>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fresh">
              {t("nav.clerkSession")}
            </span>
            <Suspense fallback={null}>
              <ClerkUserButtonBox />
            </Suspense>
          </div>
        )}
        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-fresh" />
            {t("nav.engineOnline")}
          </span>
          <span>v1.0</span>
        </div>
        {/* Deploy status — Vercel-injected build metadata (absent when self-hosted) */}
        {VERCEL_DEPLOY_LABEL && (
          <div
            className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground"
            title={`${t("infra.commit", { sha: VERCEL_GIT_COMMIT_SHA.slice(0, 7) })}${VERCEL_REGION ? ` · ${t("infra.region", { region: VERCEL_REGION })}` : ""}`}
          >
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-1.5 bg-fresh" aria-hidden />
              {t("infra.deploy")} · {VERCEL_ENV_LABEL[VERCEL_ENV] ?? (VERCEL_ENV || "—")}
            </span>
            <span className="max-w-[92px] truncate" title={VERCEL_DEPLOY_LABEL}>
              {VERCEL_DEPLOY_LABEL}
            </span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 bg-fresh" aria-hidden />
            {t("nav.liveSync")}
            {syncedAt && (
              <span className="tabular-nums">
                {new Date(syncedAt).toLocaleTimeString(
                  lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN",
                  { hour: "2-digit", minute: "2-digit" },
                )}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-1 hover:text-foreground"
            title={user?.email ?? t("nav.exit")}
          >
            <LogOut className="size-3" /> {t("nav.exit")}
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Clerk <UserButton /> in a Suspense boundary (Clerk build only). */
function ClerkUserButtonBox() {
  return (
    <Suspense fallback={null}>
      <ClerkUserButtonLazy />
    </Suspense>
  );
}

const ClerkUserButtonLazy = lazy(() =>
  import("@clerk/clerk-react").then((m) => ({ default: m.UserButton })),
);
