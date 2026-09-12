/** Formatting helpers for CropX UI. Pure functions only. */

export function formatT(t: number): string {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(2)}M t`;
  if (t >= 1_000) return `${Math.round(t / 1_000)}k t`;
  return `${Math.round(t)} t`;
}

export function formatHa(ha: number): string {
  if (ha >= 100_000) return `${(ha / 100_000).toFixed(0)}k ha`;
  if (ha >= 1_000) return `${(ha / 1_000).toFixed(1)}k ha`;
  return `${Math.round(ha)} ha`;
}

export function formatPct(n: number, digits = 0): string {
  return `${n >= 0 ? "" : "−"}${Math.abs(n).toFixed(digits)}%`;
}

export function formatSignedT(t: number): string {
  const sign = t >= 0 ? "+" : "−";
  return `${sign}${formatT(Math.abs(t))}`;
}

/** Risk band → terminal status tag colors, keyed to theme tokens. */
export const BAND_COLORS: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  low: { text: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/30" },
  medium: { text: "text-risk-medium", bg: "bg-risk-medium/10", border: "border-risk-medium/30" },
  high: { text: "text-risk-high", bg: "bg-risk-high/10", border: "border-risk-high/30" },
  critical: { text: "text-risk-critical", bg: "bg-risk-critical/10", border: "border-risk-critical/30" },
};
