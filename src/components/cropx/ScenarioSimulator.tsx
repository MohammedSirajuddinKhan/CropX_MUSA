import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { StatusTag } from "./StatusTag";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { formatT } from "@/lib/cropx/format";
import type { RiskAssessment } from "@/lib/cropx/types";

function AnimatedPct({ value, digits = 0 }: { value: number; digits?: number }) {
  const v = useAnimatedNumber(value);
  return (
    <span className="tabular-nums">{v.toFixed(digits)}</span>
  );
}

function AnimatedReadout({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const v = useAnimatedNumber(value);
  return <span className="tabular-nums">{format(v)}</span>;
}

const TICKS = [-20, -10, 0, +10, +20, +30];

/**
 * The hero feature. Planting-change slider drives the risk engine; every
 * readout recomputes and interpolates. Baseline column shows the zero-delta
 * state for direct A/B comparison.
 */
export function ScenarioSimulator() {
  const {
    bundle,
    baseline,
    scenario,
    plantingDeltaPct,
    capacityDeltaPct,
    setPlantingDelta,
    setCapacityDelta,
  } = useConsole();

  const b = baseline.risk;
  const s = scenario.risk;
  const isScenario = plantingDeltaPct !== 0 || capacityDeltaPct !== 0;

  const renderDelta = (d: number, digits = 1) => (
    <span className={d > 0 ? "text-risk-high" : d < 0 ? "text-fresh" : "text-muted-foreground"}>
      {d > 0 ? "+" : d < 0 ? "−" : "±"}
      {Math.abs(d).toFixed(digits)}
    </span>
  );

  return (
    <Panel
      title="Scenario Simulator"
      meta="what-if planting & absorption levers"
      right={
        isScenario ? (
          <button
            type="button"
            onClick={() => {
              setPlantingDelta(0);
              setCapacityDelta(0);
            }}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            reset to baseline
          </button>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground">baseline state</span>
        )
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Levers */}
        <div className="flex flex-col gap-4">
          {/* Planting lever */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label
                htmlFor="planting-slider"
                className="font-mono text-[11px] text-muted-foreground"
              >
                Projected planting change
              </label>
              <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                {plantingDeltaPct > 0 ? "+" : plantingDeltaPct < 0 ? "−" : "±"}
                {Math.abs(plantingDeltaPct).toFixed(0)}%
              </span>
            </div>
            <input
              id="planting-slider"
              type="range"
              min={-20}
              max={30}
              step={1}
              value={plantingDeltaPct}
              onChange={(e) => setPlantingDelta(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-none bg-input accent-fresh focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-valuetext={`${plantingDeltaPct > 0 ? "plus" : plantingDeltaPct < 0 ? "minus" : "no"} ${Math.abs(plantingDeltaPct)} percent planting change`}
            />
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground/80">
              {TICKS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPlantingDelta(t)}
                  className="hover:text-foreground"
                >
                  {t > 0 ? `+${t}` : t}
                </button>
              ))}
            </div>
          </div>

          {/* Absorption lever */}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label
                htmlFor="capacity-slider"
                className="font-mono text-[11px] text-muted-foreground"
              >
                Market absorption shift
              </label>
              <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                {capacityDeltaPct > 0 ? "+" : capacityDeltaPct < 0 ? "−" : "±"}
                {Math.abs(capacityDeltaPct).toFixed(0)}%
              </span>
            </div>
            <input
              id="capacity-slider"
              type="range"
              aria-label="Market absorption shift"
              min={-15}
              max={15}
              step={1}
              value={capacityDeltaPct}
              onChange={(e) => setCapacityDelta(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-none bg-input accent-fresh focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-valuetext={`${capacityDeltaPct} percent absorption shift`}
            />
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground/80">
              <span>−15% (disruption)</span>
              <span>0</span>
              <span>+15% (new buyers/storage)</span>
            </div>
          </div>

          {/* Diversification preset */}
          <div className="border border-dashed border-border p-3">
            <p className="font-mono-t">Preset · diversify planting</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-secondary-foreground">
              Shift roughly a quarter of marginal onion plots out of onion. Area
              falls below the 5-yr median and projected arrivals move back within
              absorption tolerance.
            </p>
            <button
              type="button"
              onClick={() => setPlantingDelta(-23)}
              className="mt-2 border border-border bg-secondary px-3 py-1 font-mono text-[11px] font-medium text-foreground hover:bg-accent"
            >
              Run diversification scenario →
            </button>
          </div>
        </div>

        {/* Live result readout */}
        <div className="flex flex-col gap-3">
          {/* Glut risk */}
          <div className="border border-border bg-secondary/40 p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono-t">Glut risk — scenario</p>
                <p className="mt-1 font-mono text-[34px] font-semibold leading-none tabular-nums text-foreground">
                  <AnimatedPct value={s.glutRisk} />
                  <span className="ml-1 text-[15px] font-normal text-muted-foreground">%</span>
                </p>
                <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                  range {s.riskRange[0]}–{s.riskRange[1]}% · conf {s.confidence}%
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusTag band={s.band} label={s.band} />
                {isScenario && (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    baseline <span className="tabular-nums">{b.glutRisk}%</span>{" "}
                    {renderDelta(s.glutRisk - b.glutRisk, 0)}
                  </span>
                )}
              </div>
            </div>
            {/* Mini risk meter */}
            <div className="mt-3">
              <div className="h-1.5 w-full bg-border/70">
                <div
                  className={
                    s.band === "critical"
                      ? "h-full bg-risk-critical transition-all duration-300"
                      : s.band === "high"
                        ? "h-full bg-risk-high transition-all duration-300"
                        : s.band === "medium"
                          ? "h-full bg-risk-medium transition-all duration-300"
                          : "h-full bg-risk-low transition-all duration-300"
                  }
                  style={{ width: `${s.glutRisk}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground/70">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          </div>

          {/* Supply stats: scenario vs baseline */}
          <div className="grid grid-cols-2 gap-3">
            <StatCell
              label="Expected production"
              scenario={<AnimatedReadout value={s.expectedProductionT} format={formatT} />}
              baseline={<AnimatedReadout value={b.expectedProductionT} format={formatT} />}
              delta={s.expectedProductionT - b.expectedProductionT}
              formatDelta={formatT}
            />
            <StatCell
              label="Expected arrivals"
              scenario={<AnimatedReadout value={s.expectedArrivalsT} format={formatT} />}
              baseline={<AnimatedReadout value={b.expectedArrivalsT} format={formatT} />}
              delta={s.expectedArrivalsT - b.expectedArrivalsT}
              formatDelta={formatT}
            />
            <StatCell
              label="Oversupply gap"
              scenario={<AnimatedReadout value={s.oversupplyGapT} format={formatT} />}
              baseline={<AnimatedReadout value={b.oversupplyGapT} format={formatT} />}
              delta={s.oversupplyGapT - b.oversupplyGapT}
              formatDelta={formatT}
            />
            <StatCell
              label="vs 5-yr median"
              scenario={
                <span>
                  {s.productionChangePct >= 0 ? "+" : "−"}
                  {Math.abs(s.productionChangePct).toFixed(0)}%
                </span>
              }
              baseline={
                <span>
                  {b.productionChangePct >= 0 ? "+" : "−"}
                  {Math.abs(b.productionChangePct).toFixed(0)}%
                </span>
              }
            />
          </div>

          {/* Confidence + honesty */}
          <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
            Engine: {s.modelVersion} · signals: simulated FPO/farmer stream
            (prototype) · coverage {bundle.season.signalCoverage}% · production model
            is calibrated to a Nashik rabi-onion season, not a live XGBoost backend.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function StatCell({
  label,
  scenario,
  baseline,
  delta,
  formatDelta,
}: {
  label: string;
  scenario: React.ReactNode;
  baseline: React.ReactNode;
  delta?: number;
  formatDelta?: (n: number) => string;
}) {
  const showDelta = delta !== undefined && Math.round(Math.abs(delta)) > 0;
  return (
    <div className="border border-border/70 p-2.5">
      <p className="font-mono-t">{label}</p>
      <p className="mt-1 font-mono text-[16px] font-medium leading-tight tabular-nums text-foreground">
        {scenario}
      </p>
      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
        base {baseline}
        {showDelta && formatDelta && (
          <span className="ml-1 text-risk-high">
            ({delta > 0 ? "+" : "−"}
            {formatDelta(Math.abs(delta))})
          </span>
        )}
      </p>
    </div>
  );
}
