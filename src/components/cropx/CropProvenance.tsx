import { useConsole } from "./console-state";
import { Panel } from "./Panel";
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
  const crop = bundle.crop;
  const p = crop.provenance;

  const perishLabel =
    crop.perishability >= 0.8
      ? "very high — no storage buffer"
      : crop.perishability >= 0.6
        ? "high — days, not weeks"
        : crop.perishability >= 0.4
          ? "moderate — short storage window"
          : "lower — storable across seasons";

  return (
    <Panel
      title="Data provenance"
      meta={`${crop.name.toLowerCase()} · season aggregates`}
      right={
        <span
          className={cn(
            "border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
            p.kind === "official"
              ? "border-risk-low/40 bg-risk-low/10 text-risk-low"
              : "border-risk-medium/40 bg-risk-medium/10 text-risk-medium",
          )}
        >
          {p.kind}
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-mono-t">India area</p>
          <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums text-foreground">
            {crop.indiaAreaLakhHa.toFixed(2)}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">lakh ha</span>
          </p>
          <p className="font-mono text-[9.5px] text-muted-foreground">{p.year} final estimates</p>
        </div>
        <div>
          <p className="font-mono-t">India production</p>
          <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums text-foreground">
            {crop.indiaProductionLakhT.toFixed(1)}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">lakh t</span>
          </p>
          <p className="font-mono text-[9.5px] text-muted-foreground">
            yield {crop.indiaYieldTPerHa.toFixed(1)} t/ha
          </p>
        </div>
        <div>
          <p className="font-mono-t">Maharashtra share</p>
          <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums text-foreground">
            {(crop.mhShareOfIndia * 100).toFixed(1)}%
          </p>
          <p className="font-mono text-[9.5px] text-muted-foreground">
            ≈ {(crop.mhAreaHa / 100_000).toFixed(1)} lakh ha · {crop.mhYieldTPerHa.toFixed(1)} t/ha
          </p>
        </div>
        <div>
          <p className="font-mono-t">Perishability</p>
          <p className="mt-0.5 font-mono text-[13px] font-medium leading-tight text-foreground">
            {perishLabel}
          </p>
          <p className="font-mono text-[9.5px] text-muted-foreground">
            marketable window ≈ {crop.storageWeeks} wk
          </p>
        </div>
      </div>
      <p className="mt-3 border-t border-border/60 pt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
        Source: {p.source}. India-level figures are published statistics;
        district × crop splits are derived allocations consistent with those
        totals, and planting signals are simulated (see coverage strip).
      </p>
    </Panel>
  );
}
