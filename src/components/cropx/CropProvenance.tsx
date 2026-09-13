import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { useLang } from "@/i18n";
import { cropName } from "@/i18n/names";
import { cn } from "@/lib/utils";

/**
 * Crop provenance panel — shows WHERE the numbers come from for the active
 * crop: official all-India area/production/yield (GoI/NHB), Maharashtra's
 * share, the perishability profile that drives the absorption model, and
 * the source citation. This is the honesty backbone of the "real data"
 * claim: official aggregates are cited, derived splits are labeled.
 */
export function CropProvenance() {
  const { bundle } = useConsole();
  const { t, lang } = useLang();
  const crop = bundle.crop;
  const p = crop.provenance;
  const cropLabel = cropName(crop.id, lang);

  const perishLabel =
    crop.perishability >= 0.8
      ? t("prov.perish.veryHigh")
      : crop.perishability >= 0.6
        ? t("prov.perish.high")
        : crop.perishability >= 0.4
          ? t("prov.perish.moderate")
          : t("prov.perish.lower");

  return (
    <Panel
      title={t("prov.title")}
      meta={t("prov.meta", { crop: cropLabel })}
      right={
        <span
          className={cn(
            "border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
            p.kind === "official"
              ? "border-risk-low/40 bg-risk-low/10 text-risk-low"
              : "border-risk-medium/40 bg-risk-medium/10 text-risk-medium",
          )}
        >
          {p.kind === "official" ? t("dq.off") : t("dq.derived")}
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-mono-t">{t("prov.indiaArea")}</p>
          <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums text-foreground">
            {crop.indiaAreaLakhHa.toFixed(2)}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">{t("prov.lakhHa")}</span>
          </p>
          <p className="font-mono text-[9.5px] text-muted-foreground">
            {t("prov.finalEstimates", { y: p.year })}
          </p>
        </div>
        <div>
          <p className="font-mono-t">{t("prov.indiaProduction")}</p>
          <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums text-foreground">
            {crop.indiaProductionLakhT.toFixed(1)}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">{t("prov.lakhT")}</span>
          </p>
          <p className="font-mono text-[9.5px] text-muted-foreground">
            {t("prov.yield", { n: crop.indiaYieldTPerHa.toFixed(1) })}
          </p>
        </div>
        <div>
          <p className="font-mono-t">{t("prov.mhShare")}</p>
          <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums text-foreground">
            {(crop.mhShareOfIndia * 100).toFixed(1)}%
          </p>
          <p className="font-mono text-[9.5px] text-muted-foreground">
            {t("prov.mhArea", {
              n: (crop.mhAreaHa / 100_000).toFixed(1),
              y: crop.mhYieldTPerHa.toFixed(1),
            })}
          </p>
        </div>
        <div>
          <p className="font-mono-t">{t("prov.perishability")}</p>
          <p className="mt-0.5 font-mono text-[13px] font-medium leading-tight text-foreground">
            {perishLabel}
          </p>
          <p className="font-mono text-[9.5px] text-muted-foreground">
            {t("prov.window", { n: crop.storageWeeks })}
          </p>
        </div>
      </div>
      <p className="mt-3 border-t border-border/60 pt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
        {t("prov.foot", { source: p.source })}
      </p>
    </Panel>
  );
}
