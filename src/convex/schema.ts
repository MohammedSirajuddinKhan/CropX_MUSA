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
  },
  {
    schemaValidation: false,
  },
);

export default schema;
