/**
 * CropX domain types.
 *
 * These mirror the API contract of the future backend:
 *   GET  /api/regions/:regionId/risk?crop=cropId
 *   GET  /api/crops
 *   POST /api/scenarios { regionId, cropId, plantingPct, ... }
 *   POST /api/signals
 *   GET  /api/data-quality
 *
 * The frontend only talks to `cropxApi` (src/lib/cropx/data.ts), so the mock
 * adapter can be swapped for a real HTTP adapter without touching components.
 */

export type RiskBand = "low" | "medium" | "high" | "critical";
export type ConfidenceLabel = "low" | "medium" | "medium-high" | "high";

/** How officially anchored a number is. Surfaced in the UI lineage notes. */
export type ProvenanceKind =
  | "official" // GoI / NHB published statistic (area, production, yield)
  | "derived" // computed from official state totals + district patterns
  | "simulated"; // prototype signal stream / scenario inputs

export interface Provenance {
  kind: ProvenanceKind;
  /** e.g. "GoI Final Estimates 2024-25 (PIB)" */
  source: string;
  /** e.g. "2024-25" */
  year: string;
}

export interface VillageStat {
  /** Taluka / mandi-node name. */
  name: string;
  /** Major APMC market node for the district. */
  mandi: boolean;
  /** Estimated planting area around this node, ha, for the active crop. */
  areaHa: number;
  /** Share of district planting (0-1). */
  share: number;
  /** Planting deviation vs 5-yr baseline around this node, %. */
  deviationPct: number;
  /** Minutes since this node's latest signal batch. */
  minutesAgo: number;
}

export interface Region {
  id: string;
  name: string;
  district: string;
  state: string;
  /** Center coordinates for map/geo display. */
  lat: number;
  lon: number;
  /** Approximate planted area, ha — drives map marker weight. */
  areaHa: number;
  /** Total reports in the simulated signal stream for this district. */
  reportCount: number;
  /** Seed provenance label, shown in the UI honesty notes. */
  dataSource: string;
}

export interface Crop {
  id: string;
  name: string;
  unit: string; // "t"
  /** Weeks from "now" to harvest start for the monitored season window. */
  harvestStartWeeks: number;

  // --- real Indian aggregates (see crops.ts for per-crop sources) ---
  /** All-India area, lakh ha (1 lakh = 100,000). */
  indiaAreaLakhHa: number;
  /** All-India production, lakh tonnes. */
  indiaProductionLakhT: number;
  /** Maharashtra share of all-India area (0-1). */
  mhShareOfIndia: number;
  /** Maharashtra area under the crop, ha (derived from the above). */
  mhAreaHa: number;
  /** All-India average yield, t/ha. */
  indiaYieldTPerHa: number;
  /** Maharashtra average yield, t/ha (state avg where published). */
  mhYieldTPerHa: number;
  /** 0 = storable (onion/potato/garlic), 1 = extremely perishable (okra). */
  perishability: number;
  /** Typical marketable storage window, weeks. */
  storageWeeks: number;
  /** Share of the crop's annual area falling in the monitored season window. */
  seasonWindowShare: number;
  /** Provenance of the India/MH aggregates shown in the UI. */
  provenance: Provenance;
}

export interface SeasonState {
  cropId: string;
  /** Current estimated planting area, ha (from signal stream). */
  plantingAreaHa: number;
  /** Historical 5-yr median planting area, ha. */
  baselineAreaHa: number;
  /** Expected production under current signals, tonnes. */
  expectedProductionT: number;
  /** 5-yr median production for the season, tonnes. */
  medianProductionT: number;
  /** YoY growth of market absorption capacity, %. */
  capacityGrowthPct: number;
  /** Market absorption capacity for the harvest window, tonnes. */
  marketCapacityT: {
    regular: number;
    storage: number;
    processing: number;
    total: number;
  };
  /** Weeks until harvest start. */
  weeksToHarvest: number;
  /** 0-100 signal coverage (% of area covered by reports). */
  signalCoverage: number;
  signalConfidence: ConfidenceLabel;
  /** Total reports backing the current planting estimate. */
  reportCount: number;
  /** Expected yield for the season, t/ha. */
  yieldTPerHa: number;
  /** District share of the state's area under this crop (0-1). */
  stateShare: number;
}

export interface SignalSource {
  kind: "farmer" | "fpo" | "survey" | "buyer";
  /** Display name of the reporting org / batch. */
  org: string;
  /** District or block the report came from. */
  village: string;
  /** Reported area for this crop, ha. */
  areaHa: number;
  /** Minutes ago received. */
  minutesAgo: number;
  /** Prototype label honesty: all current signals are simulated. */
  simulated: true;
}

export interface Signal extends SignalSource {
  id: string;
  regionId: string;
  cropId: string;
  receivedAt: number; // epoch ms
}

export interface RiskDriver {
  id: string;
  label: string;
  /** Signed contribution to glut risk, percentage points. */
  contribution: number;
  /** Relative feature magnitude, 0-100 — what SHAP |value| would give. */
  impact: number;
  tier: "high" | "medium-high" | "medium" | "low-medium" | "low";
  note: string;
}

export interface RiskAssessment {
  regionId: string;
  cropId: string;
  /** Point estimate, 0-100. */
  glutRisk: number;
  /** Credible interval, e.g. [76, 88]. */
  riskRange: [number, number];
  band: RiskBand;
  confidence: number; // 0-100
  expectedProductionT: number;
  expectedArrivalsT: number;
  productionChangePct: number; // vs 5-yr median
  absorptionPct: number; // expected arrivals as % of absorption capacity
  capacityGrowthPct: number; // absorption capacity growth, %
  supplyGapPct: number; // supply growth minus capacity growth, pp
  oversupplyGapT: number; // expected arrivals − absorption capacity
  oversupplyGapPct: number; // gap as % of absorption capacity
  drivers: RiskDriver[];
  weeksToHarvest: number;
  modelVersion: string;
  /** Label distinguishing live/simulated inputs. */
  signalSource: "simulated-fpo-stream";
  /** Reports backing this assessment (flows from the signal stream). */
  reportCount: number;
}

export interface ForecastPoint {
  /** Week offset from current week (negative = past). */
  week: number;
  label: string;
  historicalT?: number;
  arrivalsT?: number;
  forecastT?: number;
  forecastLoT?: number;
  forecastHiT?: number;
  absorptionT?: number;
}

export interface ScenarioResult {
  plantingDeltaPct: number;
  capacityDeltaPct: number;
  risk: RiskAssessment;
}

export interface Recommendation {
  priority: "high" | "medium" | "low";
  headline: string;
  actions: string[];
  reason: string;
  audience: "FPO" | "FPO + buyers" | "all";
}

export interface DataQuality {
  overallCoverage: number;
  sources: { label: string; coverage: number; status: "ok" | "degraded" | "delayed" }[];
  lastUpdatedLabel: string;
  /** Number lineage: what is official, what is derived, what is simulated. */
  lineage: { label: string; detail: string; kind: ProvenanceKind }[];
}

export interface RegionBundle {
  region: Region;
  crop: Crop;
  season: SeasonState;
  /** Taluka/mandi nodes for the active district + crop. */
  villages: VillageStat[];
  signals: Signal[];
  risk: RiskAssessment;
  forecast: ForecastPoint[];
  quality: DataQuality;
}
