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
import { CROPS, CROP_INTERNAL, HERO_CROP_ID, cropById } from "./crops";
import {
  DISTRICTS,
  DEFAULT_VEG_WEIGHT,
  EXCLUDED_DISTRICTS,
  HERO_DISTRICT_IDS,
  type DistrictSeed,
  type VegKey,
} from "./districts";

/**
 * Dataset builder — derives the full monitored state for every Maharashtra
 * farming district × vegetable crop from:
 *   1. the real crop aggregates in crops.ts (GoI/NHB official figures), and
 *   2. the district seed table in districts.ts (relative specialization).
 *
 * DERIVATION MODEL (documented for the data-honesty contract):
 *   districtBaselineArea(d, c) =
 *       normalizedDistrictWeight(d, c)
 *     × MONITORED_SHARE(c)                       // share of the state's
 *                                                // published area inside the
 *                                                // monitored producing belt
 *     × crop.mhAreaHa                            // REAL: GoI FE 2024-25 × MH share
 *
 *   deviation(d, c)  = onion seed deviation × crop.signalFactor + deterministic
 *                      per-(d,c) jitter           // SIMULATED signal stream
 *   medianProduction = baselineArea × mhYield × MEDIAN_YIELD_FACTOR(c)
 *   capacity         = medianProduction × baseCapacityRatio(c) × infraIndex(d)
 *
 * CALIBRATION: with the onion anchors this yields Nashik planting 55,927 ha,
 * expected production 808.7 kt, median 617.5 kt (+31.0%), arrivals/capacity
 * 108.6% → risk 82, +10% → 91, −23% → 61 — the reference demo beats.
 *
 * Every number is labeled with its provenance kind; nothing here claims to be
 * live government data.
 */

/** Share of each crop's published state area inside the monitored belt. */
const MONITORED_SHARE: Record<string, number> = {
  onion: 0.55, tomato: 0.6, potato: 0.25, brinjal: 0.5, cabbage: 0.5,
  cauliflower: 0.5, okra: 0.5, "green-chilli": 0.55, garlic: 0.5,
  "green-peas": 0.5, "bitter-gourd": 0.55, "bottle-gourd": 0.5,
  radish: 0.5, carrot: 0.5, capsicum: 0.6,
};

/**
 * Per-crop median-yield factors. Default: 5-yr median yield runs ~5% below
 * the current season.
 */
const MEDIAN_YIELD_FACTOR: Record<string, number> = {};

const DEFAULT_MEDIAN_YIELD_FACTOR = 0.95;

/**
 * Onion season calibration: median yield tracks the current yield (factor
 * 1.0) in every district except Nashik, whose reference season embeds a
 * 0.90507 median-yield deficit — this pins the hero beats (82 baseline,
 * +31% supply, 91 at +10%, 61 diversified) exactly.
 */
const ONION_MEDIAN_FACTOR_DEFAULT = 1.0;
const ONION_MEDIAN_FACTOR_NASHIK = 0.90507;

/** Onion calibration constants (reference season, do not perturb). */
const ONION_DEVIATION_SCALE = 1; // onion deviation used verbatim from seeds

/** Deterministic per-(district,crop) jitter in [−6, +7) — no Math.random. */
function vegJitter(districtId: string, cropId: string): number {
  const s = `${districtId}:${cropId}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return ((h % 130) - 60) / 10;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** District weight for a crop: seeds carry relative specialization. */
function districtWeight(seed: DistrictSeed, cropId: string): number {
  if (cropId === "onion") return seed.baselineAreaHa; // anchor crop: size-based
  return (seed.vegWeights[cropId as VegKey] ?? DEFAULT_VEG_WEIGHT) *
    (0.6 + (seed.baselineAreaHa / 108_000) * 0.4); // larger districts farm more of everything
}

/** Normalized district share of the monitored belt for a crop. */
function districtShare(seed: DistrictSeed, cropId: string): number {
  const total = DISTRICTS.reduce((a, d) => a + districtWeight(d, cropId), 0);
  return districtWeight(seed, cropId) / Math.max(1e-9, total);
}

function confidenceLabel(coverage: number): SeasonState["signalConfidence"] {
  if (coverage >= 62) return "medium-high";
  if (coverage >= 45) return "medium";
  return "low";
}

function seasonFromSeed(seed: DistrictSeed, crop: Crop): SeasonState {
  const internal = CROP_INTERNAL[crop.id];
  const share = districtShare(seed, crop.id);
  const monitored = MONITORED_SHARE[crop.id] ?? 0.5;
  const baselineAreaHa = Math.round(share * monitored * crop.mhAreaHa);

  // Deviation: onion uses its calibrated seed value; other crops scale the
  // district's planting-signal intensity by crop signal coverage.
  const deviationPct =
    crop.id === "onion"
      ? seed.deviationPct * ONION_DEVIATION_SCALE
      : clamp(seed.deviationPct * internal.signalFactor + vegJitter(seed.id, crop.id), -25, 35);
  const plantingAreaHa = Math.round(baselineAreaHa * (1 + deviationPct / 100));

  const yieldTPerHa = crop.mhYieldTPerHa;
  const expectedProductionT = Math.round(plantingAreaHa * yieldTPerHa);
  const medianFactor =
    crop.id === "onion"
      ? seed.id === "nashik"
        ? ONION_MEDIAN_FACTOR_NASHIK
        : ONION_MEDIAN_FACTOR_DEFAULT
      : (MEDIAN_YIELD_FACTOR[crop.id] ?? DEFAULT_MEDIAN_YIELD_FACTOR);
  const medianProductionT = Math.round(baselineAreaHa * yieldTPerHa * medianFactor);

  const capacityRatio = internal.baseCapacityRatio * seed.infraIndex;
  const marketTotal = Math.round(medianProductionT * capacityRatio);
  // Storage/processing depth follows perishability (real behavior:
  // perishable veg have almost no buffer, onions/garlic/potato do).
  const storageShare = (1 - crop.perishability) * 0.42;
  const processingShare = 0.12 * (1 - crop.perishability * 0.5);
  const regularShare = Math.max(0.3, 1 - storageShare - processingShare);
  const regular = Math.round(marketTotal * regularShare);
  const storage = Math.round(marketTotal * storageShare);
  const processing = Math.max(0, marketTotal - regular - storage);

  const coverage = clamp(
    Math.round(seed.coverage * (0.55 + 0.45 * internal.signalFactor)),
    18,
    78,
  );
  const jitterHash = Math.abs(Math.round(vegJitter(seed.id, crop.id) * 10));
  const weeksToHarvest = Math.max(
    2,
    crop.harvestStartWeeks + (crop.id === "onion" && seed.id === "nashik" ? 0 : (jitterHash % 3) - 1),
  );

  return {
    cropId: crop.id,
    plantingAreaHa,
    baselineAreaHa,
    expectedProductionT,
    medianProductionT,
    capacityGrowthPct: Math.round(seed.capacityGrowthPct * (0.7 + 0.3 * internal.signalFactor)),
    marketCapacityT: { regular, storage, processing, total: regular + storage + processing },
    weeksToHarvest,
    signalCoverage: coverage,
    signalConfidence: confidenceLabel(coverage),
    reportCount: Math.max(60, Math.round((plantingAreaHa / 100) * internal.signalFactor)),
    yieldTPerHa,
    stateShare: share,
  };
}

/** All 34 monitored districts (identity + geo; season data is per-crop). */
export const REGIONS: Region[] = DISTRICTS.map((seed) => {
  // Monitored vegetable area = sum over crops of current planting.
  const totalArea = CROPS.reduce((a, crop) => {
    const s = seasonFromSeed(seed, crop);
    return a + s.plantingAreaHa;
  }, 0);
  return {
    id: seed.id,
    name: seed.name,
    district: seed.name,
    state: "Maharashtra",
    lat: seed.lat,
    lon: seed.lon,
    areaHa: totalArea,
    reportCount: Math.round(
      CROPS.reduce((a, crop) => a + seasonFromSeed(seed, crop).reportCount, 0),
    ),
    dataSource:
      "Derived from GoI horticulture statistics + simulated FPO signal stream (prototype)",
  };
});

/** SEASON_STATES[regionId][cropId] — every monitored district × crop cell. */
export const SEASON_STATES: Record<string, Record<string, SeasonState>> =
  Object.fromEntries(
    DISTRICTS.map((seed) => [
      seed.id,
      Object.fromEntries(CROPS.map((crop) => [crop.id, seasonFromSeed(seed, crop)])),
    ]),
  );

/** Ordered for switchers: hero districts first, then the rest. */
export const REGION_ORDER: string[] = [
  ...HERO_DISTRICT_IDS,
  ...REGIONS.map((r) => r.id).filter(
    (id) => !(HERO_DISTRICT_IDS as readonly string[]).includes(id),
  ),
];

export { EXCLUDED_DISTRICTS, HERO_CROP_ID, cropById, CROPS };

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

export function buildSignals(regionId: string, cropId: string): Signal[] {
  const seed = DISTRICTS.find((d) => d.id === regionId);
  const season = SEASON_STATES[regionId]?.[cropId];
  if (!seed || !season) return [];
  const now = Date.now();
  return SIGNAL_TEMPLATES.map((t, i): Signal => {
    const village = seed.villages[i % seed.villages.length].name;
    return {
      id: `${regionId}-${cropId}-sig-${i}`,
      regionId,
      cropId,
      kind: t.kind,
      org: t.orgFactory(village),
      village,
      areaHa: Math.round(season.plantingAreaHa * t.share),
      minutesAgo: t.minutesAgo + i * 7,
      receivedAt: now - (t.minutesAgo + i * 7) * 60_000,
      simulated: true,
    };
  });
}

/** Village/taluka nodes for a district + crop (areas follow the crop). */
export function buildVillages(regionId: string, cropId: string): VillageStat[] {
  const seed = DISTRICTS.find((d) => d.id === regionId);
  const season = SEASON_STATES[regionId]?.[cropId];
  if (!seed || !season) return [];
  const totalVillageWeight = seed.villages.reduce((a, v) => a + v.weight, 0);
  return seed.villages.map((v, i) => {
    const share = v.weight / totalVillageWeight;
    const nodeBias = v.mandi ? 0 : ((i % 3) - 1) * (season.baselineAreaHa > 0 && (seed.deviationPct >= 0) ? 2.4 : -2.4);
    return {
      name: v.name,
      mandi: v.mandi,
      share,
      areaHa: Math.round(season.plantingAreaHa * share),
      deviationPct: Math.round((seasonBaselineDeviation(seed, cropId) + nodeBias) * 10) / 10,
      minutesAgo: 24 + i * 37,
    };
  });
}

function seasonBaselineDeviation(seed: DistrictSeed, cropId: string): number {
  const s = SEASON_STATES[seed.id]?.[cropId];
  if (!s || s.baselineAreaHa === 0) return 0;
  return ((s.plantingAreaHa - s.baselineAreaHa) / s.baselineAreaHa) * 100;
}

/**
 * Historical (synthetic, magnitudes calibrated to Indian mandi arrival
 * seasons) + forecast split. Weeks −12..0 historical, +1..+8 forecast.
 * Scales let the chart react to the active scenario without touching history.
 */
export function buildForecast(
  regionId: string,
  cropId: string,
  opts?: { productionScale?: number; capacityScale?: number },
): ForecastPoint[] {
  const season = SEASON_STATES[regionId]?.[cropId];
  if (!season) return [];
  const pScale = Number.isFinite(opts?.productionScale)
    ? Math.max(0.1, opts!.productionScale!)
    : 1;
  const cScale = Number.isFinite(opts?.capacityScale)
    ? Math.max(0.1, opts!.capacityScale!)
    : 1;
  const base = (season.medianProductionT / 8) * pScale; // approx weekly arrivals at peak
  const historyShape = [0.62, 0.71, 0.79, 0.9, 0.98, 1.05, 1.12, 1.18, 1.21, 1.16, 1.02, 0.74];
  const points: ForecastPoint[] = [];

  historyShape.forEach((f, i) => {
    const week = i - 12;
    const historicalT = Math.round((season.medianProductionT / 8) * f * 0.94);
    points.push({
      week,
      label: `W${week < 0 ? week : `+${week}`}`,
      historicalT,
      arrivalsT: Math.round(historicalT * (CROP_INTERNAL[cropId]?.arrivalsShare ?? 0.86)),
    });
  });

  points.push({
    week: 0,
    label: "now",
    historicalT: Math.round((season.medianProductionT / 8) * 0.94),
    arrivalsT: Math.round((season.medianProductionT / 8) * 0.94 * (CROP_INTERNAL[cropId]?.arrivalsShare ?? 0.86)),
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

/** District-level baseline risk rows for the ACTIVE crop (engine-computed). */
export function buildDistrictRiskRows(cropId: string): Array<{
  region: Region;
  season: SeasonState;
  risk: ReturnType<typeof runEngine>["risk"];
}> {
  const crop = cropById(cropId);
  return REGIONS.map((region) => {
    const season = SEASON_STATES[region.id]?.[cropId];
    return {
      region,
      season,
      risk: runEngine({
        regionId: region.id,
        crop,
        season,
        signals: [],
      }).risk,
    };
  });
}

/** Baseline risk per crop for the ACTIVE district (engine-computed). */
export function buildCropRiskRows(regionId: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const crop of CROPS) {
    const season = SEASON_STATES[regionId]?.[crop.id];
    if (!season) continue;
    out[crop.id] = runEngine({
      regionId,
      crop,
      season,
      signals: [],
    }).risk.glutRisk;
  }
  return out;
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
      { label: `FPO reports · simulated stream (${DISTRICTS.length} districts × ${CROPS.length} crops)`, coverage: Math.min(92, overall + 5), status: "ok" },
      { label: `Village/taluka survey panel (${mandiCount} mandi nodes)`, coverage: Math.max(30, overall - 9), status: "ok" },
      { label: "Mandi arrivals (AGMARKNET-shaped, synthetic)", coverage: 81, status: "delayed" },
      { label: "Weather station grid", coverage: 64, status: "ok" },
    ],
    lineage: [
      {
        label: "Crop area · production · yield",
        detail: `Official GoI/NHB aggregates (e.g. onion 19.68 L ha, 307.67 L t, 2024-25 Final Estimates) scaled to Maharashtra via published state shares`,
        kind: "official",
      },
      {
        label: "District × crop areas",
        detail: "Derived: state totals allocated across districts by documented specialization weights; not district-level government figures",
        kind: "derived",
      },
      {
        label: "Planting signals & scenarios",
        detail: "Simulated FPO/farmer stream — prototype only, explicitly not live farmer reports",
        kind: "simulated",
      },
    ],
  };
}

/** Exposed for honesty notes in the UI. */
export const DISTRICT_COUNT = DISTRICTS.length;
export const VILLAGE_COUNT = DISTRICTS.reduce((a, d) => a + d.villages.length, 0);
export { districtSeedById } from "./districts";
