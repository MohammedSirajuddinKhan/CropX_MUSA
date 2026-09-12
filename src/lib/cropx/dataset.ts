import type {
  Crop,
  DataQuality,
  ForecastPoint,
  Region,
  SeasonState,
  Signal,
} from "./types";
import { runEngine } from "./engine";

/**
 * Seeded demo dataset.
 *
 * HONESTY RULES (spec §21):
 *  - Historical series mimic real magnitudes but are NOT live government data.
 *  - All planting signals are simulated (Signal.simulated === true) and the UI
 *    must keep the "Simulated FPO/Farmer Signals" label visible.
 *  - Every number the UI renders flows through the adapter (data.ts) and the
 *    engine — nothing is hard-coded in components.
 */

export const REGIONS: Region[] = [
  { id: "nashik", name: "Nashik", district: "Nashik", state: "Maharashtra", lat: 19.997, lon: 73.79, areaHa: 128_000 },
  { id: "pune", name: "Pune", district: "Pune", state: "Maharashtra", lat: 18.52, lon: 73.86, areaHa: 86_400 },
  { id: "ahmednagar", name: "Ahmednagar", district: "Ahmednagar", state: "Maharashtra", lat: 19.09, lon: 74.74, areaHa: 94_200 },
  { id: "solapur", name: "Solapur", district: "Solapur", state: "Maharashtra", lat: 17.66, lon: 75.9, areaHa: 58_700 },
  { id: "satara", name: "Satara", district: "Satara", state: "Maharashtra", lat: 17.69, lon: 74.0, areaHa: 41_300 },
];

export const CROPS: Crop[] = [
  { id: "onion", name: "Onion", unit: "t", harvestStartWeeks: 6, typicalYieldTPerHa: 11.1 },
  { id: "tomato", name: "Tomato", unit: "t", harvestStartWeeks: 9, typicalYieldTPerHa: 24.5 },
  { id: "soybean", name: "Soybean", unit: "t", harvestStartWeeks: 14, typicalYieldTPerHa: 1.1 },
  { id: "cotton", name: "Cotton", unit: "t", harvestStartWeeks: 18, typicalYieldTPerHa: 0.52 },
  { id: "wheat", name: "Wheat", unit: "t", harvestStartWeeks: 22, typicalYieldTPerHa: 3.1 },
];

/**
 * Nashik onion — the hero demo. Values are calibrated so the engine lands at
 * ~82% glut risk with a 76–88 range under zero-delta conditions.
 */
export const SEASON_STATES: Record<string, SeasonState> = {
  nashik: {
    plantingAreaHa: 128_000,
    baselineAreaHa: 108_000,
    expectedProductionT: 1_415_000,
    medianProductionT: 1_080_000,
    capacityGrowthPct: 12,
    marketCapacityT: { regular: 640_000, storage: 310_000, processing: 170_000, total: 1_120_000 },
    weeksToHarvest: 6,
    signalCoverage: 67,
    signalConfidence: "medium-high",
  },
  pune: {
    plantingAreaHa: 86_400,
    baselineAreaHa: 81_000,
    expectedProductionT: 952_000,
    medianProductionT: 890_000,
    capacityGrowthPct: 8,
    marketCapacityT: { regular: 560_000, storage: 190_000, processing: 120_000, total: 870_000 },
    weeksToHarvest: 7,
    signalCoverage: 58,
    signalConfidence: "medium",
  },
  ahmednagar: {
    plantingAreaHa: 94_200,
    baselineAreaHa: 84_600,
    expectedProductionT: 1_041_000,
    medianProductionT: 930_000,
    capacityGrowthPct: 9,
    marketCapacityT: { regular: 560_000, storage: 195_000, processing: 131_000, total: 886_000 },
    weeksToHarvest: 7,
    signalCoverage: 54,
    signalConfidence: "medium",
  },
  solapur: {
    plantingAreaHa: 58_700,
    baselineAreaHa: 57_900,
    expectedProductionT: 648_000,
    medianProductionT: 640_000,
    capacityGrowthPct: 7,
    marketCapacityT: { regular: 420_000, storage: 110_000, processing: 80_000, total: 610_000 },
    weeksToHarvest: 8,
    signalCoverage: 49,
    signalConfidence: "medium",
  },
  satara: {
    plantingAreaHa: 41_300,
    baselineAreaHa: 42_500,
    expectedProductionT: 456_000,
    medianProductionT: 470_000,
    capacityGrowthPct: 6,
    marketCapacityT: { regular: 330_000, storage: 70_000, processing: 50_000, total: 450_000 },
    weeksToHarvest: 8,
    signalCoverage: 44,
    signalConfidence: "low",
  },
};

const SIGNAL_TEMPLATES: Array<{
  kind: Signal["kind"];
  org: string;
  village: string;
  share: number; // share of region area covered
  minutesAgo: number;
}> = [
  { kind: "fpo", org: "Lasalgaon FPO Collective", village: "Lasalgaon", share: 0.22, minutesAgo: 34 },
  { kind: "fpo", org: "Pimpalgaon Basvant Coop", village: "Pimpalgaon", share: 0.14, minutesAgo: 62 },
  { kind: "farmer", org: "Farmer panel B-14 (n=212)", village: "Dindori block", share: 0.11, minutesAgo: 91 },
  { kind: "survey", org: "Weekly village survey round 9", village: "Sinnar block", share: 0.09, minutesAgo: 118 },
  { kind: "buyer", org: "Lasalgaon APMC procurement desk", village: "Lasalgaon", share: 0.06, minutesAgo: 143 },
  { kind: "fpo", org: "Kalwan producer group", village: "Kalwan", share: 0.05, minutesAgo: 171 },
];

const REGION_SIGNAL_SEED: Record<string, { count: number; coverage: number }> = {
  nashik: { count: 1284, coverage: 67 },
  pune: { count: 902, coverage: 58 },
  ahmednagar: { count: 771, coverage: 54 },
  solapur: { count: 486, coverage: 49 },
  satara: { count: 318, coverage: 44 },
};

export function buildSignals(regionId: string): Signal[] {
  const seed = REGION_SIGNAL_SEED[regionId] ?? { count: 300, coverage: 45 };
  const areaHa = SEASON_STATES[regionId]?.plantingAreaHa ?? 50_000;
  const now = Date.now();
  return SIGNAL_TEMPLATES.map((t, i): Signal => ({
    id: `${regionId}-sig-${i}`,
    regionId,
    cropId: "onion",
    kind: t.kind,
    org: t.org,
    village: t.village,
    areaHa: Math.round(areaHa * t.share),
    minutesAgo: t.minutesAgo + i * 7,
    receivedAt: now - t.minutesAgo * 60_000,
    simulated: true,
  }));
}

export function signalCount(regionId: string): number {
  return (REGION_SIGNAL_SEED[regionId] ?? { count: 0 }).count;
}

/**
 * Historical (mock, magnitudes calibrated to Nashik onion rabi seasons) +
 * forecast split. Weeks −12..0 historical, +1..+8 forecast with uncertainty.
 */
export function buildForecast(regionId: string): ForecastPoint[] {
  const season = SEASON_STATES[regionId];
  const base = season.medianProductionT / 8; // approx weekly arrivals at peak
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
    historicalT: Math.round(base * 0.94),
    arrivalsT: Math.round(base * 0.94 * 0.86),
    absorptionT: Math.round(season.marketCapacityT.total / 8),
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
      absorptionT: Math.round(season.marketCapacityT.total / 8),
    });
  }
  return points;
}

export const DATA_QUALITY: DataQuality = {
  overallCoverage: 67,
  lastUpdatedLabel: "Today, 10:32 PM",
  sources: [
    { label: "FPO reports (simulated stream)", coverage: 72, status: "ok" },
    { label: "Village survey panel", coverage: 58, status: "ok" },
    { label: "Mandi arrivals", coverage: 81, status: "delayed" },
    { label: "Weather station grid", coverage: 64, status: "ok" },
  ],
};

export { runEngine };
