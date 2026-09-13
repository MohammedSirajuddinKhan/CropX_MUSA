import { useState } from "react";
import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { formatHa } from "@/lib/cropx/format";
import { useLang } from "@/i18n";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  farmer: "FARMER",
  fpo: "FPO",
  survey: "SURVEY",
  buyer: "BUYER",
};

/**
 * Prototype signal stream. All rows are simulated; the panel keeps that
 * label visible per the data-honesty rule. The injector lets the team push
 * additional reports during the demo and watch coverage/risk respond.
 */
export function PlantingSignals() {
  const { bundle, signalCount, injectedReports, injectSignals } = useConsole();
  const { t, lang } = useLang();
  const [pulse, setPulse] = useState(0);
  const season = bundle.season;

  const handleInject = (n: number) => {
    injectSignals(n);
    setPulse((p) => p + 1); // re-triggers the flash on the stream
  };

  const deviation =
    ((season.plantingAreaHa - season.baselineAreaHa) / season.baselineAreaHa) * 100;

  return (
    <Panel
      title={t("sig.title")}
      meta={t("sig.meta")}
      right={
        <span className="font-mono text-[10px] text-muted-foreground">
          {t("sig.reports", { n: signalCount.toLocaleString("en-IN") })}
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="font-mono-t">{t("sig.estPlanting")}</p>
          <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums text-foreground">
            {formatHa(season.plantingAreaHa)}
          </p>
        </div>
        <div>
          <p className="font-mono-t">{t("sig.median5yr")}</p>
          <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums text-foreground">
            {formatHa(season.baselineAreaHa)}
          </p>
        </div>
        <div>
          <p className="font-mono-t">{t("sig.deviation")}</p>
          <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums text-risk-high">
            +{deviation.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Stream */}
      <div
        key={pulse}
        className="mt-3 animate-in fade-in duration-500"
      >
        <ul className="ruled-rows max-h-56 overflow-y-auto">
          {bundle.signals.slice(0, 8).map((sig) => (
            <li key={sig.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 border border-border bg-secondary px-1 py-px font-mono text-[9px] font-semibold text-muted-foreground">
                  {KIND_LABEL[sig.kind] ?? sig.kind}
                </span>
                <span className="truncate text-[12px] text-foreground">{sig.org}</span>
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
      </div>

      {/* Injector */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("sig.inject")}
        </span>
        {[100, 250].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleInject(n)}
            className="border border-border bg-secondary px-2.5 py-1 font-mono text-[11px] font-medium hover:bg-accent"
          >
            +{n}
          </button>
        ))}
        <span className={cn("ml-auto font-mono text-[10px] text-muted-foreground")}>
          {t("sig.coverage", { n: bundle.season.signalCoverage })}
          {injectedReports > 0 &&
            ` · ${t("sig.injected", { n: injectedReports.toLocaleString("en-IN") })}`}
        </span>
      </div>
    </Panel>
  );
}
