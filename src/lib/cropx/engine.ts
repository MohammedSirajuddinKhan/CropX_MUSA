import type {
  Crop,
  RiskAssessment,
  RiskBand,
  RiskDriver,
  ScenarioResult,
  SeasonState,
  Signal,
} from "./types";

/**
 * CropX risk engine — transparent stand-in for the XGBoost + SHAP service.
 *
 * API parity: POST /api/scenarios { plantingDeltaPct } → ScenarioResult.
 * The ML service would return the same shape; drivers are structured exactly
 * like SHAP contributions (signed, per-feature, percentage points) so the UI
 * needs no changes when the real backend lands.
 */

export const MODEL_VERSION = "CropX Risk Engine v1.1";

/** Feature weights — in production these come from the fitted XGBoost model. */
const FEATURE_WEIGHTS = {
  planting: 0.42,
  historicalGlut: 0.24,
  production: 0.2,
  arrivals: 0.09,
  weather: 0.05,
} as const;

const CONFIDENCE_BY_LABEL = {
  low: 20,
  medium: 40,
  "medium-high": 58,
  high: 74,
} as const;

/** Share of production that reaches markets (rest retained / stored on-farm). */
const ARRIVALS_SHARE = 0.86;

/** Marginal-land elasticity: late-added area yields ~0.78× per hectare. */
const AREA_ELASTICITY = 0.78;

export interface EngineInput {
  regionId: string;
  crop: Crop;
  season: SeasonState;
  signals: Signal[];
  /** Scenario overrides applied on top of current season state. */
  plantingDeltaPct?: number;
  capacityDeltaPct?: number;
}

function band(risk: number): RiskBand {
  if (risk >= 85) return "critical";
  if (risk >= 65) return "high";
  if (risk >= 40) return "medium";
  return "low";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Guards engine inputs against bad/missing seed values (defensive). */
function sanitizeSeason(season: SeasonState): SeasonState {
  const pos = (n: number, fallback: number) =>
    Number.isFinite(n) && n > 0 ? n : fallback;
  const pct = (n: number, fallback: number) =>
    Number.isFinite(n) ? clamp(n, -60, 60) : fallback;
  return {
    ...season,
    plantingAreaHa: pos(season.plantingAreaHa, 1),
    baselineAreaHa: pos(season.baselineAreaHa, 1),
    expectedProductionT: pos(season.expectedProductionT, 1),
    medianProductionT: pos(season.medianProductionT, 1),
    capacityGrowthPct: pct(season.capacityGrowthPct, 5),
    marketCapacityT: {
      regular: pos(season.marketCapacityT.regular, 1),
      storage: pos(season.marketCapacityT.storage, 0),
      processing: pos(season.marketCapacityT.processing, 0),
      total: pos(season.marketCapacityT.total, 1),
    },
    weeksToHarvest: clamp(Math.round(season.weeksToHarvest) || 6, 1, 30),
    signalCoverage: clamp(season.signalCoverage || 0, 0, 100),
  };
}

export function runEngine(input: EngineInput): ScenarioResult {
  const { crop } = input;
  const season = sanitizeSeason(input.season);
  const plantingDeltaPct = clamp(input.plantingDeltaPct ?? 0, -50, 60);
  const capacityDeltaPct = clamp(input.capacityDeltaPct ?? 0, -30, 30);

  // --- supply side ---------------------------------------------------------
  const scenarioAreaHa = season.plantingAreaHa * (1 + plantingDeltaPct / 100);
  const areaDeltaPct =
    ((scenarioAreaHa - season.baselineAreaHa) / season.baselineAreaHa) * 100;
  const scenarioProductionT =
    season.expectedProductionT * (1 + AREA_ELASTICITY * (plantingDeltaPct / 100));
  const productionChangePct =
    (scenarioProductionT / season.medianProductionT - 1) * 100;

  // --- demand side ---------------------------------------------------------
  const capacity = { ...season.marketCapacityT };
  if (capacityDeltaPct !== 0) {
    const f = 1 + capacityDeltaPct / 100;
    capacity.regular *= f;
    capacity.storage *= f;
    capacity.processing *= f;
  }
  capacity.total = capacity.regular + capacity.storage + capacity.processing;

  const expectedArrivalsT = scenarioProductionT * ARRIVALS_SHARE;
  const oversupplyGapT = Math.max(0, expectedArrivalsT - capacity.total);
  const oversupplyGapPct = (oversupplyGapT / capacity.total) * 100;
  const absorptionUtilizationPct = (expectedArrivalsT / capacity.total) * 100;

  // --- risk score (linear in utilization) -----------------------------------
  // Calibrated against the reference season (Nashik rabi onion):
  //   baseline utilization ≈ 108.7% → risk 82
  //   +10% planting → 91 · diversify (−23%) → 61
  const risk = clamp(1.06 * absorptionUtilizationPct - 33.2, 2, 98);

  // --- uncertainty ----------------------------------------------------------
  // Confidence falls with lower signal coverage and scenario extrapolation.
  // Calibrated so the reference season (coverage 67, medium-high) → 79%.
  const scenarioPenalty = clamp(Math.abs(plantingDeltaPct) * 0.35, 0, 12);
  const confidence = clamp(
    season.signalCoverage * 0.75 +
      CONFIDENCE_BY_LABEL[season.signalConfidence] * 0.5 -
      scenarioPenalty,
    35,
    88,
  );
  const halfWidth = Math.max(3, Math.round((100 - confidence) * 0.28));
  const riskRange: [number, number] = [
    clamp(Math.round(risk - halfWidth), 1, 99),
    clamp(Math.round(risk + halfWidth), 1, 99),
  ];

  // --- drivers (SHAP-style signed contributions) ----------------------------
  // Each driver's raw contribution ≈ its share of the distance above the
  // neutral point (risk 50). Negative when it pushes risk down.
  const drivers: RiskDriver[] = [];
  const pushDriver = (
    id: string,
    label: string,
    contribution: number,
    note: string,
  ) => {
    const impact = Math.min(100, Math.abs(contribution) * 3.2);
    const tier =
      impact >= 60
        ? "high"
        : impact >= 45
          ? "medium-high"
          : impact >= 25
            ? "medium"
            : impact >= 12
              ? "low-medium"
              : "low";
    drivers.push({ id, label, contribution, impact, tier, note });
  };

  const plantingContribution =
    (areaDeltaPct / 100) * FEATURE_WEIGHTS.planting * 400;
  pushDriver(
    "planting",
    "Planting signal",
    plantingContribution,
    `${areaDeltaPct >= 0 ? "+" : ""}${areaDeltaPct.toFixed(1)}% area vs 5-yr median`,
  );
  pushDriver(
    "glut-pattern",
    "Historical glut pattern",
    (season.weeksToHarvest <= 8 ? 1 : 0.55) * FEATURE_WEIGHTS.historicalGlut * 90,
    "3 of last 5 seasons oversupplied at this point",
  );
  pushDriver(
    "production",
    "Expected production",
    (productionChangePct / 100) * FEATURE_WEIGHTS.production * 120,
    `${productionChangePct >= 0 ? "+" : ""}${productionChangePct.toFixed(0)}% vs median season`,
  );
  pushDriver(
    "arrivals",
    "Market arrivals trend",
    FEATURE_WEIGHTS.arrivals * 120 * (0.5 + oversupplyGapPct / 120),
    `gap ≈ ${oversupplyGapPct.toFixed(0)}% of absorption capacity`,
  );
  pushDriver(
    "weather",
    "Rainfall conditions",
    season.signalCoverage >= 60 ? 5 : 3,
    "post-monsoon receding; neutral to slight +",
  );

  // Re-center so contributions sum to the DISPLAYED score's deviation from
  // neutral (glutRisk − 50), exactly like SHAP — including after rounding,
  // via a residual adjustment on the largest driver. Keeps the UI footer's
  // "contributions sum to the deviation" claim literally true.
  const sum = drivers.reduce((acc, d) => acc + d.contribution, 0);
  const target = Math.round(risk) - 50;
  const scale = target !== 0 && sum !== 0 ? target / sum : 0;
  const driversScaled: RiskDriver[] = drivers.map((d) => ({
    ...d,
    contribution: Math.round(d.contribution * scale * 10) / 10,
  }));
  if (target !== 0 && driversScaled.length > 0) {
    const residual =
      Math.round((target - driversScaled.reduce((a, d) => a + d.contribution, 0)) * 10) / 10;
    if (residual !== 0) {
      const idx = driversScaled.reduce(
        (best, d, i) =>
          Math.abs(d.contribution) > Math.abs(driversScaled[best].contribution) ? i : best,
        0,
      );
      driversScaled[idx] = {
        ...driversScaled[idx],
        contribution: Math.round((driversScaled[idx].contribution + residual) * 10) / 10,
      };
    }
  }

  return {
    plantingDeltaPct,
    capacityDeltaPct,
    risk: {
      regionId: input.regionId,
      cropId: crop.id,
      glutRisk: Math.round(risk),
      riskRange,
      band: band(risk),
      confidence: Math.round(confidence),
      expectedProductionT: scenarioProductionT,
      expectedArrivalsT,
      productionChangePct,
      absorptionPct: absorptionUtilizationPct,
      capacityGrowthPct: season.capacityGrowthPct,
      supplyGapPct: productionChangePct - season.capacityGrowthPct,
      oversupplyGapT,
      oversupplyGapPct,
      drivers: driversScaled,
      weeksToHarvest: season.weeksToHarvest,
      modelVersion: MODEL_VERSION,
      signalSource: "simulated-fpo-stream",
      reportCount: season.reportCount,
    },
  };
}

export type { RiskAssessment };
