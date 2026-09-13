import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

/**
 * Mandi quote storage + public queries backing the live MandiPrices panel.
 * Data originates from AGMARKNET (data.gov.in) — official government data.
 */

export const upsertQuote = internalMutation({
  args: {
    cropId: v.string(),
    commodityName: v.string(),
    state: v.string(),
    district: v.string(),
    market: v.string(),
    minPrice: v.number(),
    maxPrice: v.number(),
    modalPrice: v.number(),
    priceUnit: v.string(),
    arrivalDate: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mandiQuotes")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();
    const fetchedAt = Date.now();
    const match = existing.find(
      (q) => q.market === args.market && q.arrivalDate === args.arrivalDate,
    );
    if (match) {
      await ctx.db.patch(match._id, { ...args, fetchedAt });
    } else {
      await ctx.db.insert("mandiQuotes", { ...args, fetchedAt });
    }

    // Table bound: keep only the 3 freshest arrival dates per crop so
    // repeated daily ingests can't grow the table unboundedly.
    const dates = [...new Set(existing.map((q) => q.arrivalDate))]
      .filter((d) => d !== args.arrivalDate)
      .sort((a, b) => {
        const [ad, am, ay] = a.split("/").map(Number);
        const [bd, bm, by] = b.split("/").map(Number);
        return (by ?? 0) * 10000 + (bm ?? 0) * 100 + (ad ?? 0) - ((ay ?? 0) * 10000 + (bm ?? 0) * 100 + (bd ?? 0));
      });
    const staleDates = new Set(dates.slice(0, Math.max(0, dates.length - 2)));
    if (staleDates.size > 0) {
      for (const q of existing) {
        if (staleDates.has(q.arrivalDate)) await ctx.db.delete(q._id);
      }
    }
  },
});

export const logSync = internalMutation({
  args: {
    status: v.union(v.literal("ok"), v.literal("error"), v.literal("missing-key")),
    recordCount: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("mandiSync", { ...args, at: Date.now() });
    // Keep only the 30 most recent sync rows.
    const all = await ctx.db
      .query("mandiSync")
      .withIndex("by_at", (q) => q.gt("at", 0))
      .order("desc")
      .collect();
    for (const old of all.slice(30)) {
      await ctx.db.delete(old._id);
    }
  },
});

/** Most recent sync attempt (cooldown guard — only "ok" runs cool down). */
export const lastSync = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("mandiSync")
      .withIndex("by_at", (q) => q.gt("at", 0))
      .order("desc")
      .take(1);
    const row = rows[0];
    return row ? { at: row.at, status: row.status } : { at: 0, status: "ok" as const };
  },
});

/**
 * Hygiene: delete cached rows for known crops whose commodity name no
 * longer maps strictly (e.g. "Onion Green" after the strict-map fix).
 * Called at the end of every successful ingest.
 */
export const purgeUnknownCommodities = internalMutation({
  args: { validNames: v.array(v.string()) },
  handler: async (ctx, args) => {
    // Case-insensitive validity set (map keys are lowercased).
    const valid = new Set(args.validNames.map((n) => n.trim().toLowerCase()));
    const rows = await ctx.db.query("mandiQuotes").collect();
    let purged = 0;
    for (const row of rows) {
      if (!valid.has(row.commodityName.trim().toLowerCase())) {
        await ctx.db.delete(row._id);
        purged += 1;
      }
    }
    return purged;
  },
});

/**
 * Latest quotes for one crop. The freshest arrival_date wins (all records
 * ingested in one run share it); ties broken by fetchedAt so partial runs
 * never hide rows. Sorted by modal price for the panel.
 */
export const latestQuotes = query({
  args: { cropId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(50, Math.max(1, args.limit ?? 12));
    const rows = await ctx.db
      .query("mandiQuotes")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();
    if (rows.length === 0) return { quotes: [], fetchedAt: 0 };

    const parseArrival = (d: string): number => {
      const [day, month, year] = d.split("/").map(Number);
      return (year ?? 0) * 10000 + (month ?? 0) * 100 + (day ?? 0);
    };
    const maxArrival = Math.max(...rows.map((r) => parseArrival(r.arrivalDate)));
    let freshest = rows.filter((r) => parseArrival(r.arrivalDate) === maxArrival);
    if (freshest.length === 0) freshest = rows;
    const maxFetched = Math.max(...freshest.map((r) => r.fetchedAt));
    const visible = freshest.filter((r) => r.fetchedAt >= maxFetched - 5 * 60_000);
    const finalRows = visible.length > 0 ? visible : freshest;

    return {
      quotes: finalRows
        .sort((a, b) => a.modalPrice - b.modalPrice)
        .slice(0, limit),
      fetchedAt: Math.max(...finalRows.map((r) => r.fetchedAt)),
    };
  },
});

/** Last sync status for the LIVE/OFFLINE badge. */
export const syncStatus = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("mandiSync")
      .withIndex("by_at", (q) => q.gt("at", 0))
      .order("desc")
      .take(1);
    return rows[0] ?? null;
  },
});
