/**
 * Maharashtra district seed table — every district with meaningful cultivated
 * onion area (34 of 36; the two Mumbai City districts are excluded, see
 * EXCLUDED_DISTRICTS below).
 *
 * These are STRUCTURED PROTOTYPE SEEDS, not live government data. Magnitudes
 * are calibrated to realistic rabi-onion shares so the risk engine behaves
 * like a production model, and every value flows through the engine — no
 * component reads this table directly for display numbers (except to pick
 * which region is active).
 *
 * Per-district primitives:
 *   baselineAreaHa  5-yr median onion area (ha)
 *   deviationPct    current planting deviation vs baseline, from the
 *                   simulated FPO/farmer signal stream
 *   yieldTPerHa     expected yield for the season
 *   capacityRatio   absorption capacity as a share of median production
 *   villages        taluka / mandi nodes — first entry is the major APMC node
 */

export interface VillageSeed {
  name: string;
  /** Major APMC market node for the district. */
  mandi: boolean;
  /** Share of district planting area around this node (weights normalized). */
  weight: number;
}

export interface DistrictSeed {
  id: string;
  name: string;
  lat: number;
  lon: number;
  baselineAreaHa: number;
  deviationPct: number;
  yieldTPerHa: number;
  capacityRatio: number;
  capacityGrowthPct: number;
  /** Signal-stream coverage, % of monitored area covered by reports. */
  coverage: number;
  weeksToHarvest: number;
  villages: VillageSeed[];
}

const V = (names: string[]): VillageSeed[] =>
  names.map((name, i) => ({
    name,
    mandi: i === 0,
    // Descending weights: the mandi hub district reports the most.
    weight: [0.24, 0.19, 0.16, 0.15, 0.14, 0.12][i] ?? 0.1,
  }));

export const DISTRICTS: DistrictSeed[] = [
  // --- core onion belt (hero districts, calibration-critical) ---
  { id: "nashik", name: "Nashik", lat: 19.997, lon: 73.79, baselineAreaHa: 108_000, deviationPct: 18.5, yieldTPerHa: 11.05, capacityRatio: 1.037, capacityGrowthPct: 12, coverage: 67, weeksToHarvest: 6, villages: V(["Lasalgaon", "Dindori", "Sinnar", "Kalwan", "Pimpalgaon Baswant", "Yeola"]) },
  { id: "ahmednagar", name: "Ahmednagar", lat: 19.09, lon: 74.74, baselineAreaHa: 84_600, deviationPct: 11.35, yieldTPerHa: 11.05, capacityRatio: 0.9476, capacityGrowthPct: 9, coverage: 54, weeksToHarvest: 7, villages: V(["Rahata", "Shrirampur", "Pathardi", "Shevgaon", "Jamkhed"]) },
  { id: "pune", name: "Pune", lat: 18.52, lon: 73.86, baselineAreaHa: 81_000, deviationPct: 6.67, yieldTPerHa: 11.05, capacityRatio: 0.9721, capacityGrowthPct: 8, coverage: 58, weeksToHarvest: 7, villages: V(["Baramati", "Junnar", "Indapur", "Shirur", "Haveli"]) },
  { id: "solapur", name: "Solapur", lat: 17.66, lon: 75.9, baselineAreaHa: 57_900, deviationPct: 1.38, yieldTPerHa: 11.05, capacityRatio: 0.9531, capacityGrowthPct: 7, coverage: 49, weeksToHarvest: 8, villages: V(["Pandharpur", "Mangalwedha", "Barshi", "Malshiras", "Mohol"]) },
  { id: "satara", name: "Satara", lat: 17.69, lon: 74.0, baselineAreaHa: 42_500, deviationPct: -2.82, yieldTPerHa: 11.05, capacityRatio: 0.9574, capacityGrowthPct: 6, coverage: 44, weeksToHarvest: 8, villages: V(["Wai", "Koregaon", "Khatav", "Karad", "Phaltan"]) },

  // --- Marathwada ---
  { id: "jalna", name: "Jalna", lat: 19.84, lon: 75.88, baselineAreaHa: 48_000, deviationPct: 10, yieldTPerHa: 10.6, capacityRatio: 0.94, capacityGrowthPct: 8, coverage: 52, weeksToHarvest: 7, villages: V(["Badnapur", "Bhokardan", "Partur", "Ambad", "Ghansawangi"]) },
  { id: "beed", name: "Beed", lat: 18.99, lon: 75.27, baselineAreaHa: 46_000, deviationPct: 9, yieldTPerHa: 10.6, capacityRatio: 0.95, capacityGrowthPct: 7, coverage: 51, weeksToHarvest: 8, villages: V(["Georai", "Ashti", "Ambajogai", "Patoda", "Wadwani"]) },
  { id: "aurangabad", name: "Aurangabad", lat: 19.88, lon: 75.34, baselineAreaHa: 44_000, deviationPct: 7, yieldTPerHa: 10.6, capacityRatio: 0.96, capacityGrowthPct: 7, coverage: 53, weeksToHarvest: 7, villages: V(["Paithan", "Kannad", "Vaijapur", "Gangapur", "Phulambri"]) },
  { id: "latur", name: "Latur", lat: 18.4, lon: 76.86, baselineAreaHa: 28_000, deviationPct: 5, yieldTPerHa: 10.6, capacityRatio: 0.96, capacityGrowthPct: 6, coverage: 47, weeksToHarvest: 8, villages: V(["Nilanga", "Ausa", "Ahmadpur", "Renapur", "Latur"]) },
  { id: "dharashiv", name: "Dharashiv", lat: 18.19, lon: 76.04, baselineAreaHa: 26_000, deviationPct: 2, yieldTPerHa: 10.6, capacityRatio: 0.97, capacityGrowthPct: 6, coverage: 45, weeksToHarvest: 8, villages: V(["Tuljapur", "Bhum", "Kalamb", "Paranda", "Umarga"]) },
  { id: "nanded", name: "Nanded", lat: 19.15, lon: 77.32, baselineAreaHa: 24_000, deviationPct: 1, yieldTPerHa: 10.6, capacityRatio: 0.98, capacityGrowthPct: 5, coverage: 44, weeksToHarvest: 8, villages: V(["Deglur", "Mukhed", "Biloli", "Kandhar", "Mudkhed"]) },
  { id: "parbhani", name: "Parbhani", lat: 19.27, lon: 76.78, baselineAreaHa: 20_000, deviationPct: 3, yieldTPerHa: 10.6, capacityRatio: 0.97, capacityGrowthPct: 5, coverage: 43, weeksToHarvest: 9, villages: V(["Manwat", "Jintur", "Gangakhed", "Sonpeth", "Purna"]) },
  { id: "hingoli", name: "Hingoli", lat: 19.72, lon: 77.15, baselineAreaHa: 16_000, deviationPct: 2, yieldTPerHa: 10.6, capacityRatio: 0.98, capacityGrowthPct: 5, coverage: 42, weeksToHarvest: 9, villages: V(["Kalamnuri", "Basmath", "Sengaon", "Aundha", "Hingoli"]) },

  // --- west Maharashtra ---
  { id: "sangli", name: "Sangli", lat: 16.85, lon: 74.58, baselineAreaHa: 38_000, deviationPct: 9, yieldTPerHa: 11.05, capacityRatio: 0.96, capacityGrowthPct: 7, coverage: 52, weeksToHarvest: 7, villages: V(["Miraj", "Tasgaon", "Walwa", "Khanapur", "Jat"]) },
  { id: "kolhapur", name: "Kolhapur", lat: 16.7, lon: 74.24, baselineAreaHa: 22_000, deviationPct: 0, yieldTPerHa: 11.05, capacityRatio: 0.99, capacityGrowthPct: 5, coverage: 46, weeksToHarvest: 8, villages: V(["Gadhinglaj", "Panhala", "Hatkanangale", "Shirol", "Kagal"]) },

  // --- Khandesh / north Maharashtra ---
  { id: "dhule", name: "Dhule", lat: 20.9, lon: 74.77, baselineAreaHa: 32_000, deviationPct: 6, yieldTPerHa: 10.8, capacityRatio: 0.95, capacityGrowthPct: 6, coverage: 48, weeksToHarvest: 8, villages: V(["Sindkheda", "Sakri", "Shirpur", "Kusumba", "Songir"]) },
  { id: "nandurbar", name: "Nandurbar", lat: 21.37, lon: 74.24, baselineAreaHa: 18_000, deviationPct: -1, yieldTPerHa: 10.8, capacityRatio: 1.02, capacityGrowthPct: 5, coverage: 40, weeksToHarvest: 9, villages: V(["Shahada", "Taloda", "Navapur", "Dhadgaon", "Nandurbar"]) },
  { id: "jalgaon", name: "Jalgaon", lat: 21.01, lon: 75.56, baselineAreaHa: 30_000, deviationPct: 3, yieldTPerHa: 10.8, capacityRatio: 0.97, capacityGrowthPct: 6, coverage: 47, weeksToHarvest: 8, villages: V(["Raver", "Chopda", "Erandol", "Amalner", "Chalisgaon"]) },
  { id: "buldhana", name: "Buldhana", lat: 20.53, lon: 76.18, baselineAreaHa: 35_000, deviationPct: 4, yieldTPerHa: 10.8, capacityRatio: 0.96, capacityGrowthPct: 6, coverage: 46, weeksToHarvest: 8, villages: V(["Khamgaon", "Malkapur", "Chikhli", "Jalgaon Jamod", "Shegaon"]) },

  // --- Vidarbha ---
  { id: "akola", name: "Akola", lat: 20.7, lon: 77.0, baselineAreaHa: 14_000, deviationPct: 0, yieldTPerHa: 10.2, capacityRatio: 1.05, capacityGrowthPct: 5, coverage: 41, weeksToHarvest: 9, villages: V(["Akot", "Telhara", "Balapur", "Barshitakli", "Patur"]) },
  { id: "amravati", name: "Amravati", lat: 20.93, lon: 77.75, baselineAreaHa: 16_000, deviationPct: -1, yieldTPerHa: 10.2, capacityRatio: 1.04, capacityGrowthPct: 5, coverage: 42, weeksToHarvest: 9, villages: V(["Achalpur", "Chandur Bazar", "Daryapur", "Morshi", "Warud"]) },
  { id: "washim", name: "Washim", lat: 20.11, lon: 77.13, baselineAreaHa: 10_000, deviationPct: -3, yieldTPerHa: 10.2, capacityRatio: 1.08, capacityGrowthPct: 4, coverage: 38, weeksToHarvest: 9, villages: V(["Risod", "Karanja", "Manora", "Mangrulpir", "Malegaon"]) },
  { id: "yavatmal", name: "Yavatmal", lat: 20.39, lon: 78.13, baselineAreaHa: 12_000, deviationPct: -2, yieldTPerHa: 10.2, capacityRatio: 1.06, capacityGrowthPct: 4, coverage: 39, weeksToHarvest: 10, villages: V(["Pusad", "Umarkhed", "Digras", "Darwha", "Ghatanji"]) },
  { id: "wardha", name: "Wardha", lat: 20.75, lon: 78.6, baselineAreaHa: 8_000, deviationPct: -4, yieldTPerHa: 10.2, capacityRatio: 1.1, capacityGrowthPct: 4, coverage: 37, weeksToHarvest: 10, villages: V(["Arvi", "Deoli", "Seloo", "Hinganghat", "Wardha"]) },
  { id: "nagpur", name: "Nagpur", lat: 21.15, lon: 79.09, baselineAreaHa: 7_000, deviationPct: -2, yieldTPerHa: 10.2, capacityRatio: 1.1, capacityGrowthPct: 4, coverage: 38, weeksToHarvest: 10, villages: V(["Katol", "Narkhed", "Kamptee", "Ramtek", "Umred"]) },
  { id: "bhandara", name: "Bhandara", lat: 21.17, lon: 79.65, baselineAreaHa: 6_000, deviationPct: -3, yieldTPerHa: 10.2, capacityRatio: 1.12, capacityGrowthPct: 3, coverage: 36, weeksToHarvest: 10, villages: V(["Tumsar", "Sakoli", "Lakhani", "Mohadi", "Bhandara"]) },
  { id: "gondia", name: "Gondia", lat: 21.46, lon: 80.19, baselineAreaHa: 5_000, deviationPct: -5, yieldTPerHa: 10.2, capacityRatio: 1.14, capacityGrowthPct: 3, coverage: 34, weeksToHarvest: 10, villages: V(["Tirora", "Gondia", "Sadak Arjuni", "Salekasa", "Amgaon"]) },
  { id: "chandrapur", name: "Chandrapur", lat: 19.97, lon: 79.3, baselineAreaHa: 6_000, deviationPct: -3, yieldTPerHa: 10.2, capacityRatio: 1.12, capacityGrowthPct: 3, coverage: 36, weeksToHarvest: 10, villages: V(["Warora", "Bramhapuri", "Rajura", "Ballarpur", "Chimur"]) },
  { id: "gadchiroli", name: "Gadchiroli", lat: 20.1, lon: 80.0, baselineAreaHa: 4_000, deviationPct: -6, yieldTPerHa: 10.2, capacityRatio: 1.16, capacityGrowthPct: 3, coverage: 33, weeksToHarvest: 11, villages: V(["Desaiganj", "Armori", "Kurkheda", "Dhanora", "Gadchiroli"]) },

  // --- Konkan / coastal (small onion area, horticulture-leaning) ---
  { id: "raigad", name: "Raigad", lat: 18.08, lon: 73.42, baselineAreaHa: 6_000, deviationPct: 0, yieldTPerHa: 8.8, capacityRatio: 1.15, capacityGrowthPct: 3, coverage: 38, weeksToHarvest: 10, villages: V(["Mahad", "Roha", "Alibag", "Pen", "Panvel"]) },
  { id: "palghar", name: "Palghar", lat: 19.7, lon: 72.76, baselineAreaHa: 9_000, deviationPct: 1, yieldTPerHa: 8.8, capacityRatio: 1.15, capacityGrowthPct: 4, coverage: 40, weeksToHarvest: 10, villages: V(["Dahanu", "Talasari", "Jawhar", "Vikramgad", "Palghar"]) },
  { id: "thane", name: "Thane", lat: 19.22, lon: 73.1, baselineAreaHa: 4_000, deviationPct: -1, yieldTPerHa: 8.8, capacityRatio: 1.18, capacityGrowthPct: 3, coverage: 37, weeksToHarvest: 11, villages: V(["Shahapur", "Murbad", "Bhiwandi", "Kalyan", "Ambarnath"]) },
  { id: "ratnagiri", name: "Ratnagiri", lat: 16.99, lon: 73.31, baselineAreaHa: 4_000, deviationPct: -3, yieldTPerHa: 8.8, capacityRatio: 1.18, capacityGrowthPct: 3, coverage: 35, weeksToHarvest: 11, villages: V(["Lanja", "Rajapur", "Sangameshwar", "Chiplun", "Ratnagiri"]) },
  { id: "sindhudurg", name: "Sindhudurg", lat: 16.05, lon: 73.72, baselineAreaHa: 3_000, deviationPct: -4, yieldTPerHa: 8.8, capacityRatio: 1.2, capacityGrowthPct: 3, coverage: 34, weeksToHarvest: 11, villages: V(["Kankavli", "Kudal", "Malvan", "Vengurla", "Sawantwadi"]) },
];

/**
 * Districts deliberately NOT monitored: negligible cultivated area
 * (dense urban). Surfacing this explicitly is part of the data-honesty
 * contract — a real deployment would show the same exclusion note.
 */
export const EXCLUDED_DISTRICTS: { name: string; reason: string }[] = [
  { name: "Mumbai City", reason: "negligible cultivated area" },
  { name: "Mumbai Suburban", reason: "negligible cultivated area" },
];

/** Hero districts pinned at the top of the switcher (demo path). */
export const HERO_DISTRICT_IDS = ["nashik", "ahmednagar", "pune", "solapur", "satara"] as const;

export function districtSeedById(id: string): DistrictSeed | undefined {
  return DISTRICTS.find((d) => d.id === id);
}
