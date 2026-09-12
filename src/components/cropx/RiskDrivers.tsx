import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import type { RiskDriver } from "@/lib/cropx/types";
import { cn } from "@/lib/utils";

const TIER_LABEL: Record<RiskDriver["tier"], string> = {
  high: "HIGH",
  "medium-high": "MED-HIGH",
  medium: "MEDIUM",
  "low-medium": "LOW-MED",
  low: "LOW",
};

/**
 * SHAP-style driver decomposition. Contributions are signed percentage
 * points; bars are scaled to the largest absolute contribution.
 */
export function RiskDrivers() {
  const { scenario } = useConsole();
  const drivers = scenario.risk.drivers;
  const maxAbs = Math.max(...drivers.map((d) => Math.abs(d.contribution)), 1);

  return (
    <Panel
      title="Why is the risk high?"
      meta="model drivers · shap-style"
      right={
        <span className="font-mono text-[10px] text-muted-foreground">
          {scenario.risk.modelVersion}
        </span>
      }
    >
      <ul className="flex flex-col gap-2.5">
        {drivers.map((d) => {
          const width = (Math.abs(d.contribution) / maxAbs) * 100;
          const positive = d.contribution >= 0;
          return (
            <li key={d.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3">
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12.5px] font-medium text-foreground">
                    {d.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[11.5px] font-semibold tabular-nums",
                      positive ? "text-risk-high" : "text-fresh",
                    )}
                  >
                    {positive ? "+" : "−"}
                    {Math.abs(d.contribution).toFixed(1)}pp
                  </span>
                </div>
                {/* Centered bar: contributions grow left (−) or right (+) from midline */}
                <div className="mt-1 flex h-1.5 items-center">
                  <div className="relative h-full w-full bg-border/50">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                    <div
                      className={cn(
                        "absolute inset-y-0",
                        positive ? "left-1/2 bg-risk-high" : "right-1/2 bg-risk-low",
                      )}
                      style={{ width: `${width / 2}%` }}
                    />
                  </div>
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{d.note}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 border px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.08em]",
                  d.tier === "high" && "border-risk-high/40 bg-risk-high/10 text-risk-high",
                  (d.tier === "medium-high" || d.tier === "medium") &&
                    "border-risk-medium/40 bg-risk-medium/10 text-risk-medium",
                  (d.tier === "low-medium" || d.tier === "low") &&
                    "border-border bg-secondary text-muted-foreground",
                )}
              >
                {TIER_LABEL[d.tier]}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 border-t border-border/60 pt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
        Contributions sum to the model score's deviation from neutral (50). Structured for
        direct SHAP output swap-in when the XGBoost service is connected.
      </p>
    </Panel>
  );
}
