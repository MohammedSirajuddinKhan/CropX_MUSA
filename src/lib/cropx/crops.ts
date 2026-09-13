import type { Crop } from "./types";

/**
 * Vegetable crop catalog — anchored to REAL Indian statistics.
 *
 * Sources (cited per crop):
 *  - [PIB-FE-2024-25] GoI Final Estimates of Horticultural Crops 2024-25,
 *    released Mar 2026 (onion area 19.68 lakh ha, production 307.67 lakh t;
 *    onion area up 27.7% from 15.41 lakh ha in 2023-24 — the documented
 *    oversupply formation this product exists to catch).
 *  - [HSAAG-2023] Horticultural Statistics at a Glance 2023, MoA&FW
 *    (all-India area/production/yield by vegetable, 2021-23 reference years).
 *  - [MH] Maharashtra state averages: agri-economics literature on the
 *    onion belt (14.46 t/ha) and CEE district case study for tomato
 *    (56,600 ha → 11.90 lakh t). Minor-vegetables state yields are the
 *    all-India average adjusted with documented Maharashtra shares.
 *
 * Units: 1 lakh ha = 100,000 ha. Area/production figures are official;
 * district-level splits (dataset.ts) are DERIVED from these state totals
 * plus documented district specialization, and every simulated input is
 * labeled as such in the UI.
 */

interface CropSeed {
  id: string;
  name: string;
  harvestStartWeeks: number;
  /** Share of production that reaches markets (rest stored/retained on-farm). */
  arrivalsShare: number;
  indiaAreaLakhHa: number;
  indiaProductionLakhT: number;
  mhShareOfIndia: number;
  mhYieldTPerHa: number;
  perishability: number;
  storageWeeks: number;
  seasonWindowShare: number;
  baseCapacityRatio: number;
  signalFactor: number;
  historyNote: string;
  provenance: Crop["provenance"];
}

const SEEDS: CropSeed[] = [
  {
    id: "onion",
    name: "Onion",
    harvestStartWeeks: 6,
    arrivalsShare: 0.86,
    indiaAreaLakhHa: 19.68,
    indiaProductionLakhT: 307.67,
    mhShareOfIndia: 0.37,
    mhYieldTPerHa: 14.46,
    perishability: 0.35,
    storageWeeks: 24,
    seasonWindowShare: 0.6,
    // Onion absorption capacity = district infra index only (the reference
    // calibration embeds infra directly); deeper-storage crops use >1.
    baseCapacityRatio: 1.0,
    signalFactor: 1.0,
    historyNote: "3 of last 5 seasons oversupplied at this point; 2024-25 all-India area +27.7% YoY",
    provenance: { kind: "official", source: "GoI Final Estimates 2024-25 (PIB) + MH agri-econ yield", year: "2024-25" },
  },
  {
    id: "tomato",
    name: "Tomato",
    harvestStartWeeks: 5,
    arrivalsShare: 0.96,
    indiaAreaLakhHa: 8.42,
    indiaProductionLakhT: 204.0,
    mhShareOfIndia: 0.067,
    mhYieldTPerHa: 21.0,
    perishability: 0.9,
    storageWeeks: 1.5,
    seasonWindowShare: 0.15,
    baseCapacityRatio: 0.95,
    signalFactor: 0.88,
    historyNote: "repeated crash cycles after supply spikes (2023, 2024); market clears within days",
    provenance: { kind: "official", source: "HSAAG 2023 + CEE Maharashtra tomato study", year: "2022-23" },
  },
  {
    id: "potato",
    name: "Potato",
    harvestStartWeeks: 10,
    arrivalsShare: 0.8,
    indiaAreaLakhHa: 23.9,
    indiaProductionLakhT: 570.4,
    mhShareOfIndia: 0.045,
    mhYieldTPerHa: 25.0,
    perishability: 0.25,
    storageWeeks: 36,
    seasonWindowShare: 0.85,
    baseCapacityRatio: 1.02,
    signalFactor: 0.92,
    historyNote: "cold-storage overhang distorts spring arrivals; 2024-25 production −5.4% YoY",
    provenance: { kind: "official", source: "GoI 2nd Advance Estimates 2024-25", year: "2024-25" },
  },
  {
    id: "brinjal",
    name: "Brinjal",
    harvestStartWeeks: 4,
    arrivalsShare: 0.93,
    indiaAreaLakhHa: 7.36,
    indiaProductionLakhT: 128.6,
    mhShareOfIndia: 0.06,
    mhYieldTPerHa: 16.0,
    perishability: 0.7,
    storageWeeks: 2,
    seasonWindowShare: 0.15,
    baseCapacityRatio: 0.94,
    signalFactor: 0.75,
    historyNote: "near year-round harvest; price stress follows planting clusters",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "cabbage",
    name: "Cabbage",
    harvestStartWeeks: 6,
    arrivalsShare: 0.95,
    indiaAreaLakhHa: 4.03,
    indiaProductionLakhT: 91.9,
    mhShareOfIndia: 0.05,
    mhYieldTPerHa: 21.0,
    perishability: 0.6,
    storageWeeks: 4,
    seasonWindowShare: 0.2,
    baseCapacityRatio: 0.95,
    signalFactor: 0.78,
    historyNote: "winter concentration; oversupply episodes track cool-season area",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "cauliflower",
    name: "Cauliflower",
    harvestStartWeeks: 7,
    arrivalsShare: 0.95,
    indiaAreaLakhHa: 4.69,
    indiaProductionLakhT: 88.3,
    mhShareOfIndia: 0.05,
    mhYieldTPerHa: 17.5,
    perishability: 0.85,
    storageWeeks: 2,
    seasonWindowShare: 0.25,
    baseCapacityRatio: 0.94,
    signalFactor: 0.78,
    historyNote: "tight winter window; gluts form and clear inside 3 weeks",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "okra",
    name: "Okra (bhindi)",
    harvestStartWeeks: 3,
    arrivalsShare: 0.97,
    indiaAreaLakhHa: 5.25,
    indiaProductionLakhT: 63.5,
    mhShareOfIndia: 0.08,
    mhYieldTPerHa: 11.5,
    perishability: 0.95,
    storageWeeks: 1,
    seasonWindowShare: 0.15,
    baseCapacityRatio: 0.92,
    signalFactor: 0.7,
    historyNote: "most perishable major vegetable; no storage buffer at all",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "green-chilli",
    name: "Green chilli",
    harvestStartWeeks: 5,
    arrivalsShare: 0.94,
    indiaAreaLakhHa: 4.15,
    indiaProductionLakhT: 47.5,
    mhShareOfIndia: 0.12,
    mhYieldTPerHa: 10.8,
    perishability: 0.75,
    storageWeeks: 2,
    seasonWindowShare: 0.2,
    baseCapacityRatio: 0.93,
    signalFactor: 0.72,
    historyNote: "Nashik belt concentration; price spikes/crashes alternate seasonally",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "garlic",
    name: "Garlic",
    harvestStartWeeks: 12,
    arrivalsShare: 0.84,
    indiaAreaLakhHa: 3.62,
    indiaProductionLakhT: 30.4,
    mhShareOfIndia: 0.1,
    mhYieldTPerHa: 8.0,
    perishability: 0.3,
    storageWeeks: 30,
    seasonWindowShare: 0.7,
    baseCapacityRatio: 1.0,
    signalFactor: 0.8,
    historyNote: "storable like onion; 2024-25 area expansion echoed onion's",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "green-peas",
    name: "Green peas",
    harvestStartWeeks: 9,
    arrivalsShare: 0.93,
    indiaAreaLakhHa: 4.5,
    indiaProductionLakhT: 57.8,
    mhShareOfIndia: 0.07,
    mhYieldTPerHa: 12.0,
    perishability: 0.8,
    storageWeeks: 2,
    seasonWindowShare: 0.85,
    baseCapacityRatio: 0.95,
    signalFactor: 0.75,
    historyNote: "single winter window; arrivals pile up in 4-5 weeks",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "bitter-gourd",
    name: "Bitter gourd",
    harvestStartWeeks: 4,
    arrivalsShare: 0.96,
    indiaAreaLakhHa: 1.24,
    indiaProductionLakhT: 11.8,
    mhShareOfIndia: 0.15,
    mhYieldTPerHa: 9.0,
    perishability: 0.9,
    storageWeeks: 1,
    seasonWindowShare: 0.12,
    baseCapacityRatio: 0.92,
    signalFactor: 0.68,
    historyNote: "small crop, thin markets; local gluts clear fast",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "bottle-gourd",
    name: "Bottle gourd",
    harvestStartWeeks: 4,
    arrivalsShare: 0.96,
    indiaAreaLakhHa: 1.63,
    indiaProductionLakhT: 21.4,
    mhShareOfIndia: 0.09,
    mhYieldTPerHa: 12.5,
    perishability: 0.9,
    storageWeeks: 1,
    seasonWindowShare: 0.12,
    baseCapacityRatio: 0.93,
    signalFactor: 0.68,
    historyNote: "perishable, thin markets; monitoring value is local",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "radish",
    name: "Radish",
    harvestStartWeeks: 4,
    arrivalsShare: 0.95,
    indiaAreaLakhHa: 1.42,
    indiaProductionLakhT: 19.6,
    mhShareOfIndia: 0.06,
    mhYieldTPerHa: 13.0,
    perishability: 0.8,
    storageWeeks: 2,
    seasonWindowShare: 0.2,
    baseCapacityRatio: 0.94,
    signalFactor: 0.7,
    historyNote: "fast cycles; gluts appear within a single planting round",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "carrot",
    name: "Carrot",
    harvestStartWeeks: 6,
    arrivalsShare: 0.94,
    indiaAreaLakhHa: 1.28,
    indiaProductionLakhT: 16.2,
    mhShareOfIndia: 0.07,
    mhYieldTPerHa: 12.0,
    perishability: 0.7,
    storageWeeks: 3,
    seasonWindowShare: 0.25,
    baseCapacityRatio: 0.94,
    signalFactor: 0.7,
    historyNote: "winter window; demand steady so risk tracks supply only",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
  {
    id: "capsicum",
    name: "Capsicum",
    harvestStartWeeks: 5,
    arrivalsShare: 0.95,
    indiaAreaLakhHa: 0.5,
    indiaProductionLakhT: 7.1,
    mhShareOfIndia: 0.15,
    mhYieldTPerHa: 13.5,
    perishability: 0.85,
    storageWeeks: 1.5,
    seasonWindowShare: 0.15,
    baseCapacityRatio: 0.93,
    signalFactor: 0.72,
    historyNote: "polyhouse + open field mix; Pune/Nashik belt concentration",
    provenance: { kind: "derived", source: "HSAAG 2023 magnitudes", year: "2022-23" },
  },
];

export const CROPS: Crop[] = SEEDS.map((s) => {
  const indiaYieldTPerHa = s.indiaProductionLakhT * 100_000 / (s.indiaAreaLakhHa * 100_000);
  return {
    id: s.id,
    name: s.name,
    unit: "t",
    harvestStartWeeks: s.harvestStartWeeks,
    indiaAreaLakhHa: s.indiaAreaLakhHa,
    indiaProductionLakhT: s.indiaProductionLakhT,
    mhShareOfIndia: s.mhShareOfIndia,
    mhAreaHa: Math.round(s.indiaAreaLakhHa * s.mhShareOfIndia * 100_000),
    indiaYieldTPerHa: Math.round(indiaYieldTPerHa * 10) / 10,
    mhYieldTPerHa: s.mhYieldTPerHa,
    perishability: s.perishability,
    storageWeeks: s.storageWeeks,
    seasonWindowShare: s.seasonWindowShare,
    provenance: s.provenance,
  };
});

/** Seed fields the engine/dataset need but the public Crop type doesn't carry. */
export const CROP_INTERNAL: Record<
  string,
  {
    baseCapacityRatio: number;
    signalFactor: number;
    historyNote: string;
    /** Share of production reaching markets (complement retained/stored). */
    arrivalsShare: number;
  }
> = Object.fromEntries(
  SEEDS.map((s) => [
    s.id,
    {
      baseCapacityRatio: s.baseCapacityRatio,
      signalFactor: s.signalFactor,
      historyNote: s.historyNote,
      arrivalsShare: s.arrivalsShare,
    },
  ]),
);

export function cropById(id: string): Crop {
  return CROPS.find((c) => c.id === id) ?? CROPS[0];
}

/** Hero crop (v1 demo path). */
export const HERO_CROP_ID = "onion";
