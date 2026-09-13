import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

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
    const match = existing.find(
      (q) => q.market === args.market && q.arrivalDate === args.arrivalDate,
    );
    if (match) {
      await ctx.db.patch(match._id, { ...args, fetchedAt: Date.now() });
    } else {
      await ctx.db.insert("mandiQuotes", { ...args, fetchedAt: Date.now() });
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

/** Latest quotes for one crop (markets sorted by modal price). */
export const latestQuotes = query({
  args: { cropId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(50, Math.max(1, args.limit ?? 12));
    const rows = await ctx.db
      .query("mandiQuotes")
      .withIndex("by_crop", (q) => q.eq("cropId", args.cropId))
      .collect();
    const freshest = rows.reduce(
      (acc, r) => Math.max(acc, r.fetchedAt),
      0,
    );
    return {
      quotes: rows
        .filter((r) => r.fetchedAt === freshest)
        .sort((a, b) => a.modalPrice - b.modalPrice)
        .slice(0, limit),
      fetchedAt: freshest,
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
