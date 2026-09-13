import { useConsole } from "./console-state";
import { StatusTag } from "./StatusTag";
import { formatT, formatHa } from "@/lib/cropx/format";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { useLang } from "@/i18n";
import { cropName, districtName } from "@/i18n/names";
import { bandLabelT } from "./labels";
import { cn } from "@/lib/utils";

function AnimatedRisk({ value }: { value: number }) {
  const v = useAnimatedNumber(value);
  return <span className="tabular-nums">{Math.round(v)}</span>;
}

/**
 * Primary risk state — the first thing the user reads:
 * crop, region, glut risk score with band, uncertainty, coverage.
 */
export function RiskHeader() {
  const { scenario, bundle } = useConsole();
  const { t, lang } = useLang();
  const r = scenario.risk;
  const crop = cropName(bundle.crop.id, lang);
  const region = districtName(bundle.region.id, lang);
  const bandText = bandLabelT(t, r.band);

  return (
    <section
      className={cn(
        "flex flex-col gap-4 border border-border bg-card p-4 md:flex-row md:items-stretch",
        r.band === "critical" && "border-risk-critical/40",
        r.band === "high" && "border-risk-high/40",
      )}
    >
      {/* Identity + big score */}
      <div className="flex items-start gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {region} · {bundle.region.state}
          </p>
          <h1 className="mt-0.5 text-[19px] font-semibold leading-tight tracking-tight text-foreground">
            {t("risk.glutRiskTitle", { crop })}
          </h1>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusTag band={r.band} label={bandText} />
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {t("risk.wksToHarvest", { n: r.weeksToHarvest })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 md:ml-auto md:pl-6 md:border-l md:border-border">
        {/* Big number */}
        <div>
          <p className="font-mono-t">{t("risk.score")}</p>
          <p
            className={cn(
              "font-mono text-[44px] font-semibold leading-none tabular-nums",
              r.band === "critical"
                ? "text-risk-critical"
                : r.band === "high"
                  ? "text-risk-high"
                  : r.band === "medium"
                    ? "text-risk-medium"
                    : "text-risk-low",
            )}
          >
            <AnimatedRisk value={r.glutRisk} />
            <span className="text-[18px] font-normal text-muted-foreground">/100</span>
          </p>
          <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
            {t("risk.range", { lo: r.riskRange[0], hi: r.riskRange[1] })} ·{" "}
            {t("risk.confidence", { n: r.confidence })}
          </p>
        </div>

        {/* Key quantities */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          <HeadStat label={t("risk.expectedSupply")} value={`+${Math.round(r.productionChangePct)}%`} sub={t("risk.vsMedian")} />
          <HeadStat label={t("risk.arrivalsVsCapacity")} value={`${Math.round(r.absorptionPct)}%`} sub={t("risk.ofAbsorption")} />
          <HeadStat label={t("risk.oversupplyGap")} value={formatT(r.oversupplyGapT)} sub={t("risk.ofCapacity", { n: Math.round(r.oversupplyGapPct) })} />
          <HeadStat label={t("risk.planting")} value={formatHa(bundle.season.plantingAreaHa)} sub={t("risk.median", { area: formatHa(bundle.season.baselineAreaHa) })} />
        </div>
      </div>
    </section>
  );
}

function HeadStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="font-mono-t">{label}</p>
      <p className="font-mono text-[14px] font-semibold leading-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="font-mono text-[9.5px] text-muted-foreground">{sub}</p>
    </div>
  );
}
