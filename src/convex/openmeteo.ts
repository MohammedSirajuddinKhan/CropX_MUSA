import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { DISTRICTS } from "../lib/cropx/districts";

/** Refresh-on-open window: a successful ingest blocks re-runs for 10 min. */
const COOLDOWN_MS = 10 * 60_000;

/**
 * Open-Meteo ingest — pulls REAL observed + forecast weather for every
 * monitored district from the free Open-Meteo API (no API key needed).
 *
 *   GET https://api.open-meteo.com/v1/forecast
 *       ?latitude=19.997,18.52,...     (batch mode: one request per chunk)
 *       &longitude=73.79,73.86,...
 *       &daily=precipitation_sum,temperature_2m_max
 *       &past_days=30&forecast_days=16&timezone=Asia/Kolkata
 *
 * Verified live 2026-09-13 (Nashik batch returns real daily series).
 * This is OFFICIAL data (Open-Meteo serves national weather services'
 * models — ICON/GFS/ECMWF). It feeds the engine's weather driver, which
 * previously used a static placeholder contribution.
 */

const API = "https://api.open-meteo.com/v1/forecast";
/** Open-Meteo supports many locations per request; 12 is conservative. */
const CHUNK = 12;

interface DailyBlock {
  time?: string[];
  precipitation_sum?: (number | null)[];
  temperature_2m_max?: (number | null)[];
}

/** Batch mode returns one wrapper per location: { daily: DailyBlock }. */
interface LocationBlock {
  daily?: DailyBlock;
}

function sumFinite(values: (number | null)[] | undefined): number {
  if (!Array.isArray(values)) return 0;
  let s = 0;
  for (const v of values) if (typeof v === "number" && Number.isFinite(v)) s += v;
  return s;
}

function meanFinite(values: (number | null)[] | undefined): number {
  if (!Array.isArray(values) || values.length === 0) return 0;
  let s = 0;
  let n = 0;
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) {
      s += v;
      n += 1;
    }
  }
  return n > 0 ? s / n : 0;
}

/** Derived wetness index 0–1: 0.5 neutral, +50 mm anomaly → 1, −50 mm → 0. */
function wetnessIndex(rainPast30dMm: number, rainNext14dMm: number): number {
  const baseline14 = (rainPast30dMm / 30) * 14;
  const anomaly = rainNext14dMm - baseline14;
  return Math.min(1, Math.max(0, 0.5 + anomaly / 100));
}

export const ingest = action({
  // `force` bypasses the 10-minute cooldown (used by the app's refresh-on-open
  // path only when the cached data is stale; the cron passes force: false).
  args: { force: v.optional(v.boolean()) },
  returns: v.object({
    status: v.union(v.literal("ok"), v.literal("error")),
    recordCount: v.number(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ status: "ok" | "error"; recordCount: number; message?: string }> => {
    // Cooldown: only successful runs hold the 10-minute window — a failed
    // run can be retried immediately. Keeps refresh-on-open polite.
    const last = await ctx.runQuery(internal.openmeteo.lastSync, {});
    if (!args.force && last.status === "ok" && Date.now() - last.at < COOLDOWN_MS) {
      return { status: "ok", recordCount: -1, message: "cooldown: last successful run < 10 min ago" };
    }

    const errors: string[] = [];
    let stored = 0;
    const now = Date.now();

    const lat = DISTRICTS.map((d) => d.lat);
    const lon = DISTRICTS.map((d) => d.lon);

    for (let i = 0; i < DISTRICTS.length; i += CHUNK) {
      const chunk = DISTRICTS.slice(i, i + CHUNK);
      const url = new URL(API);
      url.searchParams.set("latitude", lat.slice(i, i + CHUNK).join(","));
      url.searchParams.set("longitude", lon.slice(i, i + CHUNK).join(","));
      url.searchParams.set("daily", "precipitation_sum,temperature_2m_max");
      url.searchParams.set("past_days", "30");
      url.searchParams.set("forecast_days", "16");
      url.searchParams.set("timezone", "Asia/Kolkata");

      try {
        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(20_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as LocationBlock | LocationBlock[];
        // Batch mode returns an array; single location returns an object.
        const blocks: LocationBlock[] = Array.isArray(json) ? json : [json];
        if (blocks.length !== chunk.length) {
          throw new Error(`batch length ${blocks.length} ≠ ${chunk.length}`);
        }
        for (let j = 0; j < chunk.length; j++) {
          const daily = blocks[j]?.daily;
          const rainPast = sumFinite(daily?.precipitation_sum?.slice(0, 30));
          const rainNext = sumFinite(daily?.precipitation_sum?.slice(30, 44));
          const tempMean = meanFinite(daily?.temperature_2m_max?.slice(30, 44));
          await ctx.runMutation(internal.openmeteo.upsertSnapshot, {
            regionId: chunk[j].id,
            source: "open-meteo",
            rainPast30dMm: Math.round(rainPast * 10) / 10,
            rainNext14dMm: Math.round(rainNext * 10) / 10,
            tempNext14dMeanC: Math.round(tempMean * 10) / 10,
            wetnessIndex: Math.round(wetnessIndex(rainPast, rainNext) * 100) / 100,
            fetchedAt: now,
          });
          stored += 1;
        }
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        errors.push(`chunk@${i}: ${reason}`);
      }
    }

    const status = stored > 0 ? "ok" : "error";
    const message =
      errors.length > 0
        ? `${stored}/${DISTRICTS.length} districts · ${errors.slice(0, 3).join("; ")}`
        : `${stored}/${DISTRICTS.length} districts`;
    await ctx.runMutation(internal.openmeteo.logSync, { status, recordCount: stored, message });
    return { status, recordCount: stored, message };
  },
});

export const upsertSnapshot = internalMutation({
  args: {
    regionId: v.string(),
    source: v.literal("open-meteo"),
    rainPast30dMm: v.number(),
    rainNext14dMm: v.number(),
    tempNext14dMeanC: v.number(),
    wetnessIndex: v.number(),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weatherSnapshots")
      .withIndex("by_region", (q) => q.eq("regionId", args.regionId))
      .collect();
    if (existing.length > 0) {
      // Keep exactly one row per district.
      for (const dup of existing.slice(1)) await ctx.db.delete(dup._id);
      await ctx.db.patch(existing[0]._id, args);
    } else {
      await ctx.db.insert("weatherSnapshots", args);
    }
  },
});

export const logSync = internalMutation({
  args: {
    status: v.union(v.literal("ok"), v.literal("error")),
    recordCount: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("weatherSync", { ...args, at: Date.now() });
    const all = await ctx.db
      .query("weatherSync")
      .withIndex("by_at", (q) => q.gt("at", 0))
      .order("desc")
      .take(31);
    for (const old of all.slice(30)) await ctx.db.delete(old._id);
  },
});

/** Weather snapshot for one district (undefined-safe: null when absent). */
export const snapshot = query({
  args: { regionId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("weatherSnapshots")
      .withIndex("by_region", (q) => q.eq("regionId", args.regionId))
      .take(1);
    return rows[0] ?? null;
  },
});

/** Last weather sync status for the LIVE badge. */
export const syncStatus = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("weatherSync")
      .withIndex("by_at", (q) => q.gt("at", 0))
      .order("desc")
      .take(1);
    return rows[0] ?? null;
  },
});

/** Cooldown guard for the cron (internal, cheap). */
export const lastSync = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("weatherSync")
      .withIndex("by_at", (q) => q.gt("at", 0))
      .order("desc")
      .take(1);
    const row = rows[0];
    return row ? { at: row.at, status: row.status } : { at: 0, status: "ok" as const };
  },
});
