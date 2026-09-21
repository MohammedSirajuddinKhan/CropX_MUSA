import { v } from "convex/values";
import { action, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * LLM decision brief — the architecture boundary demanded by spec §15:
 *
 *   DATA → ML MODEL → RISK SCORE → MODEL EXPLANATION → LLM → BRIEF
 *
 * The engine's numbers are passed in VERBATIM and validated against the
 * LLM's output: if Gemini drops or alters a number, the brief is rejected
 * and a deterministic template brief is served (honestly labeled). The LLM
 * only words the brief — it can never change the risk state. A cache keyed
 * on the engine-state fingerprint keeps free-tier usage tiny.
 */

const MODEL = "gemini-2.0-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Vercel AI Gateway — when AI_GATEWAY_API_KEY is configured the LLM call is
 * routed through Vercel's managed gateway (OpenAI-compatible endpoint, zero
 * markup on token prices, request logging + budgets in the Vercel dashboard).
 * Without the key the brief action talks to Google directly, exactly as before.
 */
const GATEWAY_ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";
const GATEWAY_MODEL = `google/${MODEL}`;
const GATEWAY_TIMEOUT_MS = 25_000;

/** The LLM text response, or null when the call failed for any reason. */
async function callLlm(prompt: string, apiKey: string): Promise<string | null> {
  if (process.env.AI_GATEWAY_API_KEY) {
    // Vercel AI Gateway: OpenAI-compatible chat completions.
    const res = await fetch(GATEWAY_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
        "http-referer": "https://cropx.app",
        "x-title": "CropX",
      },
      body: JSON.stringify({
        model: GATEWAY_MODEL,
        messages: [
          { role: "system", content: "You write decision briefs for an agricultural risk console. Always reply with valid minified JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`AI Gateway HTTP ${res.status}`);
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content ?? null;
  }

  // Direct Google Gemini endpoint (unchanged default path).
  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? null;
}

interface BriefPayload {
  headline: string;
  body: string;
  actions: string[];
  notice?: string;
}

interface BriefArgs {
  regionId: string;
  cropId: string;
  lang: string;
  fingerprint: string;
  risk: number;
  supplyPct: number;
  gapPct: number;
  confidence: number;
  band: string;
  drivers: { label: string; contribution: number }[];
  regionName: string;
  cropName: string;
}

interface BriefResult {
  headline: string;
  body: string;
  actions: string[];
  model: string;
  generatedAt: number;
  cached: boolean;
  notice?: string;
}

/**
 * Validation: every engine number must appear in the brief text, exactly
 * as passed (e.g. "82", "+31", "19"). Prevents silent numeric drift.
 */
function numbersVerbatim(n: { risk: number; supplyPct: number; gapPct: number; confidence: number }, text: string): boolean {
  const nums = [n.risk, Math.abs(n.supplyPct), Math.abs(n.gapPct), n.confidence];
  return nums.every((v) => text.includes(v.toFixed(0)));
}

/** Tolerant JSON extraction from the model's text. */
function parseBrief(text: string): BriefPayload | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    const obj = JSON.parse(text.slice(start, end + 1)) as Partial<BriefPayload>;
    if (
      typeof obj.headline !== "string" ||
      typeof obj.body !== "string" ||
      !Array.isArray(obj.actions) ||
      obj.actions.length === 0 ||
      !obj.actions.every((a) => typeof a === "string")
    ) {
      return null;
    }
    return {
      headline: obj.headline.slice(0, 200),
      body: obj.body.slice(0, 1200),
      actions: obj.actions.slice(0, 5),
    };
  } catch {
    return null;
  }
}

/** Deterministic fallback brief (also the no-key default). */
function templateBrief(args: BriefArgs, notice?: string): BriefPayload {
  const top = [...args.drivers].sort((a, b) => b.contribution - a.contribution).slice(0, 2);
  return {
    headline: `${args.cropName} glut risk ${args.risk}% (${args.band}) in ${args.regionName}`,
    body:
      `Projected ${args.cropName.toLowerCase()} supply is ${args.supplyPct > 0 ? "+" : ""}${args.supplyPct}% vs the median season while absorption capacity grows more slowly, leaving an oversupply gap of ${args.gapPct}% of market capacity. ` +
      `Largest drivers: ${top.map((d) => `${d.label} (${d.contribution > 0 ? "+" : ""}${d.contribution})`).join(", ")}. Model confidence: ${args.confidence}%.`,
    actions: [
      `Hold additional ${args.cropName.toLowerCase()} planting at current area; shift marginal plots to lower-risk crops.`,
      "Stagger harvest windows across member plots to flatten the arrivals curve.",
      "Pre-book storage and procurement capacity before the harvest window opens.",
    ],
    notice,
  };
}

async function store(ctx: ActionCtx, args: BriefArgs, brief: BriefPayload, model: string): Promise<void> {
  await ctx.runMutation(internal.gemini.storeBrief, {
    regionId: args.regionId,
    cropId: args.cropId,
    lang: args.lang,
    fingerprint: args.fingerprint,
    headline: brief.headline,
    body: brief.body,
    actions: brief.actions,
    model,
    generatedAt: Date.now(),
  });
}

export const brief = action({
  args: {
    regionId: v.string(),
    cropId: v.string(),
    lang: v.string(),
    fingerprint: v.string(),
    risk: v.number(),
    supplyPct: v.number(),
    gapPct: v.number(),
    confidence: v.number(),
    band: v.string(),
    drivers: v.array(v.object({ label: v.string(), contribution: v.number() })),
    regionName: v.string(),
    cropName: v.string(),
  },
  handler: async (ctx, args): Promise<BriefResult> => {
    // 1. Cache check (fingerprint = deterministic engine state) — actions
    // have no direct db handle; go through the internal query.
    const cachedRows = await ctx.runQuery(internal.gemini.getCached, { fingerprint: args.fingerprint });
    const cached = cachedRows.find(
      (b) => b.regionId === args.regionId && b.cropId === args.cropId && b.lang === args.lang,
    );
    if (cached) {
      return {
        headline: cached.headline,
        body: cached.body,
        actions: cached.actions,
        model: cached.model,
        generatedAt: cached.generatedAt,
        cached: true,
      };
    }

    // 2. No key configured → deterministic template brief (no LLM call).
    //    Either the Google key or the Vercel AI Gateway key enables briefs.
    const apiKey = process.env.GEMINI_API_KEY ?? "";
    const gatewayKey = process.env.AI_GATEWAY_API_KEY ?? "";
    if (!apiKey && !gatewayKey) {
      const tpl = templateBrief(args);
      await store(ctx, args, tpl, "template");
      return { ...tpl, model: "template", generatedAt: Date.now(), cached: false };
    }

    // 3. LLM call (Vercel AI Gateway when configured, else Gemini direct)
    //    with a strictly scoped prompt.
    const langName = args.lang === "hi" ? "Hindi" : args.lang === "mr" ? "Marathi" : "English";
    const prompt = [
      `You are writing a decision brief for an agricultural risk console (CropX).`,
      `Region: ${args.regionName}. Crop: ${args.cropName}. Language: ${langName}.`,
      "",
      "VERIFIED ENGINE OUTPUT (use these exact numbers; do not invent or alter any):",
      `- Glut risk: ${args.risk}% (${args.band})`,
      `- Expected supply change vs median season: ${args.supplyPct > 0 ? "+" : ""}${args.supplyPct}%`,
      `- Oversupply gap vs absorption capacity: ${args.gapPct}%`,
      `- Model confidence: ${args.confidence}%`,
      `- Risk drivers (signed contributions, percentage points):`,
      ...args.drivers.map((d) => `  - ${d.label}: ${d.contribution > 0 ? "+" : ""}${d.contribution}`),
      "",
      "Write:",
      `1. headline: one sentence (max 110 chars) stating the risk state, using ${args.risk}% and ${args.cropName}.`,
      `2. body: 2-3 sentences explaining WHY, referencing the top drivers and the gap. Use the given numbers exactly as given.`,
      `3. actions: 3 concrete, decision-oriented actions for an FPO (imperative voice).`,
      "",
      "Return ONLY valid minified JSON: {\"headline\":string,\"body\":string,\"actions\":string[]}",
    ].join("\n");

    try {
      const text = (await callLlm(prompt, apiKey)) ?? "";
      const parsed = parseBrief(text);
      if (
        !parsed ||
        !numbersVerbatim(
          { risk: args.risk, supplyPct: args.supplyPct, gapPct: args.gapPct, confidence: args.confidence },
          `${parsed.headline} ${parsed.body}`,
        )
      ) {
        // LLM output failed validation → deterministic fallback.
        const tpl = templateBrief(args, "LLM output failed number validation; deterministic brief shown.");
        await store(ctx, args, tpl, "template");
        return { ...tpl, model: "template", generatedAt: Date.now(), cached: false };
      }
      await store(ctx, args, parsed, MODEL);
      return { ...parsed, model: MODEL, generatedAt: Date.now(), cached: false };
    } catch (e) {
      // Network/quota failure → template fallback, honestly labeled.
      const reason = e instanceof Error ? e.message : String(e);
      const provider = process.env.AI_GATEWAY_API_KEY ? "AI gateway" : "Gemini";
      const tpl = templateBrief(args, `${provider} unavailable (${reason}); deterministic brief shown.`);
      await store(ctx, args, tpl, "template");
      return { ...tpl, model: "template", generatedAt: Date.now(), cached: false };
    }
  },
});

export const getCached = internalQuery({
  args: { fingerprint: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("briefs")
      .withIndex("by_fp", (q) => q.eq("fingerprint", args.fingerprint))
      .collect();
  },
});

export const storeBrief = internalMutation({
  args: {
    regionId: v.string(),
    cropId: v.string(),
    lang: v.string(),
    fingerprint: v.string(),
    headline: v.string(),
    body: v.string(),
    actions: v.array(v.string()),
    model: v.string(),
    generatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Bound the cache: one row per fingerprint, oldest rows pruned.
    const existing = await ctx.db
      .query("briefs")
      .withIndex("by_fp", (q) => q.eq("fingerprint", args.fingerprint))
      .collect();
    const match = existing.find(
      (b) => b.regionId === args.regionId && b.cropId === args.cropId && b.lang === args.lang,
    );
    if (match) {
      await ctx.db.patch(match._id, args);
    } else {
      await ctx.db.insert("briefs", args);
    }
    // Keep cache small (free tier hygiene): max 120 briefs.
    if (existing.length === 0) {
      const all = await ctx.db.query("briefs").collect();
      if (all.length > 120) {
        const oldest = all.sort((a, b) => a.generatedAt - b.generatedAt).slice(0, all.length - 120);
        for (const row of oldest) await ctx.db.delete(row._id);
      }
    }
  },
});
