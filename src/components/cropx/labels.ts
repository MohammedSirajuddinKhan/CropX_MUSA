import type { RiskBand, ConfidenceLabel } from "@/lib/cropx/types";
import type { TFunc } from "@/i18n";
import type { TranslationKey } from "@/i18n/en";

/**
 * Map raw domain enum values to translated labels. Pure functions taking
 * the translation function — no hooks, safe to call from anywhere.
 */

export function bandLabelT(t: TFunc, band: RiskBand): string {
  return t(`band.${band}`);
}

export function confidenceLabelT(t: TFunc, conf: ConfidenceLabel): string {
  // Domain enum uses "medium-high"; the dictionary key is camelCased.
  const key = `conf.${conf === "medium-high" ? "mediumHigh" : conf}`;
  return t(key as TranslationKey);
}
