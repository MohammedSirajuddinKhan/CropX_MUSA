import type {
  Crop,
  DataQuality,
  ForecastPoint,
  Recommendation,
  Region,
  RegionBundle,
  RiskAssessment,
  SeasonState,
  Signal,
} from "./types";
import type { ScenarioResult } from "./types";
import { runEngine } from "./engine";
import {
  buildForecast,
  buildSignals,
  CROPS,
  DATA_QUALITY,
  REGIONS,
  SEASON_STATES,
  signalCount,
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
 */

export interface ScenarioInput {
  plantingDeltaPct: number;
  capacityDeltaPct?: number;
}

class CropxApi {
  private signals: Signal[] = [];
  private signalTotal = signalCount("nashik");
  private coverage = 67;
  private regionId = "nashik";

  constructor() {
    this.signals = buildSignals("nashik");
  }

  listRegions(): Region[] {
    return REGIONS;
  }

  listCrops(): Crop[] {
    return CROPS;
  }

  setRegion(regionId: string): void {
    if (!REGIONS.some((r) => r.id === regionId)) return;
    this.regionId = regionId;
    this.signals = buildSignals(regionId);
    const seed = { nashik: 1284, pune: 902, ahmednagar: 771, solapur: 486, satara: 318 }[
      regionId
    ];
    this.signalTotal = seed ?? 300;
    this.coverage = SEASON_STATES[regionId]?.signalCoverage ?? 50;
  }

  getRegion(): Region {
    return REGIONS.find((r) => r.id === this.regionId) ?? REGIONS[0];
  }

  getBundle(regionId?: string): RegionBundle {
    if (regionId) this.setRegion(regionId);
    const region = this.getRegion();
    const crop = CROPS[0]; // v1: onion only
    const season = SEASON_STATES[region.id];
    const signals = this.signals;
    return {
      region,
      crop,
      season,
      signals,
      risk: runEngine({ regionId: region.id, crop, season, signals }).risk,
      forecast: buildForecast(region.id),
      quality: DATA_QUALITY,
    };
  }

  runScenario(input: ScenarioInput): ScenarioResult | null {
    const region = this.getRegion();
    const crop = CROPS[0];
    const season = SEASON_STATES[region.id];
    if (!region || !season) return null;
    return runEngine({
      regionId: region.id,
      crop,
      season,
      signals: this.signals,
      plantingDeltaPct: input.plantingDeltaPct,
      capacityDeltaPct: input.capacityDeltaPct,
    });
  }

  /** Simulate a batch of incoming signal reports (hackathon demo hook). */
  injectSignals(n: number, seasonState: SeasonState): void {
    this.signalTotal += n;
    const region = this.getRegion();
    const now = Date.now();
    // Each injected report covers a small slice of the monitored area.
    const areaPerReport = Math.round(seasonState.plantingAreaHa * 0.004);
    for (let i = 1; i <= n; i++) {
      this.signals.unshift({
        id: `${region.id}-inj-${this.signalTotal}-${i}`,
        regionId: region.id,
        cropId: "onion",
        kind: "fpo",
        org: "Demo-injected report",
        village: "field batch",
        areaHa: areaPerReport,
        minutesAgo: 0,
        receivedAt: now,
        simulated: true,
      });
    }
    // Coverage nudges up with more reports, capped at 92%.
    this.coverage = Math.min(92, this.coverage + n * 0.25);
  }

  getSignalSummary(): { count: number; coverage: number } {
    return { count: this.signalTotal, coverage: Math.round(this.coverage) };
  }

  getDataQuality(): DataQuality {
    return DATA_QUALITY;
  }

  getForecast(): ForecastPoint[] {
    return buildForecast(this.regionId);
  }

  getRecommendation(risk: RiskAssessment): Recommendation {
    const gapPct = risk.oversupplyGapPct;
    const priority: Recommendation["priority"] =
      risk.band === "critical" || risk.band === "high"
        ? "high"
        : risk.band === "medium"
          ? "medium"
          : "low";
    const regionName = REGIONS.find((r) => r.id === this.regionId)?.name ?? this.regionId;
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
}

export const cropxApi = new CropxApi();
