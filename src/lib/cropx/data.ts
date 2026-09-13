import type {
  Crop,
  DataQuality,
  ForecastPoint,
  Region,
  RegionBundle,
  Recommendation,
  RiskAssessment,
  ScenarioResult,
  SeasonState,
  Signal,
} from "./types";
import { runEngine } from "./engine";
import {
  buildDataQuality,
  buildDistrictRiskRows,
  buildForecast,
  buildSignals,
  CROPS,
  DISTRICT_COUNT,
  EXCLUDED_DISTRICTS,
  REGION_ORDER,
  REGIONS,
  SEASON_STATES,
  VILLAGE_COUNT,
} from "./dataset";

/**
 * CropX data adapter.
 *
 * v1 ships a mock adapter backed by seeded demo data. Components call
 * `cropxApi.*` exactly as they would call a REST client; swapping in the real
 * backend means replacing the method bodies with fetch() calls to:
 *
 *   GET  /api/regions
 *   GET  /api/crops
 *   GET  /api/regions/:regionId/risk
 *   GET  /api/regions/:regionId/forecast
 *   GET  /api/regions/:regionId/signals
 *   GET  /api/regions/:regionId/drivers
 *   POST /api/scenarios
 *   POST /api/signals
 *   GET  /api/data-quality
 *
 * v1.1 hardening: the adapter is now PURE — no hidden mutable stream state.
 * All dynamic inputs (injected reports, coverage deltas) are passed in
 * explicitly, which makes the engine deterministic per render and safe under
 * React StrictMode double-renders. The old singleton-mutation design could
 * desync UI state from data state.
 */

export interface ScenarioInput {
  plantingDeltaPct: number;
  capacityDeltaPct?: number;
}

/** Max simulated reports held in the live stream (memory bound). */
export const MAX_STREAM_SIGNALS = 60;

class CropxApi {
  /** Engine-computed baseline risk per district, cached once. */
  private districtRiskCache: Map<string, RiskAssessment> = new Map();
  private districtRowsCache: ReturnType<typeof buildDistrictRiskRows> | null = null;
  private qualityCache: DataQuality | null = null;

  listRegions(): Region[] {
    return REGIONS;
  }

  regionOrder(): string[] {
    return REGION_ORDER;
  }

  listCrops(): Crop[] {
    return CROPS;
  }

  getRegion(regionId: string): Region {
    // Fallback keeps the UI alive if an unknown id slips in (stored state etc).
    return (
      REGIONS.find((r) => r.id === regionId) ??
      REGIONS[0]
    );
  }

  hasRegion(regionId: string): boolean {
    return REGIONS.some((r) => r.id === regionId);
  }

  getSeason(regionId: string): SeasonState {
    return (
      SEASON_STATES[regionId] ??
      SEASON_STATES[REGION_ORDER[0]] ??
      SEASON_STATES[REGIONS[0].id]
    );
  }

  getBundle(regionId: string, opts?: { signalCoverage?: number; reportCount?: number }): RegionBundle {
    const region = this.getRegion(regionId);
    const crop = CROPS[0]; // v1: onion
    const seasonSeed = this.getSeason(region.id);
    const season: SeasonState = {
      ...seasonSeed,
      signalCoverage:
        opts?.signalCoverage !== undefined
          ? Math.min(92, Math.max(0, opts.signalCoverage))
          : seasonSeed.signalCoverage,
      reportCount:
        opts?.reportCount !== undefined
          ? Math.max(0, Math.round(opts.reportCount))
          : seasonSeed.reportCount,
    };
    const signals = buildSignals(region.id);
    return {
      region,
      crop,
      season,
      signals,
      risk: runEngine({ regionId: region.id, crop, season, signals }).risk,
      forecast: buildForecast(region.id),
      quality: this.getDataQuality(),
    };
  }

  runScenario(
    regionId: string,
    input: ScenarioInput,
    opts?: { signalCoverage?: number; reportCount?: number },
  ): ScenarioResult | null {
    if (!this.hasRegion(regionId)) return null;
    const season = this.getSeason(regionId);
    const effective: SeasonState = {
      ...season,
      signalCoverage:
        opts?.signalCoverage !== undefined
          ? Math.min(92, Math.max(0, opts.signalCoverage))
          : season.signalCoverage,
      reportCount:
        opts?.reportCount !== undefined
          ? Math.max(0, Math.round(opts.reportCount))
          : season.reportCount,
    };
    return runEngine({
      regionId,
      crop: CROPS[0],
      season: effective,
      signals: buildSignals(regionId),
      plantingDeltaPct: input.plantingDeltaPct,
      capacityDeltaPct: input.capacityDeltaPct,
    });
  }

  /** Engine-computed baseline risk for one district (cached). */
  getDistrictRisk(regionId: string): RiskAssessment | null {
    if (!this.hasRegion(regionId)) return null;
    const cached = this.districtRiskCache.get(regionId);
    if (cached) return cached;
    const risk = runEngine({
      regionId,
      crop: CROPS[0],
      season: this.getSeason(regionId),
      signals: [],
    }).risk;
    this.districtRiskCache.set(regionId, risk);
    return risk;
  }

  /** All districts with engine-computed baseline risk, hero districts first. */
  getDistrictRiskRows(): ReturnType<typeof buildDistrictRiskRows> {
    if (!this.districtRowsCache) {
      this.districtRowsCache = buildDistrictRiskRows().sort((a, b) => {
        const ai = REGION_ORDER.indexOf(a.region.id);
        const bi = REGION_ORDER.indexOf(b.region.id);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
    }
    return this.districtRowsCache;
  }

  /**
   * New reports arriving as a stream batch. PURE: returns the merged list,
   * clamped to MAX_STREAM_SIGNALS; caller owns the state.
   */
  mergeSignals(current: Signal[], regionId: string, n: number): Signal[] {
    const safeN = Math.min(500, Math.max(1, Math.round(n)));
    const now = Date.now();
    const region = this.getRegion(regionId);
    const injected: Signal[] = [];
    for (let i = 1; i <= safeN; i++) {
      const village = region.villages[i % region.villages.length];
      injected.push({
        id: `${regionId}-inj-${now}-${i}`,
        regionId,
        cropId: "onion",
        kind: i % 3 === 0 ? "survey" : "fpo",
        org: i % 3 === 0 ? "Demo-injected survey batch" : `${village.name} demo-injected report`,
        village: village.name,
        areaHa: Math.round(region.areaHa * 0.004),
        minutesAgo: 0,
        receivedAt: now,
        simulated: true,
      });
    }
    return [...injected, ...current].slice(0, MAX_STREAM_SIGNALS);
  }

  /**
   * Coverage response to `n` injected reports, from the district's seed
   * coverage. Deterministic and bounded — no cumulative drift.
   */
  coverageAfterInject(regionId: string, n: number): number {
    const base = this.getSeason(regionId).signalCoverage;
    const safeN = Math.min(500, Math.max(0, Math.round(n)));
    // +4pp per 100 reports (bounded to +25pp), saturating at 92 —
    // deterministic and monotonic, matching real survey coverage response.
    const gain = Math.min(25, safeN * 0.04);
    return Math.min(92, Math.round(base + gain));
  }

  getDataQuality(): DataQuality {
    if (!this.qualityCache) this.qualityCache = buildDataQuality();
    return this.qualityCache;
  }

  getForecast(
    regionId: string,
    opts?: { productionScale?: number; capacityScale?: number },
  ): ForecastPoint[] {
    return buildForecast(regionId, opts);
  }

  getRecommendation(risk: RiskAssessment, regionName: string): Recommendation {
    const gapPct = risk.oversupplyGapPct;
    const priority: Recommendation["priority"] =
      risk.band === "critical" || risk.band === "high"
        ? "high"
        : risk.band === "medium"
          ? "medium"
          : "low";
    return {
      priority,
      headline:
        gapPct > 8
          ? `Concentration risk in onion across ${regionName} — projected arrivals exceed absorption capacity`
          : "Projected arrivals within market absorption tolerance",
      reason:
        gapPct > 8
          ? `Oversupply gap ≈ ${gapPct.toFixed(0)}% of absorption capacity; historical tolerance ≈ 5%.`
          : "Arrivals projected to stay within historical absorption tolerance (±5%).",
      audience: gapPct > 8 ? "FPO + buyers" : "all",
      actions:
        gapPct > 8
          ? [
              "Hold additional onion planting at current area; shift marginal plots to lower-risk crops.",
              "Stagger harvest windows across member plots to flatten the arrivals curve.",
              "Pre-book storage capacity before the harvest window opens.",
            ]
          : [
              "Maintain current planting plan.",
              "Monitor the weekly signal stream for direction changes.",
            ],
    };
  }

  /** Counts surfaced in the honesty strip / sidebar scope note. */
  getStats(): { districts: number; villages: number; excluded: string[] } {
    return {
      districts: DISTRICT_COUNT,
      villages: VILLAGE_COUNT,
      excluded: EXCLUDED_DISTRICTS.map((d) => d.name),
    };
  }
}

export const cropxApi = new CropxApi();
