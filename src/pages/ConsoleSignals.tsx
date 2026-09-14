import { useConsole } from "@/components/cropx/console-state";
import { Panel } from "@/components/cropx/Panel";
import { VillageTable } from "@/components/cropx/VillageTable";
import { formatHa } from "@/lib/cropx/format";
import { useLang } from "@/i18n";
import { cropName, districtName } from "@/i18n/names";
import { confidenceLabelT } from "@/components/cropx/labels";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  farmer: "FARMER",
  fpo: "FPO",
  survey: "SURVEY",
  buyer: "BUYER",
};

/**
 * Signal Stream — full prototype feed. All rows simulated; the page keeps
 * that label visible and offers the demo injector. Shows the merged stream
 * (injected batches first), district signal quality, and per-node coverage.
 */
export default function ConsoleSignals() {
  const {
    bundle,
    signalCount,
    injectedReports,
    injectSignals,
    baseline,
    scenario,
  } = useConsole();
  const { t, lang } = useLang();
  const season = bundle.season;

  const handleInject = (n: number) => {
    injectSignals(n);
  };

  const deviation =
    ((season.plantingAreaHa - season.baselineAreaHa) / season.baselineAreaHa) * 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Stream */}
        <Panel
          title={t("sp.title")}
          meta={t("sp.meta", {
            region: districtName(bundle.region.id, lang),
            crop: cropName(bundle.crop.id, lang),
          })}
          right={
            <span className="font-mono text-[10px] text-muted-foreground">
              {t("sig.reports", { n: signalCount.toLocaleString("en-IN") })}
              {injectedReports > 0 &&
                ` · ${t("sig.injected", { n: injectedReports.toLocaleString("en-IN") })}`}
            </span>
          }
        >
          <ul className="ruled-rows max-h-[420px] overflow-y-auto">
            {bundle.signals.slice(0, 14).map((sig) => (
              <li key={sig.id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 border border-border bg-secondary px-1 py-px font-mono text-[9px] font-semibold text-muted-foreground">
                    {KIND_LABEL[sig.kind] ?? sig.kind}
                  </span>
                  <span className="truncate text-[12.5px] text-foreground">{sig.org}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    · {sig.village}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                  {formatHa(sig.areaHa)} · {t("sig.minAgo", { n: sig.minutesAgo })}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("sig.inject")}
            </span>
            {[100, 250, 500].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleInject(n)}
                className="border border-border bg-secondary px-2.5 py-1 font-mono text-[11px] font-medium hover:bg-accent"
              >
                +{n}
              </button>
            ))}
            <span className="font-mono text-[10px] text-muted-foreground/80">
              {t("sp.bounded")}
            </span>
          </div>
        </Panel>

        {/* Signal quality */}
        <div className="flex flex-col gap-4">
          <Panel title={t("sp.quality")}>
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="font-mono-t">{t("top.coverage")}</p>
                <p className="mt-0.5 font-mono text-[22px] font-semibold leading-none tabular-nums text-foreground">
                  {season.signalCoverage}%
                </p>
                <div className="mt-1.5 h-1.5 w-full bg-border/60">
                  <div
                    className="h-full bg-fresh"
                    style={{ width: `${season.signalCoverage}%` }}
                  />
                </div>
              </div>
              <div className="mt-1 border-t border-border/60 pt-2.5">
                <p className="font-mono-t">{t("sp.confidence")}</p>
                <p className="mt-0.5 font-mono text-[13px] font-medium text-foreground">
                  {confidenceLabelT(t, season.signalConfidence)}
                </p>
              </div>
              <div>
                <p className="font-mono-t">{t("sp.reports")}</p>
                <p className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-foreground">
                  {season.reportCount.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="font-mono-t">{t("sp.estVsMedian")}</p>
                <p className="mt-0.5 font-mono text-[13px] font-medium tabular-nums text-foreground">
                  {formatHa(season.plantingAreaHa)}{" "}
                  <span className={deviation >= 0 ? "text-risk-high" : "text-fresh"}>
                    {deviation >= 0 ? "+" : "−"}
                    {Math.abs(deviation).toFixed(1)}%
                  </span>
                </p>
              </div>
            </div>
          </Panel>

          <Panel title={t("sp.effectTitle")} meta={t("sp.live")}>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">{t("sp.baseline")}</span>
              <span className="font-mono text-[15px] font-semibold tabular-nums text-foreground">
                {baseline.risk.glutRisk}%
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">{t("sp.currentScenario")}</span>
              <span
                className={cn(
                  "font-mono text-[15px] font-semibold tabular-nums",
                  scenario.risk.glutRisk > baseline.risk.glutRisk
                    ? "text-risk-high"
                    : scenario.risk.glutRisk < baseline.risk.glutRisk
                      ? "text-fresh"
                      : "text-foreground",
                )}
              >
                {scenario.risk.glutRisk}%
              </span>
            </div>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
              {t("sp.effectNote")}
            </p>
          </Panel>

          <VillageTable />
        </div>
      </div>
    </div>
  );
}
