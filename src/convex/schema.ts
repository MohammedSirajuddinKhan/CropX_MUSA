import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // add other tables here

    // tableName: defineTable({
    //   ...
    //   // table fields
    // }).index("by_field", ["field"])

    // Live AGMARKNET mandi quotes (ingested from data.gov.in daily price
    // resource). One row per (crop, market, arrival date).
    mandiQuotes: defineTable({
      cropId: v.string(), // CropX crop id (onion, tomato, ...)
      commodityName: v.string(), // AGMARKNET commodity name as reported
      state: v.string(),
      district: v.string(),
      market: v.string(),
      minPrice: v.number(), // ₹/quintal
      maxPrice: v.number(),
      modalPrice: v.number(),
      priceUnit: v.string(),
      arrivalDate: v.string(), // AGMARKNET arrival date (as reported)
      fetchedAt: v.number(), // epoch ms of ingest
    })
      .index("by_crop", ["cropId"])
      .index("by_fetched", ["fetchedAt"]),

    // Sync log — one row per ingest run, drives the LIVE/OFFLINE state.
    mandiSync: defineTable({
      status: v.union(
        v.literal("ok"),
        v.literal("error"),
        v.literal("missing-key"),
      ),
      recordCount: v.number(),
      message: v.optional(v.string()),
      at: v.number(),
    }).index("by_at", ["at"]),

    // Open-Meteo district weather snapshot (OFFICIAL live data, no key
    // required). One row per district; overwritten by each ingest run.
    // Values are REAL observed + forecast daily series summarized into
    // risk-relevant indices used by the engine's weather driver.
    weatherSnapshots: defineTable({
      regionId: v.string(), // CropX district id (nashik, ...)
      source: v.literal("open-meteo"),
      /** Observed rainfall past 30 days, mm. */
      rainPast30dMm: v.number(),
      /** Forecast rainfall next 14 days, mm. */
      rainNext14dMm: v.number(),
      /** Forecast mean daily max temperature next 14 days, °C. */
      tempNext14dMeanC: v.number(),
      /** Simple wetness stress index 0-1 (drought 0 ↔ saturated 1). */
      wetnessIndex: v.number(),
      fetchedAt: v.number(),
    }).index("by_region", ["regionId"]),

    // Sync log for the weather ingest (drives the LIVE/OFFLINE badge).
    weatherSync: defineTable({
      status: v.union(v.literal("ok"), v.literal("error")),
      recordCount: v.number(),
      message: v.optional(v.string()),
      at: v.number(),
    }).index("by_at", ["at"]),

    // Cached LLM decision briefs. THE NUMBERS COME FROM THE ENGINE — the
    // brief stores them verbatim plus the LLM's wording; the UI renders
    // both so the model can never silently alter the risk state.
    briefs: defineTable({
      regionId: v.string(),
      cropId: v.string(),
      lang: v.string(), // en | hi | mr
      // Engine state fingerprint: cache key so a changed scenario
      // regenerates instead of serving a stale brief.
      fingerprint: v.string(),
      headline: v.string(),
      body: v.string(),
      actions: v.array(v.string()),
      model: v.string(), // e.g. gemini-2.0-flash
      generatedAt: v.number(),
    }).index("by_fp", ["fingerprint"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
