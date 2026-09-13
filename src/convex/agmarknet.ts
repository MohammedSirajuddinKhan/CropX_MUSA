import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * AGMARKNET ingest — pulls the latest wholesale mandi prices from the
 * Government of India Open Government Data platform (data.gov.in),
 * dataset "Current daily price of various commodities from various
 * markets (Mandi)", resource 9ef84268-d588-465a-a308-a864a43d0070.
 *
 *   GET https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
 *       ?api-key=...&format=json&limit=...
 *       &filters[state]=Maharashtra      (lowercase "state" — verified)
 *       &filters[commodity]=Onion
 *
 * Response: { records: [{ state, district, market, commodity, variety,
 * grade, arrival_date, min_price, max_price, modal_price }] } — prices are
 * delivered as JSON numbers in the current dataset shape (verified live
 * 2026-09-13: APMC Pune, Onion, modal ₹3,000/q, 13/09/2026).
 *
 * This is OFFICIAL, LIVE government data (Directorate of Marketing &
 * Inspection, Ministry of Agriculture & Farmers Welfare).
 *
 * KEY STRATEGY:
 *  - DATA_GOV_IN_API_KEY (env) is used when configured — full limits.
 *  - Otherwise the PUBLIC SAMPLE KEY published in the official data.gov.in
 *    API documentation is used, capped at 10 records/request. This keeps
 *    the feed live out of the box; the sync log records when it is active.
 */

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const API_BASE = "https://api.data.gov.in/resource";
const SAMPLE_API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";

/**
 * AGMARKNET commodity names → CropX crop ids.
 *
 * STRICT + case-insensitive: a record is only stored when its own
 * commodity name maps. Names here are the LIVE endpoint's actual spellings
 * (verified 2026-09-13): "Green Chilli" (not "Chilli Green"), "Bitter
 * gourd" (lowercase g), "Chilly Capsicum". Filter cross-hits like "Onion
 * Green" / "Peas Wet" / "Chilli Dry" do NOT map and are skipped — they
 * must not pollute the parent crop.
 */
const COMMODITY_MAP: Record<string, string> = {
  onion: "onion",
  "onion big": "onion",
  tomato: "tomato",
  potato: "potato",
  brinjal: "brinjal",
  cabbage: "cabbage",
  cauliflower: "cauliflower",
  "bhindi(ladies finger)": "okra",
  "chilli green": "green-chilli",
  "chilly green": "green-chilli",
  "green chilli": "green-chilli",
  garlic: "garlic",
  "green peas": "green-peas",
  "peas green": "green-peas",
  "bitter gourd": "bitter-gourd",
  "bottle gourd": "bottle-gourd",
  raddish: "radish",
  radish: "radish",
  carrot: "carrot",
  capsicum: "capsicum",
  "chilly capsicum": "capsicum",
};

/** Case-insensitive strict lookup into COMMODITY_MAP. */
function mapCommodity(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return COMMODITY_MAP[name.trim().toLowerCase()];
}

const COMMODITIES = Object.keys(COMMODITY_MAP);
/** Parallel fetch width — polite to the public API. */
const FETCH_CHUNK = 4;

interface AgmarknetRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  min_price?: string | number;
  max_price?: string | number;
  modal_price?: string | number;
  price_unit?: string;
  arrival_date?: string;
}

/**
 * AGMARKNET delivers prices as JSON numbers in the current dataset shape
 * ("min_price": 3000) — accept both numbers and legacy strings defensively.
 */
function toNum(v: string | number | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  const n = Number.parseFloat((v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

export const ingest = action({
  args: { force: v.optional(v.boolean()) },
  returns: v.object({
    status: v.union(v.literal("ok"), v.literal("error"), v.literal("missing-key")),
    recordCount: v.number(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ status: "ok" | "error" | "missing-key"; recordCount: number; message?: string }> => {
    // Cooldown: only successful runs hold the 10-minute window — a failed
    // run can be retried immediately (e.g. after fixing the API key).
    // `force` bypasses it for the console's explicit sync button.
    const last = await ctx.runQuery(internal.mandi.lastSync, {});
    if (!args.force && last.status === "ok" && Date.now() - last.at < 10 * 60_000) {
      return { status: "ok", recordCount: -1, message: "cooldown: last successful run < 10 min ago" };
    }

    const userKey = process.env.DATA_GOV_IN_API_KEY;
    const usingSample = !userKey;
    const apiKey = userKey ?? SAMPLE_API_KEY;
    // The sample key is hard-capped at 10 records per request by data.gov.in.
    const limit = usingSample ? 10 : 100;

    interface Batch {
      commodity: string;
      records: AgmarknetRecord[];
    }
    const errors: string[] = [];
    const batches: Batch[] = [];

    for (let i = 0; i < COMMODITIES.length; i += FETCH_CHUNK) {
      const chunk = COMMODITIES.slice(i, i + FETCH_CHUNK);
      const settled = await Promise.allSettled(
        chunk.map(async (commodity): Promise<Batch> => {
          const url = new URL(`${API_BASE}/${RESOURCE_ID}`);
          url.searchParams.set("api-key", apiKey);
          url.searchParams.set("format", "json");
          url.searchParams.set("limit", String(limit));
          // NOTE: lowercase "state" — the dataset's filter key.
          // "filters[State]" silently returns 0 records.
          url.searchParams.set("filters[state]", "Maharashtra");
          url.searchParams.set("filters[commodity]", commodity);
          const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = (await res.json()) as { records?: AgmarknetRecord[] };
          return {
            commodity,
            records: Array.isArray(json.records) ? json.records : [],
          };
        }),
      );
      settled.forEach((s, j) => {
        if (s.status === "fulfilled") {
          batches.push(s.value);
        } else {
          const reason = s.reason instanceof Error ? s.reason.message : String(s.reason);
          errors.push(`${chunk[j]}: ${reason}`);
        }
      });
    }

    let stored = 0;
    let skipped = 0;
    for (const batch of batches) {
      for (const r of batch.records) {
        // STRICT: only the record's own commodity name maps. No fallback to
        // the requested name — that stored "Onion Green" under onion.
        const cropId = mapCommodity(r.commodity);
        const modal = toNum(r.modal_price);
        if (!cropId) {
          skipped += 1;
          continue;
        }
        if (!Number.isFinite(modal)) {
          skipped += 1;
          continue;
        }
        await ctx.runMutation(internal.mandi.upsertQuote, {
          cropId,
          commodityName: (r.commodity ?? batch.commodity).trim(),
          state: (r.state ?? "Maharashtra").trim(),
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
    }

    const status = stored > 0 ? "ok" : "error";
    const message = [
      usingSample
        ? "live via public sample key (10 records/request) — set DATA_GOV_IN_API_KEY for full coverage"
        : undefined,
      skipped > 0 ? `${skipped} records skipped (non-bulb varieties / malformed prices)` : undefined,
      errors.length > 0 ? errors.slice(0, 5).join("; ") : undefined,
    ]
      .filter(Boolean)
      .join(" · ") || undefined;

    // Self-heal: purge cached rows whose commodity name is no longer in the
    // strict map (removes e.g. the mis-mapped "Onion Green" row).
    const purged = await ctx.runMutation(internal.mandi.purgeUnknownCommodities, {
      validNames: Object.keys(COMMODITY_MAP).map((k) =>
        // Store display-cased originals for the purge set: compare
        // case-insensitively inside the mutation instead.
        k,
      ),
    });

    await ctx.runMutation(internal.mandi.logSync, {
      status,
      recordCount: stored,
      message: [message, purged > 0 ? `${purged} stale rows purged` : undefined]
        .filter(Boolean)
        .join(" · ") || undefined,
    });
    return { status, recordCount: stored, message };
  },
});
