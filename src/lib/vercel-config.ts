/**
 * Vercel deployment config surfaced in the console.
 *
 * Vercel needs no runtime key for the frontend itself — deployments pull
 * VITE_CONVEX_URL from the Vercel project settings. The one runtime key is
 * AI_GATEWAY_API_KEY, which routes the console's LLM decision briefs through
 * the Vercel AI Gateway (read server-side in `src/convex/gemini.ts`; never
 * exposed to the browser). All flags here are build-time only.
 */
const V = (k: string): string => (import.meta.env[k] ?? "").toString().trim();

/** Vercel injects these automatically on every deployment (build-time). */
export const VERCEL_ENV = V("VITE_VERCEL_ENV"); // production | preview | development
export const VERCEL_URL = V("VITE_VERCEL_URL"); // e.g. cropx-<team>.vercel.app
export const VERCEL_GIT_COMMIT_SHA = V("VITE_VERCEL_GIT_COMMIT_SHA");
export const VERCEL_REGION = V("VITE_VERCEL_REGION"); // e.g. bom1 (Mumbai edge)

/** Deploy marker for the sidebar status block; absent when self-hosted. */
export const VERCEL_DEPLOY_LABEL =
  VERCEL_URL ||
  (VERCEL_ENV === "production"
    ? "vercel · production"
    : VERCEL_ENV === "preview"
      ? "vercel · preview"
      : "");

export const VERCEL_ENV_LABEL: Record<string, string> = {
  production: "prod",
  preview: "preview",
  development: "dev",
};
