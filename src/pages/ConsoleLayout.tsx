import { Outlet } from "react-router";
import { AppSidebar } from "@/components/cropx/AppSidebar";
import { TopBar } from "@/components/cropx/TopBar";
import { ConsoleProvider, useConsole } from "@/components/cropx/console-state";
import { useLang } from "@/i18n";

function TopBarBridge() {
  const { bundle, scenario } = useConsole();
  const { t } = useLang();
  return (
    <TopBar
      region={bundle.region}
      crop={bundle.crop}
      horizon={t("top.weeks", { n: scenario.risk.weeksToHarvest })}
      updated={bundle.quality.lastUpdatedLabel}
      coverage={bundle.season.signalCoverage}
    />
  );
}

/**
 * Console shell. ConsoleProvider owns region/scenario state so all three
 * routes share one session state.
 */
export default function ConsoleLayout() {
  return (
    <ConsoleProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBarBridge />
          <main className="min-h-0 flex-1 overflow-y-auto bg-term-grid p-4">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ConsoleProvider>
  );
}