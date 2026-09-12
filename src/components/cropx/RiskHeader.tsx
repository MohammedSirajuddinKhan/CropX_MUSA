import { useConsole } from "./console-state";
import { StatusTag } from "./StatusTag";
import { formatT, formatHa } from "@/lib/cropx/format";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
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
  const r = scenario.risk;

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
            {bundle.region.district} · {bundle.region.state}
          </p>
          <h1 className="mt-0.5 text-[19px] font-semibold leading-tight tracking-tight text-foreground">
            {bundle.crop.name} — glut risk
          </h1>
          <div className="mt-1.5 flex items-center gap-2">
            <StatusTag band={r.band} label={r.band} />
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {r.weeksToHarvest} wks to harvest
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 md:ml-auto md:pl-6 md:border-l md:border-border">
        {/* Big number */}
        <div>
          <p className="font-mono-t">score</p>
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
            range {r.riskRange[0]}–{r.riskRange[1]} · confidence {r.confidence}%
          </p>
        </div>

        {/* Key quantities */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          <HeadStat label="expected supply" value={`+${Math.round(r.productionChangePct)}%`} sub="vs 5-yr median" />
          <HeadStat label="arrivals vs capacity" value={`${Math.round(r.absorptionPct)}%`} sub="of absorption" />
          <HeadStat label="oversupply gap" value={formatT(r.oversupplyGapT)} sub={`${Math.round(r.oversupplyGapPct)}% of capacity`} />
          <HeadStat label="planting" value={formatHa(bundle.season.plantingAreaHa)} sub={`median ${formatHa(bundle.season.baselineAreaHa)}`} />
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
