import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cropxApi, MAX_STREAM_SIGNALS } from "@/lib/cropx/data";
import { runEngine } from "@/lib/cropx/engine";
import type {
  RegionBundle,
  ScenarioResult,
  SeasonState,
  Signal,
} from "@/lib/cropx/types";

/**
 * Console state — single source of truth for the session:
 * selected region, scenario levers, and injected signal batch.
 * All derived values (risk, drivers, supply) recompute from the engine,
 * mirroring POST /api/scenarios semantics.
 *
 * v1.1 hardening:
 *  - All state is pure React state (no adapter-side mutation), so renders are
 *    deterministic and StrictMode-safe.
 *  - Region + levers persist to localStorage and are validated on restore
 *    (unknown regions fall back to the hero district; out-of-range levers
 *    clamp back into bounds).
 */

const STORAGE_KEY = "cropx.session.v1";
const MAX_PLANTING_DELTA = 60;
const MAX_CAPACITY_DELTA = 30;
const MAX_INJECTED = 500;

interface PersistedSession {
  regionId: string;
  plantingDeltaPct: number;
  capacityDeltaPct: number;
  injectedReports: number;
}

function clampNum(n: unknown, fallback: number, lo: number, hi: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(hi, Math.max(lo, v));
}

function loadSession(): PersistedSession {
  const fallback: PersistedSession = {
    regionId: "nashik",
    plantingDeltaPct: 0,
    capacityDeltaPct: 0,
    injectedReports: 0,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    return {
      // Validation: unknown/stale region ids fall back to the hero district.
      regionId: cropxApi.hasRegion(parsed.regionId ?? "")
        ? (parsed.regionId as string)
        : fallback.regionId,
      plantingDeltaPct: clampNum(parsed.plantingDeltaPct, 0, -50, MAX_PLANTING_DELTA),
      capacityDeltaPct: clampNum(parsed.capacityDeltaPct, 0, -30, MAX_CAPACITY_DELTA),
      injectedReports: clampNum(parsed.injectedReports, 0, 0, MAX_INJECTED),
    };
  } catch {
    return fallback;
  }
}

interface ConsoleState {
  bundle: RegionBundle;
  regions: ReturnType<typeof cropxApi.listRegions>;
  districtRows: ReturnType<typeof cropxApi.getDistrictRiskRows>;
  effectiveSeason: SeasonState;
  baseline: ScenarioResult;
  scenario: ScenarioResult;
  plantingDeltaPct: number;
  capacityDeltaPct: number;
  signalCount: number;
  injectedReports: number;
  streamSignals: Signal[];
  setPlantingDelta: (v: number) => void;
  setCapacityDelta: (v: number) => void;
  setRegion: (id: string) => void;
  injectSignals: (n: number) => void;
}

const Ctx = createContext<ConsoleState | null>(null);

export function ConsoleProvider({ children }: { children: ReactNode }) {
  // Persisted session is restored lazily, once, on first mount.
  const [session] = useState(loadSession);
  const [regionId, setRegionId] = useState(session.regionId);
  const [plantingDeltaPct, setPlantingDeltaPct] = useState(session.plantingDeltaPct);
  const [capacityDeltaPct, setCapacityDeltaPct] = useState(session.capacityDeltaPct);
  const [injectedReports, setInjectedReports] = useState(session.injectedReports);
  const [streamSignals, setStreamSignals] = useState<Signal[]>([]);

  const setRegion = useCallback((id: string) => {
    // Ignore no-op or unknown ids rather than silently switching to fallback.
    if (!cropxApi.hasRegion(id)) return;
    setRegionId(id);
    setPlantingDeltaPct(0);
    setCapacityDeltaPct(0);
    setInjectedReports(0);
    setStreamSignals([]);
  }, []);

  const setPlantingDelta = useCallback((v: number) => {
    setPlantingDeltaPct(clampNum(v, 0, -50, MAX_PLANTING_DELTA));
  }, []);

  const setCapacityDelta = useCallback((v: number) => {
    setCapacityDeltaPct(clampNum(v, 0, -30, MAX_CAPACITY_DELTA));
  }, []);

  const injectSignals = useCallback(
    (n: number) => {
      const safeN = Math.min(500, Math.max(1, Math.round(n)));
      setInjectedReports((prev) => Math.min(MAX_INJECTED, prev + safeN));
      setStreamSignals((prev) =>
        cropxApi.mergeSignals(prev, regionId, safeN).slice(0, MAX_STREAM_SIGNALS),
      );
    },
    [regionId],
  );

  const value = useMemo<ConsoleState>(() => {
    const bundle = cropxApi.getBundle(regionId, {
      // Deterministic coverage response to the injected batch (no drift).
      signalCoverage: cropxApi.coverageAfterInject(regionId, injectedReports),
      reportCount:
        cropxApi.getSeason(regionId).reportCount + injectedReports,
    });
    const regions = cropxApi.listRegions();
    const districtRows = cropxApi.getDistrictRiskRows();

    // Stream + seeded signal batches, newest first.
    const signals = [...streamSignals, ...bundle.signals];

    const engineBase = {
      regionId: bundle.region.id,
      crop: bundle.crop,
      season: bundle.season,
      signals,
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
      bundle: { ...bundle, signals },
      regions,
      districtRows,
      effectiveSeason: bundle.season,
      baseline,
      scenario,
      plantingDeltaPct,
      capacityDeltaPct,
      signalCount: bundle.season.reportCount,
      injectedReports,
      streamSignals,
      setPlantingDelta,
      setCapacityDelta,
      setRegion,
      injectSignals,
    };
  }, [
    regionId,
    plantingDeltaPct,
    capacityDeltaPct,
    injectedReports,
    streamSignals,
    setPlantingDelta,
    setCapacityDelta,
    setRegion,
    injectSignals,
  ]);

  // Persist after commit — render stays pure, and slider drags don't
  // trigger synchronous storage writes on every animation frame.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          regionId,
          plantingDeltaPct,
          capacityDeltaPct,
          injectedReports,
        } satisfies PersistedSession),
      );
    } catch {
      /* storage unavailable (private mode etc.) — session simply won't persist */
    }
  }, [regionId, plantingDeltaPct, capacityDeltaPct, injectedReports]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsole(): ConsoleState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConsole must be used within ConsoleProvider");
  return ctx;
}
