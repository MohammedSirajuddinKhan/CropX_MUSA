import type {
  Crop,
  DataQuality,
  ForecastPoint,
  Region,
  SeasonState,
  Signal,
  VillageStat,
} from "./types";
import { runEngine } from "./engine";
import {
  DISTRICTS,
  EXCLUDED_DISTRICTS,
  HERO_DISTRICT_IDS,
  districtSeedById,
  type DistrictSeed,
} from "./districts";

/**
 * Dataset builder — derives the full monitored state for every Maharashtra
 * farming district from the structured seed table (districts.ts).
 *
 * HONESTY RULES (spec §21):
 *  - Historical series mimic real magnitudes but are NOT live government data.
 *  - All planting signals are simulated (Signal.simulated === true) and the UI
 *    must keep the "Simulated FPO/Farmer Signals" label visible.
 *  - Every number the UI renders flows through the adapter (data.ts) and the
 *    engine — nothing is hard-coded in components.
 */

export const CROPS: Crop[] = [
  { id: "onion", name: "Onion", unit: "t", harvestStartWeeks: 6, typicalYieldTPerHa: 11.1 },
  { id: "tomato", name: "Tomato", unit: "t", harvestStartWeeks: 9, typicalYieldTPerHa: 24.5 },
  { id: "soybean", name: "Soybean", unit: "t", harvestStartWeeks: 14, typicalYieldTPerHa: 1.1 },
  { id: "cotton", name: "Cotton", unit: "t", harvestStartWeeks: 18, typicalYieldTPerHa: 0.52 },
  { id: "wheat", name: "Wheat", unit: "t", harvestStartWeeks: 22, typicalYieldTPerHa: 3.1 },
];

/**
 * Signal report templates. Batch metadata (kind/org/share) per stream entry;
 * village attribution is resolved per district at build time.
 */
/**
 * Nashik onion — hero calibration. The seed table is tuned so the engine
 * lands at 82% baseline risk, 91% at +10% planting, 61% diversified (−23%),
 * with a 76–88 range under zero-delta conditions.
 */
const NASHIK_SEASON: SeasonState = {
  plantingAreaHa: 128_000,
  baselineAreaHa: 108_000,
  expectedProductionT: 1_415_000,
  medianProductionT: 1_080_000,
  capacityGrowthPct: 12,
  marketCapacityT: { regular: 640_000, storage: 310_000, processing: 170_000, total: 1_120_000 },
  weeksToHarvest: 6,
  signalCoverage: 67,
  signalConfidence: "medium-high",
  reportCount: 1284,
  yieldTPerHa: 11.05,
};

function seasonFromSeed(seed: DistrictSeed): SeasonState {
  if (seed.id === "nashik") return NASHIK_SEASON;
  const plantingAreaHa = Math.round(seed.baselineAreaHa * (1 + seed.deviationPct / 100));
  const expectedProductionT = Math.round(plantingAreaHa * seed.yieldTPerHa);
  const medianProductionT = Math.round(seed.baselineAreaHa * seed.yieldTPerHa);
  const marketTotal = Math.round(medianProductionT * seed.capacityRatio);
  const signalConfidence: SeasonState["signalConfidence"] =
    seed.coverage >= 62
      ? "medium-high"
      : seed.coverage >= 48
        ? "medium"
        : seed.coverage >= 38
          ? "low"
          : "low";
  return {
    plantingAreaHa,
    baselineAreaHa: seed.baselineAreaHa,
    expectedProductionT,
    medianProductionT,
    capacityGrowthPct: seed.capacityGrowthPct,
    marketCapacityT: {
      regular: Math.round(marketTotal * 0.57),
      storage: Math.round(marketTotal * 0.28),
      processing: marketTotal - Math.round(marketTotal * 0.57) - Math.round(marketTotal * 0.28),
      total: marketTotal,
    },
    weeksToHarvest: seed.weeksToHarvest,
    signalCoverage: seed.coverage,
    signalConfidence,
    // Reports scale with monitored area — roughly 10 reports per 100 ha.
    reportCount: Math.max(120, Math.round(plantingAreaHa / 100)),
    yieldTPerHa: seed.yieldTPerHa,
  };
}

/** All 34 monitored districts, derived. */
export const REGIONS: Region[] = DISTRICTS.map((seed) => {
  const season = seasonFromSeed(seed);
  const totalVillageWeight = seed.villages.reduce((a, v) => a + v.weight, 0);
  const villages: VillageStat[] = seed.villages.map((v, i) => {
    const share = v.weight / totalVillageWeight;
    // Node-level deviation wobbles around the district value; the mandi hub
    // (largest node) tracks the district signal most closely.
    const nodeBias = v.mandi ? 0 : ((i % 3) - 1) * (seed.deviationPct >= 0 ? 2.4 : -2.4);
    return {
      name: v.name,
      mandi: v.mandi,
      share,
      areaHa: Math.round(season.plantingAreaHa * share),
      deviationPct: Math.round((seed.deviationPct + nodeBias) * 10) / 10,
      minutesAgo: 24 + i * 37,
    };
  });
  return {
    id: seed.id,
    name: seed.name,
    district: seed.name,
    state: "Maharashtra",
    lat: seed.lat,
    lon: seed.lon,
    areaHa: season.plantingAreaHa,
    villages,
    reportCount: season.reportCount,
    dataSource: "Simulated FPO/farmer signal stream (prototype seed)",
  };
});

export const SEASON_STATES: Record<string, SeasonState> = Object.fromEntries(
  DISTRICTS.map((seed) => [seed.id, seasonFromSeed(seed)]),
);

/** Ordered for switchers: hero districts first, then the rest. */
export const REGION_ORDER: string[] = [
  ...HERO_DISTRICT_IDS,
  ...REGIONS.map((r) => r.id).filter(
    (id) => !(HERO_DISTRICT_IDS as readonly string[]).includes(id),
  ),
];

export { EXCLUDED_DISTRICTS };

const SIGNAL_TEMPLATES: Array<{
  kind: Signal["kind"];
  share: number; // share of region area covered by this report batch
  minutesAgo: number;
  orgFactory: (village: string) => string;
}> = [
  { kind: "fpo", share: 0.22, minutesAgo: 34, orgFactory: (v) => `${v} FPO collective` },
  { kind: "fpo", share: 0.14, minutesAgo: 62, orgFactory: (v) => `${v} producer cooperative` },
  { kind: "farmer", share: 0.11, minutesAgo: 91, orgFactory: (v) => `${v} farmer panel B-14 (n=212)` },
  { kind: "survey", share: 0.09, minutesAgo: 118, orgFactory: () => "Weekly village survey round 9" },
  { kind: "buyer", share: 0.06, minutesAgo: 143, orgFactory: (v) => `${v} APMC procurement desk` },
  { kind: "fpo", share: 0.05, minutesAgo: 171, orgFactory: (v) => `${v} taluka producer group` },
];

export function buildSignals(regionId: string): Signal[] {
  const region = REGIONS.find((r) => r.id === regionId);
  if (!region) return [];
  const now = Date.now();
  return SIGNAL_TEMPLATES.map((t, i): Signal => {
    const village = region.villages[i % region.villages.length];
    return {
      id: `${regionId}-sig-${i}`,
      regionId,
      cropId: "onion",
      kind: t.kind,
      org: t.orgFactory(village.name),
      village: village.name,
      areaHa: Math.round(region.areaHa * t.share),
      minutesAgo: t.minutesAgo + i * 7,
      receivedAt: now - (t.minutesAgo + i * 7) * 60_000,
      simulated: true,
    };
  });
}

/**
 * Historical (mock, magnitudes calibrated to rabi-onion seasons) + forecast
 * split. Weeks −12..0 historical, +1..+8 forecast with uncertainty.
 * Scales let the chart react to the active scenario without touching the
 * historical series (production scale) or misstating history (capacity scale).
 */
export function buildForecast(
  regionId: string,
  opts?: { productionScale?: number; capacityScale?: number },
): ForecastPoint[] {
  const season = SEASON_STATES[regionId];
  if (!season) return [];
  const pScale = Number.isFinite(opts?.productionScale) ? Math.max(0.1, opts!.productionScale!) : 1;
  const cScale = Number.isFinite(opts?.capacityScale) ? Math.max(0.1, opts!.capacityScale!) : 1;
  const base = (season.medianProductionT / 8) * pScale; // approx weekly arrivals at peak
  const historyShape = [0.62, 0.71, 0.79, 0.9, 0.98, 1.05, 1.12, 1.18, 1.21, 1.16, 1.02, 0.74];
  const points: ForecastPoint[] = [];

  historyShape.forEach((f, i) => {
    const week = i - 12;
    const historicalT = Math.round(base * f * 0.94);
    points.push({
      week,
      label: `W${week < 0 ? week : `+${week}`}`,
      historicalT,
      arrivalsT: Math.round(historicalT * 0.86),
    });
  });

  points.push({
    week: 0,
    label: "now",
    historicalT: Math.round(season.medianProductionT / 8 * 0.94),
    arrivalsT: Math.round(season.medianProductionT / 8 * 0.94 * 0.86),
    absorptionT: Math.round((season.marketCapacityT.total / 8) * cScale),
  });

  for (let w = 1; w <= 8; w++) {
    const ramp = Math.min(1, 0.35 + w * 0.16); // arrivals ramp toward harvest
    const mid = base * ramp;
    points.push({
      week: w,
      label: `W+${w}`,
      forecastT: Math.round(mid),
      forecastLoT: Math.round(mid * 0.88),
      forecastHiT: Math.round(mid * 1.14),
      absorptionT: Math.round((season.marketCapacityT.total / 8) * cScale),
    });
  }
  return points;
}

/** District-level baseline risk rows for switchers/tables (engine-computed). */
export function buildDistrictRiskRows(): Array<{
  region: Region;
  season: SeasonState;
  risk: ReturnType<typeof runEngine>["risk"];
}> {
  return REGIONS.map((region) => {
    const season = SEASON_STATES[region.id];
    return {
      region,
      season,
      risk: runEngine({
        regionId: region.id,
        crop: CROPS[0],
        season,
        signals: [],
      }).risk,
    };
  });
}

/** Coverage-weighted data-quality strip, derived from the district table. */
export function buildDataQuality(): DataQuality {
  const weighted = DISTRICTS.reduce(
    (acc, d) => {
      const area = d.baselineAreaHa * (1 + d.deviationPct / 100);
      return { cov: acc.cov + d.coverage * area, area: acc.area + area };
    },
    { cov: 0, area: 0 },
  );
  const overall = Math.round(weighted.cov / Math.max(1, weighted.area));
  const mandiCount = DISTRICTS.reduce(
    (a, d) => a + d.villages.filter((v) => v.mandi).length,
    0,
  );
  return {
    overallCoverage: overall,
    lastUpdatedLabel: "Today, 10:32 PM",
    sources: [
      { label: `FPO reports · simulated stream (${DISTRICTS.length} districts)`, coverage: Math.min(92, overall + 5), status: "ok" },
      { label: `Village/taluka survey panel (${mandiCount} mandi nodes)`, coverage: Math.max(30, overall - 9), status: "ok" },
      { label: "Mandi arrivals", coverage: 81, status: "delayed" },
      { label: "Weather station grid", coverage: 64, status: "ok" },
    ],
  };
}

/** Exposed for honesty notes in the UI. */
export const DISTRICT_COUNT = DISTRICTS.length;
export const VILLAGE_COUNT = DISTRICTS.reduce((a, d) => a + d.villages.length, 0);
export { districtSeedById };
