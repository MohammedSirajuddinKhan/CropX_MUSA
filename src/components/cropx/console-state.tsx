import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cropxApi } from "@/lib/cropx/data";
import { runEngine } from "@/lib/cropx/engine";
import type { RegionBundle, ScenarioResult, SeasonState } from "@/lib/cropx/types";

/**
 * Console state — single source of truth for the session:
 * selected region, scenario levers, and injected signal stream.
 * All derived values (risk, drivers, supply) recompute from the engine,
 * mirroring POST /api/scenarios semantics.
 */

interface ConsoleState {
  bundle: RegionBundle;
  regions: ReturnType<typeof cropxApi.listRegions>;
  effectiveSeason: SeasonState;
  baseline: ScenarioResult;
  scenario: ScenarioResult;
  plantingDeltaPct: number;
  capacityDeltaPct: number;
  signalCount: number;
  setPlantingDelta: (v: number) => void;
  setCapacityDelta: (v: number) => void;
  setRegion: (id: string) => void;
  injectSignals: (n: number) => void;
}

const Ctx = createContext<ConsoleState | null>(null);

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [regionId, setRegionId] = useState("nashik");
  const [plantingDeltaPct, setPlantingDeltaPct] = useState(0);
  const [capacityDeltaPct, setCapacityDeltaPct] = useState(0);
  const [injected, setInjected] = useState(0);

  const value = useMemo<ConsoleState>(() => {
    const bundle = cropxApi.getBundle(regionId);
    const regions = cropxApi.listRegions();
    const summary = cropxApi.getSignalSummary();

    // Signal injections raise coverage (capped) — confidence widens/narrows
    // the uncertainty band accordingly, exactly like a live stream would.
    const effectiveSeason: SeasonState = {
      ...bundle.season,
      signalCoverage: Math.min(92, bundle.season.signalCoverage + injected * 0.25),
    };

    const engineBase = {
      regionId: bundle.region.id,
      crop: bundle.crop,
      season: effectiveSeason,
      signals: bundle.signals,
    };

    const baseline = runEngine(engineBase);
    const scenario =
      plantingDeltaPct === 0 && capacityDeltaPct === 0
        ? baseline
        : runEngine({
            ...engineBase,
            plantingDeltaPct,
            capacityDeltaPct,
          });

    return {
      bundle,
      regions,
      effectiveSeason,
      baseline,
      scenario,
      plantingDeltaPct,
      capacityDeltaPct,
      // Adapter already tracks injected reports; `injected` only drives coverage.
      signalCount: summary.count,
      setPlantingDelta: setPlantingDeltaPct,
      setCapacityDelta: setCapacityDeltaPct,
      setRegion: (id: string) => {
        setRegionId(id);
        setPlantingDeltaPct(0);
        setCapacityDeltaPct(0);
        setInjected(0);
      },
      injectSignals: (n: number) => {
        cropxApi.injectSignals(n, bundle.season);
        setInjected((prev) => prev + n);
      },
    };
  }, [regionId, plantingDeltaPct, capacityDeltaPct, injected]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsole(): ConsoleState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConsole must be used within ConsoleProvider");
  return ctx;
}
