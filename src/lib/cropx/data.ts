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
  buildCropRiskRows,
  buildDistrictRiskRows,
  buildForecast,
  buildSignals,
  buildVillages,
  CROPS,
  DISTRICT_COUNT,
  EXCLUDED_DISTRICTS,
  HERO_CROP_ID,
  REGION_ORDER,
  REGIONS,
  SEASON_STATES,
  VILLAGE_COUNT,
} from "./dataset";
import { cropById } from "./crops";

/**
 * CropX data adapter — the ONLY module components import for data.
 *
 * Mock surface mirroring the future REST contract:
 *
 *   GET  /api/regions                       → listRegions()
 *   GET  /api/crops                         → listCrops()
 *   GET  /api/regions/:id/risk?crop=c       → getDistrictRisk / runScenario
 *   GET  /api/regions/:id/forecast?crop=c   → getForecast
 *   POST /api/scenarios                     → runScenario
 *   POST /api/signals                       → mergeSignals
 *   GET  /api/data-quality                  → getDataQuality
 *
 * Reliability contract: no hidden mutable state, unknown ids fall back to
 * the hero cell instead of crashing, inputs clamped, caches keyed properly.
 */

export interface ScenarioInput {
  plantingDeltaPct: number;
  capacityDeltaPct?: number;
}

/** Max simulated reports held in the live stream (memory bound). */
export const MAX_STREAM_SIGNALS = 60;

/** Hero cell of the demo path. */
const HERO = { region: "nashik", crop: HERO_CROP_ID };

function clampNum(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

class CropxApi {
  private districtRiskCache = new Map<string, RiskAssessment>();
  private districtRowsCache = new Map<
    string,
    ReturnType<typeof buildDistrictRiskRows>
  >();
  private cropRowsCache = new Map<string, Record<string, number>>();
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
    return REGIONS.find((r) => r.id === regionId) ?? REGIONS[0];
  }

  hasRegion(regionId: string): boolean {
    return REGIONS.some((r) => r.id === regionId);
  }

  hasCrop(cropId: string): boolean {
    return CROPS.some((c) => c.id === cropId);
  }

  getSeason(regionId: string, cropId: string): SeasonState {
    return (
      SEASON_STATES[regionId]?.[cropId] ??
      SEASON_STATES[HERO.region]?.[HERO.crop]
    );
  }

  getBundle(
    regionId: string,
    cropId: string,
    opts?: { signalCoverage?: number; reportCount?: number },
  ): RegionBundle {
    const region = this.getRegion(regionId);
    const crop = cropById(cropId);
    const seedSeason = this.getSeason(region.id, crop.id);
    const season: SeasonState = {
      ...seedSeason,
      signalCoverage:
        opts?.signalCoverage !== undefined
          ? clampNum(opts.signalCoverage, 0, 92)
          : seedSeason.signalCoverage,
      reportCount:
        opts?.reportCount !== undefined
          ? Math.max(0, Math.round(opts.reportCount))
          : seedSeason.reportCount,
    };
    const signals = buildSignals(region.id, crop.id);
    return {
      region,
      crop,
      season,
      villages: buildVillages(region.id, crop.id),
      signals,
      risk: runEngine({
        regionId: region.id,
        crop,
        season,
        signals,
      }).risk,
      forecast: buildForecast(region.id, crop.id),
      quality: this.getDataQuality(),
    };
  }

  runScenario(
    regionId: string,
    cropId: string,
    input: ScenarioInput,
    opts?: { signalCoverage?: number; reportCount?: number },
  ): ScenarioResult | null {
    if (!this.hasRegion(regionId) || !this.hasCrop(cropId)) return null;
    const seasonSeed = this.getSeason(regionId, cropId);
    const season: SeasonState = {
      ...seasonSeed,
      signalCoverage:
        opts?.signalCoverage !== undefined
          ? clampNum(opts.signalCoverage, 0, 92)
          : seasonSeed.signalCoverage,
      reportCount:
        opts?.reportCount !== undefined
          ? Math.max(0, Math.round(opts.reportCount))
          : seasonSeed.reportCount,
    };
    return runEngine({
      regionId,
      crop: cropById(cropId),
      season,
      signals: buildSignals(regionId, cropId),
      plantingDeltaPct: input.plantingDeltaPct,
      capacityDeltaPct: input.capacityDeltaPct,
    });
  }

  /** Engine-computed baseline risk for one district × crop (cached). */
  getDistrictRisk(regionId: string, cropId: string): RiskAssessment | null {
    if (!this.hasRegion(regionId) || !this.hasCrop(cropId)) return null;
    const key = `${regionId}:${cropId}`;
    const cached = this.districtRiskCache.get(key);
    if (cached) return cached;
    const risk = runEngine({
      regionId,
      crop: cropById(cropId),
      season: this.getSeason(regionId, cropId),
      signals: [],
    }).risk;
    this.districtRiskCache.set(key, risk);
    return risk;
  }

  /** All districts with baseline risk for a crop, hero districts first. */
  getDistrictRiskRows(cropId: string): ReturnType<typeof buildDistrictRiskRows> {
    const cached = this.districtRowsCache.get(cropId);
    if (cached) return cached;
    const rows = buildDistrictRiskRows(cropId).sort((a, b) => {
      const ai = REGION_ORDER.indexOf(a.region.id);
      const bi = REGION_ORDER.indexOf(b.region.id);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    this.districtRowsCache.set(cropId, rows);
    return rows;
  }

  /** Baseline risk per crop for one district (cached). */
  getCropRiskRows(regionId: string): Record<string, number> {
    const cached = this.cropRowsCache.get(regionId);
    if (cached) return cached;
    const rows = buildCropRiskRows(regionId);
    this.cropRowsCache.set(regionId, rows);
    return rows;
  }

  /**
   * New reports arriving as a stream batch. PURE: returns the merged list,
   * clamped to MAX_STREAM_SIGNALS; caller owns the state.
   */
  mergeSignals(
    current: Signal[],
    regionId: string,
    cropId: string,
    n: number,
  ): Signal[] {
    const safeN = clampNum(Math.round(n), 1, 500);
    const now = Date.now();
    const region = this.getRegion(regionId);
    const season = this.getSeason(regionId, cropId);
    const villages = buildVillages(regionId, cropId);
    const injected: Signal[] = [];
    for (let i = 1; i <= safeN; i++) {
      const node = villages[i % Math.max(1, villages.length)];
      injected.push({
        id: `${regionId}-${cropId}-inj-${now}-${i}`,
        regionId,
        cropId,
        kind: i % 3 === 0 ? "survey" : "fpo",
        org: i % 3 === 0
          ? "Demo-injected survey batch"
          : `${node?.name ?? region.name} demo-injected report`,
        village: node?.name ?? region.name,
        areaHa: Math.round(season.plantingAreaHa * 0.004),
        minutesAgo: 0,
        receivedAt: now,
        simulated: true,
      });
    }
    return [...injected, ...current].slice(0, MAX_STREAM_SIGNALS);
  }

  /**
   * Coverage response to `n` injected reports, from the district-crop's
   * seed coverage. Deterministic and bounded — no cumulative drift.
   */
  coverageAfterInject(regionId: string, cropId: string, n: number): number {
    const base = this.getSeason(regionId, cropId).signalCoverage;
    const safeN = clampNum(Math.round(n), 0, 500);
    const gain = Math.min(25, safeN * 0.04);
    return Math.min(92, Math.round(base + gain));
  }

  getDataQuality(): DataQuality {
    if (!this.qualityCache) this.qualityCache = buildDataQuality();
    return this.qualityCache;
  }

  getForecast(
    regionId: string,
    cropId: string,
    opts?: { productionScale?: number; capacityScale?: number },
  ): ForecastPoint[] {
    return buildForecast(regionId, cropId, opts);
  }

  getRecommendation(
    risk: RiskAssessment,
    regionName: string,
    cropName: string,
  ): Recommendation {
    const gapPct = risk.oversupplyGapPct;
    const priority: Recommendation["priority"] =
      risk.band === "critical" || risk.band === "high"
        ? "high"
        : risk.band === "medium"
          ? "medium"
          : "low";
    return {
      priority,
      headline: gapPct > 8
        ? `Concentration risk in ${cropName.toLowerCase()} across ${regionName} — projected arrivals exceed absorption capacity`
        : `Projected ${cropName.toLowerCase()} arrivals within market absorption tolerance`,
      reason: gapPct > 8
        ? `Oversupply gap ≈ ${gapPct.toFixed(0)}% of absorption capacity; historical tolerance ≈ 5%.`
        : "Arrivals projected to stay within historical absorption tolerance (±5%).",
      audience: gapPct > 8 ? "FPO + buyers" : "all",
      actions: gapPct > 8
        ? [
            `Hold additional ${cropName.toLowerCase()} planting at current area; shift marginal plots to lower-risk crops.`,
            "Stagger harvest windows across member plots to flatten the arrivals curve.",
            "Pre-book storage/procurement capacity before the harvest window opens.",
          ]
        : [
            "Maintain current planting plan.",
            "Monitor the weekly signal stream for direction changes.",
          ],
    };
  }

  /** Counts surfaced in the honesty strip / sidebar scope note. */
  getStats(): {
    districts: number;
    villages: number;
    crops: number;
    excluded: string[];
  } {
    return {
      districts: DISTRICT_COUNT,
      villages: VILLAGE_COUNT,
      crops: CROPS.length,
      excluded: EXCLUDED_DISTRICTS.map((d) => d.name),
    };
  }
}

export const cropxApi = new CropxApi();
