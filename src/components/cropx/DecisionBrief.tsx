import { useMemo, useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { useLang } from "@/i18n";
import { cropName, districtName } from "@/i18n/names";
import { Sparkles } from "lucide-react";

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
 * Decision brief (Gemini). The ENGINE'S numbers are passed verbatim; the
 * LLM only words the brief. If Gemini is unavailable or its output fails
 * number validation, the backend serves a deterministic template brief —
 * labeled as such in the UI. Never pretends the LLM invented the forecast.
 */
export function DecisionBrief() {
  const { scenario, bundle } = useConsole();
  const { t, lang } = useLang();
  const [brief, setBrief] = useState<BriefResult | null>(null);
  const [error, setError] = useState(false);
  const generate = useAction(api.gemini.brief);

  const risk = scenario.risk;
  const regionName = districtName(bundle.region.id, lang);
  const cropNameL = cropName(bundle.crop.id, lang);

  // Fingerprint: any change to the engine state (levers, region, crop,
  // signal injection) produces a new cache key → a fresh brief.
  const fingerprint = useMemo(
    () =>
      [
        bundle.region.id,
        bundle.crop.id,
        risk.glutRisk,
        risk.expectedProductionT.toFixed(0),
        risk.oversupplyGapPct.toFixed(1),
        risk.confidence,
        risk.reportCount,
        weatherKey(bundle),
      ].join("|"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      bundle.region.id,
      bundle.crop.id,
      risk.glutRisk,
      risk.expectedProductionT,
      risk.oversupplyGapPct,
      risk.confidence,
      risk.reportCount,
      bundle.season.signalCoverage,
      bundle.season.capacityGrowthPct,
    ],
  );

  useEffect(() => {
    let cancelled = false;
    setBrief(null);
    setError(false);
    generate({
      regionId: bundle.region.id,
      cropId: bundle.crop.id,
      lang,
      fingerprint,
      risk: risk.glutRisk,
      supplyPct: Math.round(risk.productionChangePct),
      gapPct: Math.round(risk.oversupplyGapPct),
      confidence: risk.confidence,
      band: risk.band,
      drivers: risk.drivers.map((d) => ({ label: d.label, contribution: d.contribution })),
      regionName: bundle.region.name,
      cropName: bundle.crop.name,
    })
      .then((b: BriefResult) => {
        if (!cancelled) setBrief(b);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, lang]);

  return (
    <Panel
      title={t("brief.title")}
      meta={brief ? `${brief.model}${brief.cached ? " · cached" : ""}` : t("brief.meta")}
      right={
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="size-3" aria-hidden />
          {t("brief.badge")}
        </span>
      }
    >
      {error && (
        <p className="font-mono text-[11px] text-muted-foreground">{t("brief.error")}</p>
      )}
      {!error && !brief && (
        <p className="py-3 text-center font-mono text-[11px] text-muted-foreground">
          {t("brief.loading")}
        </p>
      )}
      {brief && (
        <>
          <p className="text-[13.5px] font-medium leading-snug text-foreground">
            {brief.headline}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-secondary-foreground">
            {brief.body}
          </p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {brief.actions.map((a, i) => (
              <li
                key={i}
                className="flex gap-2 text-[12.5px] leading-relaxed text-foreground"
              >
                <span className="font-mono text-[11px] text-fresh" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
          {brief.notice && (
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">
              {brief.notice}
            </p>
          )}
          <p className="mt-3 border-t border-border/60 pt-2 font-mono text-[10px] text-muted-foreground">
            {t("brief.foot")}
          </p>
        </>
      )}
    </Panel>
  );
}

/** Weather provenance goes into the fingerprint so refreshed data regenerates. */
function weatherKey(bundle: { region: { id: string } }): string {
  // Weather values live outside the engine result; the snapshot's
  // fetchedAt isn't exposed here, so the region id suffices for caching.
  return `wx:${bundle.region.id}`;
}
