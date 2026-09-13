/**
 * Maharashtra district seed table — every district with meaningful cultivated
 * vegetable area (34 of 36; the two Mumbai City districts are excluded, see
 * EXCLUDED_DISTRICTS below).
 *
 * REAL-DATA ANCHORING
 * -------------------
 * `baselineAreaHa`, `deviationPct`, `yieldTPerHa` and `capacityRatio` below
 * are the ONION anchors, calibrated to the GoI Final Estimates 2024-25
 * narrative (onion area +27.7% YoY nationally) and Maharashtra agri-econ
 * yield (14.46 t/ha). The hero demo (Nashik) lands at 82/91/61 exactly.
 *
 * `vegWeights` encode documented district specialization for the other
 * vegetables (Nashik tomato/capsicum belt, Pune pea/polyhouse belt, Nagpur
 * cotton-belt kitchen vegetables, etc.). They are RELATIVE weights —
 * dataset.ts normalizes them into each crop's state-area shares, so every
 * district × crop cell has data. Unlisted crops get a small default weight
 * (scattered cultivation everywhere).
 *
 * NOT live government data: district splits are DERIVED allocations
 * consistent with published state totals; the signal stream is SIMULATED.
 * Provenance labels travel with every number into the UI.
 */

export interface VillageSeed {
  name: string;
  /** Major APMC market node for the district. */
  mandi: boolean;
  /** Share of district planting area around this node (weights normalized). */
  weight: number;
}

/** Crop ids from crops.ts, abbreviated for the weight tables. */
export type VegKey =
  | "tomato" | "potato" | "brinjal" | "cabbage" | "cauliflower" | "okra"
  | "green-chilli" | "garlic" | "green-peas" | "bitter-gourd"
  | "bottle-gourd" | "radish" | "carrot" | "capsicum";

export interface DistrictSeed {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** 5-yr median ONION area (ha) — the calibration anchor. */
  baselineAreaHa: number;
  /** Current ONION planting deviation vs baseline, % (signal stream). */
  deviationPct: number;
  /** District market-infrastructure index (≈1 = average absorption depth). */
  infraIndex: number;
  /** Signal-stream coverage for onion, % of monitored area covered. */
  coverage: number;
  /** District infrastructure/market depth annual growth, %. */
  capacityGrowthPct: number;
  villages: VillageSeed[];
  /** Relative specialization weights per vegetable (normalized in dataset). */
  vegWeights: Partial<Record<VegKey, number>>;
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
  {
    id: "nashik", name: "Nashik", lat: 19.997, lon: 73.79,
    baselineAreaHa: 108_000, deviationPct: 18.5, infraIndex: 1.037, coverage: 67, capacityGrowthPct: 12,
    villages: V(["Lasalgaon", "Dindori", "Sinnar", "Kalwan", "Pimpalgaon Baswant", "Yeola"]),
    vegWeights: { tomato: 5, capsicum: 4.2, "green-chilli": 3.6, garlic: 2.8, cabbage: 2, cauliflower: 2, carrot: 2, "green-peas": 2, okra: 1.6, "bitter-gourd": 1.8, "bottle-gourd": 1.6, radish: 1.4, brinjal: 1.6, potato: 1 },
  },
  {
    id: "ahmednagar", name: "Ahmednagar", lat: 19.09, lon: 74.74,
    baselineAreaHa: 84_600, deviationPct: 11.35, infraIndex: 0.948, coverage: 54, capacityGrowthPct: 9,
    villages: V(["Rahata", "Shrirampur", "Pathardi", "Shevgaon", "Jamkhed"]),
    vegWeights: { tomato: 1.6, "green-chilli": 2, garlic: 2.4, cabbage: 1.6, cauliflower: 1.2, okra: 1.2, capsicum: 0.8, potato: 1.2, "green-peas": 1.2, "bitter-gourd": 1, "bottle-gourd": 1, radish: 1.2, carrot: 1, brinjal: 1.2 },
  },
  {
    id: "pune", name: "Pune", lat: 18.52, lon: 73.86,
    baselineAreaHa: 81_000, deviationPct: 6.67, infraIndex: 0.972, coverage: 58, capacityGrowthPct: 8,
    villages: V(["Baramati", "Junnar", "Indapur", "Shirur", "Haveli"]),
    vegWeights: { tomato: 3.2, capsicum: 4.4, "green-peas": 3.6, carrot: 2.8, cabbage: 2.4, cauliflower: 2.4, "green-chilli": 2.4, okra: 1.6, garlic: 2, potato: 1.6, "bitter-gourd": 1.6, "bottle-gourd": 2, radish: 2, brinjal: 1.8 },
  },
  {
    id: "solapur", name: "Solapur", lat: 17.66, lon: 75.9,
    baselineAreaHa: 57_900, deviationPct: 1.38, infraIndex: 0.953, coverage: 49, capacityGrowthPct: 7,
    villages: V(["Pandharpur", "Mangalwedha", "Barshi", "Malshiras", "Mohol"]),
    vegWeights: { tomato: 1.2, "green-chilli": 1.6, cabbage: 1.2, cauliflower: 0.8, okra: 1.2, garlic: 1.2, potato: 1, capsicum: 0.6, "green-peas": 0.8, "bitter-gourd": 0.8, "bottle-gourd": 1, radish: 0.8, carrot: 0.6, brinjal: 1 },
  },
  {
    id: "satara", name: "Satara", lat: 17.69, lon: 74.0,
    baselineAreaHa: 42_500, deviationPct: -2.82, infraIndex: 0.957, coverage: 44, capacityGrowthPct: 6,
    villages: V(["Wai", "Koregaon", "Khatav", "Karad", "Phaltan"]),
    vegWeights: { cabbage: 2, cauliflower: 2, "green-peas": 2, tomato: 1.2, carrot: 1.6, "green-chilli": 1, okra: 1, garlic: 1, potato: 0.8, capsicum: 1, "bitter-gourd": 0.8, "bottle-gourd": 0.8, radish: 1, brinjal: 0.9 },
  },

  // --- Marathwada ---
  {
    id: "jalna", name: "Jalna", lat: 19.84, lon: 75.88,
    baselineAreaHa: 48_000, deviationPct: 10, infraIndex: 0.94, coverage: 52, capacityGrowthPct: 8,
    villages: V(["Badnapur", "Bhokardan", "Partur", "Ambad", "Ghansawangi"]),
    vegWeights: { "green-chilli": 1.8, tomato: 1.4, cabbage: 1.2, cauliflower: 1, okra: 1.2, garlic: 1.4, "green-peas": 0.8, brinjal: 1.2, potato: 1, capsicum: 0.5, "bitter-gourd": 0.8, "bottle-gourd": 0.8, radish: 0.8, carrot: 0.5 },
  },
  {
    id: "beed", name: "Beed", lat: 18.99, lon: 75.27,
    baselineAreaHa: 46_000, deviationPct: 9, infraIndex: 0.95, coverage: 51, capacityGrowthPct: 7,
    villages: V(["Georai", "Ashti", "Ambajogai", "Patoda", "Wadwani"]),
    vegWeights: { "green-chilli": 1.5, tomato: 1.2, garlic: 1.4, cabbage: 1, cauliflower: 0.8, okra: 1.1, brinjal: 1.1, potato: 0.9, "green-peas": 0.7, capsicum: 0.4, "bitter-gourd": 0.7, "bottle-gourd": 0.7, radish: 0.7, carrot: 0.5 },
  },
  {
    id: "aurangabad", name: "Aurangabad", lat: 19.88, lon: 75.34,
    baselineAreaHa: 44_000, deviationPct: 7, infraIndex: 0.96, coverage: 53, capacityGrowthPct: 7,
    villages: V(["Paithan", "Kannad", "Vaijapur", "Gangapur", "Phulambri"]),
    vegWeights: { tomato: 1.3, "green-chilli": 1.3, cabbage: 1.2, cauliflower: 1, okra: 1.1, garlic: 1.1, "green-peas": 0.9, brinjal: 1.1, potato: 1, capsicum: 0.6, "bitter-gourd": 0.7, "bottle-gourd": 0.8, radish: 0.8, carrot: 0.6 },
  },
  {
    id: "latur", name: "Latur", lat: 18.4, lon: 76.86,
    baselineAreaHa: 28_000, deviationPct: 5, infraIndex: 0.96, coverage: 47, capacityGrowthPct: 6,
    villages: V(["Nilanga", "Ausa", "Ahmadpur", "Renapur", "Latur"]),
    vegWeights: { "green-chilli": 1.2, tomato: 1, cabbage: 0.9, cauliflower: 0.8, okra: 0.9, garlic: 0.9, "green-peas": 0.7, brinjal: 0.9, potato: 0.7, capsicum: 0.4, "bitter-gourd": 0.6, "bottle-gourd": 0.7, radish: 0.7, carrot: 0.5 },
  },
  {
    id: "dharashiv", name: "Dharashiv", lat: 18.19, lon: 76.04,
    baselineAreaHa: 26_000, deviationPct: 2, infraIndex: 0.97, coverage: 45, capacityGrowthPct: 6,
    villages: V(["Tuljapur", "Bhum", "Kalamb", "Paranda", "Umarga"]),
    vegWeights: { "green-chilli": 0.9, tomato: 0.8, cabbage: 0.7, cauliflower: 0.6, okra: 0.7, garlic: 0.8, "green-peas": 0.5, brinjal: 0.7, potato: 0.6, capsicum: 0.3, "bitter-gourd": 0.5, "bottle-gourd": 0.6, radish: 0.6, carrot: 0.4 },
  },
  {
    id: "nanded", name: "Nanded", lat: 19.15, lon: 77.32,
    baselineAreaHa: 24_000, deviationPct: 1, infraIndex: 0.98, coverage: 44, capacityGrowthPct: 5,
    villages: V(["Deglur", "Mukhed", "Biloli", "Kandhar", "Mudkhed"]),
    vegWeights: { "green-chilli": 1, tomato: 0.9, cabbage: 0.8, cauliflower: 0.7, okra: 0.8, brinjal: 0.9, garlic: 0.7, "green-peas": 0.5, potato: 0.6, capsicum: 0.3, "bitter-gourd": 0.6, "bottle-gourd": 0.7, radish: 0.7, carrot: 0.4 },
  },
  {
    id: "parbhani", name: "Parbhani", lat: 19.27, lon: 76.78,
    baselineAreaHa: 20_000, deviationPct: 3, infraIndex: 0.97, coverage: 43, capacityGrowthPct: 5,
    villages: V(["Manwat", "Jintur", "Gangakhed", "Sonpeth", "Purna"]),
    vegWeights: { "green-chilli": 0.8, tomato: 0.7, cabbage: 0.6, cauliflower: 0.5, okra: 0.7, brinjal: 0.7, garlic: 0.6, "green-peas": 0.4, potato: 0.5, capsicum: 0.25, "bitter-gourd": 0.5, "bottle-gourd": 0.5, radish: 0.5, carrot: 0.3 },
  },
  {
    id: "hingoli", name: "Hingoli", lat: 19.72, lon: 77.15,
    baselineAreaHa: 16_000, deviationPct: 2, infraIndex: 0.98, coverage: 42, capacityGrowthPct: 5,
    villages: V(["Kalamnuri", "Basmath", "Sengaon", "Aundha", "Hingoli"]),
    vegWeights: { "green-chilli": 0.6, tomato: 0.6, cabbage: 0.5, cauliflower: 0.4, okra: 0.5, brinjal: 0.5, garlic: 0.5, "green-peas": 0.3, potato: 0.4, capsicum: 0.2, "bitter-gourd": 0.4, "bottle-gourd": 0.4, radish: 0.4, carrot: 0.25 },
  },

  // --- west Maharashtra ---
  {
    id: "sangli", name: "Sangli", lat: 16.85, lon: 74.58,
    baselineAreaHa: 38_000, deviationPct: 9, infraIndex: 0.96, coverage: 52, capacityGrowthPct: 7,
    villages: V(["Miraj", "Tasgaon", "Walwa", "Khanapur", "Jat"]),
    vegWeights: { "green-chilli": 1.6, tomato: 1, cabbage: 0.9, cauliflower: 0.7, okra: 0.9, garlic: 0.9, "green-peas": 0.7, brinjal: 0.8, potato: 0.7, capsicum: 0.5, "bitter-gourd": 0.7, "bottle-gourd": 0.7, radish: 0.7, carrot: 0.5 },
  },
  {
    id: "kolhapur", name: "Kolhapur", lat: 16.7, lon: 74.24,
    baselineAreaHa: 22_000, deviationPct: 0, infraIndex: 0.99, coverage: 46, capacityGrowthPct: 5,
    villages: V(["Gadhinglaj", "Panhala", "Hatkanangale", "Shirol", "Kagal"]),
    vegWeights: { cabbage: 1.2, cauliflower: 1, "green-peas": 0.9, tomato: 0.9, okra: 0.8, brinjal: 0.8, "green-chilli": 0.8, garlic: 0.6, potato: 0.7, capsicum: 0.4, "bitter-gourd": 0.6, "bottle-gourd": 0.7, radish: 0.7, carrot: 0.5 },
  },

  // --- Khandesh / north Maharashtra ---
  {
    id: "dhule", name: "Dhule", lat: 20.9, lon: 74.77,
    baselineAreaHa: 32_000, deviationPct: 6, infraIndex: 0.95, coverage: 48, capacityGrowthPct: 6,
    villages: V(["Sindkheda", "Sakri", "Shirpur", "Kusumba", "Songir"]),
    vegWeights: { "green-chilli": 1.3, tomato: 1.1, cabbage: 0.9, cauliflower: 0.7, okra: 0.9, brinjal: 0.9, garlic: 0.8, "green-peas": 0.6, potato: 0.7, capsicum: 0.4, "bitter-gourd": 0.6, "bottle-gourd": 0.6, radish: 0.6, carrot: 0.4 },
  },
  {
    id: "nandurbar", name: "Nandurbar", lat: 21.37, lon: 74.24,
    baselineAreaHa: 18_000, deviationPct: -1, infraIndex: 1.02, coverage: 40, capacityGrowthPct: 5,
    villages: V(["Shahada", "Taloda", "Navapur", "Dhadgaon", "Nandurbar"]),
    vegWeights: { "green-chilli": 0.7, tomato: 0.6, okra: 0.6, brinjal: 0.6, cabbage: 0.5, cauliflower: 0.4, garlic: 0.4, "green-peas": 0.3, potato: 0.4, capsicum: 0.2, "bitter-gourd": 0.4, "bottle-gourd": 0.4, radish: 0.4, carrot: 0.2 },
  },
  {
    id: "jalgaon", name: "Jalgaon", lat: 21.01, lon: 75.56,
    baselineAreaHa: 30_000, deviationPct: 3, infraIndex: 0.97, coverage: 47, capacityGrowthPct: 6,
    villages: V(["Raver", "Chopda", "Erandol", "Amalner", "Chalisgaon"]),
    vegWeights: { potato: 1.4, tomato: 1.1, "green-chilli": 1.1, brinjal: 0.9, okra: 0.9, cabbage: 0.8, cauliflower: 0.6, garlic: 0.8, "green-peas": 0.5, capsicum: 0.4, "bitter-gourd": 0.6, "bottle-gourd": 0.6, radish: 0.6, carrot: 0.4 },
  },
  {
    id: "buldhana", name: "Buldhana", lat: 20.53, lon: 76.18,
    baselineAreaHa: 35_000, deviationPct: 4, infraIndex: 0.96, coverage: 46, capacityGrowthPct: 6,
    villages: V(["Khamgaon", "Malkapur", "Chikhli", "Jalgaon Jamod", "Shegaon"]),
    vegWeights: { "green-chilli": 1, tomato: 0.9, cabbage: 0.8, okra: 0.8, brinjal: 0.8, cauliflower: 0.6, garlic: 0.7, potato: 0.7, "green-peas": 0.5, capsicum: 0.3, "bitter-gourd": 0.6, "bottle-gourd": 0.6, radish: 0.6, carrot: 0.4 },
  },

  // --- Vidarbha ---
  {
    id: "akola", name: "Akola", lat: 20.7, lon: 77.0,
    baselineAreaHa: 14_000, deviationPct: 0, infraIndex: 1.05, coverage: 41, capacityGrowthPct: 5,
    villages: V(["Akot", "Telhara", "Balapur", "Barshitakli", "Patur"]),
    vegWeights: { "green-chilli": 0.6, tomato: 0.5, okra: 0.5, brinjal: 0.5, cabbage: 0.4, cauliflower: 0.3, potato: 0.4, garlic: 0.3, "green-peas": 0.3, capsicum: 0.15, "bitter-gourd": 0.35, "bottle-gourd": 0.35, radish: 0.35, carrot: 0.2 },
  },
  {
    id: "amravati", name: "Amravati", lat: 20.93, lon: 77.75,
    baselineAreaHa: 16_000, deviationPct: -1, infraIndex: 1.04, coverage: 42, capacityGrowthPct: 5,
    villages: V(["Achalpur", "Chandur Bazar", "Daryapur", "Morshi", "Warud"]),
    vegWeights: { "green-chilli": 0.7, tomato: 0.6, okra: 0.6, brinjal: 0.6, cabbage: 0.5, cauliflower: 0.4, potato: 0.5, garlic: 0.35, "green-peas": 0.35, capsicum: 0.2, "bitter-gourd": 0.4, "bottle-gourd": 0.4, radish: 0.4, carrot: 0.25 },
  },
  {
    id: "washim", name: "Washim", lat: 20.11, lon: 77.13,
    baselineAreaHa: 10_000, deviationPct: -3, infraIndex: 1.08, coverage: 38, capacityGrowthPct: 4,
    villages: V(["Risod", "Karanja", "Manora", "Mangrulpir", "Malegaon"]),
    vegWeights: { "green-chilli": 0.4, tomato: 0.4, okra: 0.4, brinjal: 0.4, cabbage: 0.3, cauliflower: 0.25, potato: 0.3, garlic: 0.25, "green-peas": 0.2, capsicum: 0.1, "bitter-gourd": 0.25, "bottle-gourd": 0.25, radish: 0.25, carrot: 0.15 },
  },
  {
    id: "yavatmal", name: "Yavatmal", lat: 20.39, lon: 78.13,
    baselineAreaHa: 12_000, deviationPct: -2, infraIndex: 1.06, coverage: 39, capacityGrowthPct: 4,
    villages: V(["Pusad", "Umarkhed", "Digras", "Darwha", "Ghatanji"]),
    vegWeights: { "green-chilli": 0.5, tomato: 0.5, okra: 0.5, brinjal: 0.5, cabbage: 0.35, cauliflower: 0.3, potato: 0.35, garlic: 0.3, "green-peas": 0.25, capsicum: 0.12, "bitter-gourd": 0.3, "bottle-gourd": 0.3, radish: 0.3, carrot: 0.18 },
  },
  {
    id: "wardha", name: "Wardha", lat: 20.75, lon: 78.6,
    baselineAreaHa: 8_000, deviationPct: -4, infraIndex: 1.1, coverage: 37, capacityGrowthPct: 4,
    villages: V(["Arvi", "Deoli", "Seloo", "Hinganghat", "Wardha"]),
    vegWeights: { "green-chilli": 0.35, tomato: 0.35, okra: 0.35, brinjal: 0.35, cabbage: 0.25, cauliflower: 0.2, potato: 0.25, garlic: 0.2, "green-peas": 0.18, capsicum: 0.1, "bitter-gourd": 0.2, "bottle-gourd": 0.2, radish: 0.2, carrot: 0.12 },
  },
  {
    id: "nagpur", name: "Nagpur", lat: 21.15, lon: 79.09,
    baselineAreaHa: 7_000, deviationPct: -2, infraIndex: 1.1, coverage: 38, capacityGrowthPct: 4,
    villages: V(["Katol", "Narkhed", "Kamptee", "Ramtek", "Umred"]),
    vegWeights: { tomato: 0.9, cauliflower: 0.8, cabbage: 0.8, "green-peas": 0.9, "green-chilli": 0.7, potato: 0.9, okra: 0.7, brinjal: 0.7, carrot: 0.5, capsicum: 0.4, garlic: 0.4, "bitter-gourd": 0.5, "bottle-gourd": 0.5, radish: 0.5 },
  },
  {
    id: "bhandara", name: "Bhandara", lat: 21.17, lon: 79.65,
    baselineAreaHa: 6_000, deviationPct: -3, infraIndex: 1.12, coverage: 36, capacityGrowthPct: 3,
    villages: V(["Tumsar", "Sakoli", "Lakhani", "Mohadi", "Bhandara"]),
    vegWeights: { cabbage: 0.5, cauliflower: 0.45, "green-peas": 0.5, tomato: 0.45, okra: 0.4, brinjal: 0.4, "green-chilli": 0.35, potato: 0.4, carrot: 0.3, capsicum: 0.2, garlic: 0.25, "bitter-gourd": 0.3, "bottle-gourd": 0.3, radish: 0.3 },
  },
  {
    id: "gondia", name: "Gondia", lat: 21.46, lon: 80.19,
    baselineAreaHa: 5_000, deviationPct: -5, infraIndex: 1.14, coverage: 34, capacityGrowthPct: 3,
    villages: V(["Tirora", "Gondia", "Sadak Arjuni", "Salekasa", "Amgaon"]),
    vegWeights: { cabbage: 0.4, cauliflower: 0.35, "green-peas": 0.4, tomato: 0.35, okra: 0.3, brinjal: 0.3, "green-chilli": 0.28, potato: 0.3, carrot: 0.22, capsicum: 0.15, garlic: 0.2, "bitter-gourd": 0.25, "bottle-gourd": 0.25, radish: 0.25 },
  },
  {
    id: "chandrapur", name: "Chandrapur", lat: 19.97, lon: 79.3,
    baselineAreaHa: 6_000, deviationPct: -3, infraIndex: 1.12, coverage: 36, capacityGrowthPct: 3,
    villages: V(["Warora", "Bramhapuri", "Rajura", "Ballarpur", "Chimur"]),
    vegWeights: { tomato: 0.45, cabbage: 0.4, cauliflower: 0.35, okra: 0.4, brinjal: 0.4, "green-chilli": 0.35, "green-peas": 0.3, potato: 0.35, carrot: 0.25, capsicum: 0.18, garlic: 0.22, "bitter-gourd": 0.3, "bottle-gourd": 0.3, radish: 0.3 },
  },
  {
    id: "gadchiroli", name: "Gadchiroli", lat: 20.1, lon: 80.0,
    baselineAreaHa: 4_000, deviationPct: -6, infraIndex: 1.16, coverage: 33, capacityGrowthPct: 3,
    villages: V(["Desaiganj", "Armori", "Kurkheda", "Dhanora", "Gadchiroli"]),
    vegWeights: { tomato: 0.3, cabbage: 0.25, cauliflower: 0.22, okra: 0.25, brinjal: 0.25, "green-chilli": 0.2, "green-peas": 0.18, potato: 0.2, carrot: 0.15, capsicum: 0.08, garlic: 0.12, "bitter-gourd": 0.18, "bottle-gourd": 0.18, radish: 0.18 },
  },

  // --- Konkan / coastal (small vegetable area, horticulture-leaning) ---
  {
    id: "raigad", name: "Raigad", lat: 18.08, lon: 73.42,
    baselineAreaHa: 6_000, deviationPct: 0, infraIndex: 1.15, coverage: 38, capacityGrowthPct: 3,
    villages: V(["Mahad", "Roha", "Alibag", "Pen", "Panvel"]),
    vegWeights: { "bottle-gourd": 0.5, okra: 0.45, brinjal: 0.45, cabbage: 0.35, cauliflower: 0.3, tomato: 0.4, "green-chilli": 0.35, radish: 0.35, "bitter-gourd": 0.4, "green-peas": 0.2, potato: 0.25, capsicum: 0.15, carrot: 0.18, garlic: 0.15 },
  },
  {
    id: "palghar", name: "Palghar", lat: 19.7, lon: 72.76,
    baselineAreaHa: 9_000, deviationPct: 1, infraIndex: 1.15, coverage: 40, capacityGrowthPct: 4,
    villages: V(["Dahanu", "Talasari", "Jawhar", "Vikramgad", "Palghar"]),
    vegWeights: { okra: 0.6, brinjal: 0.6, "bottle-gourd": 0.6, "bitter-gourd": 0.5, tomato: 0.5, cabbage: 0.4, cauliflower: 0.35, "green-chilli": 0.4, radish: 0.4, "green-peas": 0.2, potato: 0.25, capsicum: 0.15, carrot: 0.18, garlic: 0.15 },
  },
  {
    id: "thane", name: "Thane", lat: 19.22, lon: 73.1,
    baselineAreaHa: 4_000, deviationPct: -1, infraIndex: 1.18, coverage: 37, capacityGrowthPct: 3,
    villages: V(["Shahapur", "Murbad", "Bhiwandi", "Kalyan", "Ambarnath"]),
    vegWeights: { okra: 0.3, brinjal: 0.3, "bottle-gourd": 0.3, cabbage: 0.22, cauliflower: 0.2, tomato: 0.25, "green-chilli": 0.22, radish: 0.22, "bitter-gourd": 0.25, "green-peas": 0.12, potato: 0.15, capsicum: 0.1, carrot: 0.1, garlic: 0.1 },
  },
  {
    id: "ratnagiri", name: "Ratnagiri", lat: 16.99, lon: 73.31,
    baselineAreaHa: 4_000, deviationPct: -3, infraIndex: 1.18, coverage: 35, capacityGrowthPct: 3,
    villages: V(["Lanja", "Rajapur", "Sangameshwar", "Chiplun", "Ratnagiri"]),
    vegWeights: { okra: 0.28, brinjal: 0.28, "bottle-gourd": 0.3, cabbage: 0.2, cauliflower: 0.18, tomato: 0.22, "green-chilli": 0.2, radish: 0.2, "bitter-gourd": 0.22, "green-peas": 0.1, potato: 0.12, capsicum: 0.08, carrot: 0.08, garlic: 0.08 },
  },
  {
    id: "sindhudurg", name: "Sindhudurg", lat: 16.05, lon: 73.72,
    baselineAreaHa: 3_000, deviationPct: -4, infraIndex: 1.2, coverage: 34, capacityGrowthPct: 3,
    villages: V(["Kankavli", "Kudal", "Malvan", "Vengurla", "Sawantwadi"]),
    vegWeights: { okra: 0.22, brinjal: 0.22, "bottle-gourd": 0.24, cabbage: 0.16, cauliflower: 0.15, tomato: 0.18, "green-chilli": 0.16, radish: 0.16, "bitter-gourd": 0.18, "green-peas": 0.08, potato: 0.1, capsicum: 0.06, carrot: 0.06, garlic: 0.06 },
  },
];

/** Default relative weight for crops unlisted in a district (scattered cultivation). */
export const DEFAULT_VEG_WEIGHT = 0.5;

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
