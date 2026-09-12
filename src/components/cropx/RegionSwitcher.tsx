import { useMemo } from "react";
import { useConsole } from "./console-state";
import { cn } from "@/lib/utils";
import { runEngine } from "@/lib/cropx/engine";
import { SEASON_STATES, CROPS } from "@/lib/cropx/dataset";

/**
 * Compact district switcher — selects the monitored region and resets
 * scenario state. Shows each district's baseline risk at a glance.
 */
export function RegionSwitcher() {
  const { regions, bundle, setRegion } = useConsole();

  // Baseline risk per district, computed once from the seeded dataset.
  const risks = useMemo(() => {
    const crop = CROPS[0];
    const map: Record<string, number> = {};
    for (const r of regions) {
      const season = SEASON_STATES[r.id];
      if (!season) continue;
      map[r.id] = runEngine({
        regionId: r.id,
        crop,
        season,
        signals: [],
      }).risk.glutRisk;
    }
    return map;
  }, [regions]);

  return (
    <div className="flex flex-wrap items-center gap-1 border border-border bg-card p-1">
      <span className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        districts
      </span>
      {regions.map((r) => {
        const active = r.id === bundle.region.id;
        const risk = risks[r.id];
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => setRegion(r.id)}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1 font-mono text-[11.5px] transition-colors",
              active
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {r.name}
            <span
              className={cn(
                "tabular-nums",
                risk === undefined
                  ? "text-muted-foreground/60"
                  : risk >= 65
                    ? "text-risk-high"
                    : risk >= 40
                      ? "text-risk-medium"
                      : "text-risk-low",
              )}
            >
              {risk === undefined ? "—" : `${risk}%`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
