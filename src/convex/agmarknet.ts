import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * AGMARKNET ingest — pulls the latest wholesale mandi prices from the
 * Government of India Open Government Data platform (data.gov.in),
 * dataset "Current daily price of various commodities from various
 * markets (Mandi)", resource 9ef84268-d588-465a-a308-a864a43d0070.
 *
 *   GET https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
 *       ?api-key=...&format=json&limit=...
 *       &filters[State]=Maharashtra
 *       &filters[commodity]=Onion
 *
 * Response: { records: [{ state, district, market, commodity, variety,
 * grade, min_price, max_price, modal_price, price_unit, arrival_date }] }
 *
 * This is OFFICIAL, LIVE government data ( Directorate of Marketing &
 * Inspection, Ministry of Agriculture & Farmers Welfare). Requires an API
 * key from data.gov.in configured as env var DATA_GOV_IN_API_KEY.
 */

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const API_BASE = "https://api.data.gov.in/resource";

/** AGMARKNET commodity names → CropX crop ids. */
const COMMODITY_MAP: Record<string, string> = {
  Onion: "onion",
  Tomato: "tomato",
  Potato: "potato",
  Brinjal: "brinjal",
  Cabbage: "cabbage",
  Cauliflower: "cauliflower",
  "Bhindi(Ladies Finger)": "okra",
  "Chilli Green": "green-chilli",
  "Chilly Green": "green-chilli",
  Garlic: "garlic",
  "Green Peas": "green-peas",
  "Peas Green": "green-peas",
  "Bitter Gourd": "bitter-gourd",
  "Bottle Gourd": "bottle-gourd",
  Raddish: "radish",
  Radish: "radish",
  Carrot: "carrot",
  "Capsicum": "capsicum",
};

const COMMODITIES = Object.keys(COMMODITY_MAP);

interface AgmarknetRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  min_price?: string;
  max_price?: string;
  modal_price?: string;
  price_unit?: string;
  arrival_date?: string;
}

function toNum(v: string | undefined): number {
  const n = Number.parseFloat((v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

export const ingest = internalAction({
  args: {},
  returns: v.object({
    status: v.union(v.literal("ok"), v.literal("error"), v.literal("missing-key")),
    recordCount: v.number(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx): Promise<{ status: "ok" | "error" | "missing-key"; recordCount: number; message?: string }> => {
    const apiKey = process.env.DATA_GOV_IN_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.mandi.logSync, {
        status: "missing-key",
        recordCount: 0,
        message: "DATA_GOV_IN_API_KEY not configured",
      });
      return { status: "missing-key", recordCount: 0, message: "DATA_GOV_IN_API_KEY not configured" };
    }

    let stored = 0;
    const errors: string[] = [];

    for (const commodity of COMMODITIES) {
      const url = new URL(`${API_BASE}/${RESOURCE_ID}`);
      url.searchParams.set("api-key", apiKey);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "100");
      url.searchParams.set("filters[State]", "Maharashtra");
      url.searchParams.set("filters[commodity]", commodity);

      try {
        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) {
          errors.push(`${commodity}: HTTP ${res.status}`);
          continue;
        }
        const json = (await res.json()) as { records?: AgmarknetRecord[] };
        const records = Array.isArray(json.records) ? json.records : [];

        for (const r of records) {
          const cropId = COMMODITY_MAP[(r.commodity ?? "").trim()];
          const modal = toNum(r.modal_price);
          if (!cropId || !Number.isFinite(modal)) continue;
          await ctx.runMutation(internal.mandi.upsertQuote, {
            cropId,
            commodityName: (r.commodity ?? "").trim(),
            state: (r.state ?? "").trim(),
            district: (r.district ?? "").trim(),
            market: (r.market ?? "").trim(),
            minPrice: toNum(r.min_price) || modal,
            maxPrice: toNum(r.max_price) || modal,
            modalPrice: modal,
            priceUnit: (r.price_unit ?? "Rs./Quintal").trim(),
            arrivalDate: (r.arrival_date ?? "").trim(),
          });
          stored += 1;
        }
      } catch (err) {
        errors.push(`${commodity}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const status = stored > 0 ? "ok" : "error";
    await ctx.runMutation(internal.mandi.logSync, {
      status,
      recordCount: stored,
      message: errors.length > 0 ? errors.slice(0, 5).join("; ") : undefined,
    });
    return { status, recordCount: stored, message: errors.length > 0 ? errors.slice(0, 5).join("; ") : undefined };
  },
});
