import { useMemo, useState } from "react";
import { Link } from "react-router";
import { runEngine } from "@/lib/cropx/engine";
import { CROPS, SEASON_STATES } from "@/lib/cropx/dataset";
import type { ScenarioResult } from "@/lib/cropx/types";
import { cn } from "@/lib/utils";

/** Landing-page pipeline demo — a self-contained instance of the risk engine. */
function PipelineDemo() {
  const [delta, setDelta] = useState(0);
  const season = SEASON_STATES.nashik;
  const crop = CROPS[0];
  // Demo scenario runs on top of the current-season deviation (+18.5%),
  // matching the console's semantics: delta is the *additional* change.
  const result: ScenarioResult = useMemo(
    () => runEngine({ regionId: "nashik", crop, season, signals: [], plantingDeltaPct: delta }),
    [delta, crop, season],
  );
  const r = result.risk;
  const deviation =
    (season.plantingAreaHa * (1 + delta / 100) - season.baselineAreaHa) /
    season.baselineAreaHa * 100;

  const tone =
    r.band === "critical"
      ? "text-risk-critical"
      : r.band === "high"
        ? "text-risk-high"
        : r.band === "medium"
          ? "text-risk-medium"
          : "text-risk-low";

  return (
    <div className="border border-border bg-card">
      {/* Terminal chrome */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          cropx risk engine · nashik · onion
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">demo</span>
      </div>

      <div className="p-4">
        {/* Pipeline */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px]">
          <span className="border border-border bg-secondary px-2 py-1 text-muted-foreground">
            planting signals
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="border border-border bg-secondary px-2 py-1 text-muted-foreground">
            supply forecast
          </span>
          <span className="text-muted-foreground">→</span>
          <span className={cn("border px-2 py-1 font-semibold", tone, "border-current/30 bg-current/5")}>
            glut risk {Math.round(r.glutRisk)}%
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="border border-border bg-secondary px-2 py-1 text-muted-foreground">
            scenario
          </span>
        </div>

        {/* Readouts */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border/60 pt-3">
          <div>
            <p className="font-mono-t">planting</p>
            <p className="font-mono text-[15px] font-medium tabular-nums text-foreground">
              {deviation >= 0 ? "+" : "−"}
              {Math.abs(deviation).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="font-mono-t">expected supply</p>
            <p className="font-mono text-[15px] font-medium tabular-nums text-foreground">
              +{Math.round(r.productionChangePct)}%
            </p>
          </div>
          <div>
            <p className="font-mono-t">glut risk</p>
            <p className={cn("font-mono text-[19px] font-semibold tabular-nums", tone)}>
              {Math.round(r.glutRisk)}%
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="landing-slider" className="font-mono text-[11px] text-muted-foreground">
              projected planting change
            </label>
            <span className="font-mono text-[12px] font-semibold tabular-nums text-foreground">
              {delta > 0 ? "+" : delta < 0 ? "−" : "±"}
              {Math.abs(delta).toFixed(0)}%
            </span>
          </div>
          <input
            id="landing-slider"
            type="range"
            min={-20}
            max={30}
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none bg-input accent-fresh"
          />
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-term-grid">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[15px] font-bold tracking-tight text-foreground">cropx</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fresh">beta</span>
          </div>
          <nav className="flex items-center gap-4 font-mono text-[11.5px]">
            <a href="#method" className="text-muted-foreground hover:text-foreground">
              method
            </a>
            <Link
              to="/auth"
              className="border border-foreground bg-foreground px-3 py-1 font-medium text-background hover:opacity-85"
            >
              open console
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        {/* Hero */}
        <section className="pt-16 pb-10 md:pt-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-fresh">
            regional agricultural intelligence
          </p>
          <h1 className="mt-3 max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-foreground md:text-[44px]">
            See the glut before the market does.
          </h1>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-secondary-foreground">
            CropX detects when collective planting behavior is about to oversupply a regional
            market — 6 to 8 weeks before harvest, while there is still time to act.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="border border-foreground bg-foreground px-4 py-2 font-mono text-[12.5px] font-medium text-background hover:opacity-85"
            >
              open the console →
            </Link>
            <span className="font-mono text-[10.5px] text-muted-foreground">
              MUSA CodeX 2026 · problem CX0602 · prototype, simulated signal stream
            </span>
          </div>
        </section>

        {/* Product demo as hero */}
        <section className="pb-14">
          <PipelineDemo />
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
            live demo — drag the slider. the same engine runs the console; numbers are
            calibrated to a Nashik rabi-onion season and are not live government data.
          </p>
        </section>

        {/* Method */}
        <section id="method" className="border-t border-border py-12">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                method
              </p>
              <h2 className="mt-2 text-[19px] font-semibold leading-snug tracking-tight text-foreground">
                Not a price predictor. An oversupply detector.
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-secondary-foreground">
                Price models tell you what the market already knows. CropX models the supply
                side: planting reports, historical area, seasonality, and market absorption
                capacity. When projected arrivals exceed what the market can absorb, the risk
                score rises — weeks before prices move.
              </p>
            </div>
            <ul className="ruled-rows text-[12.5px] leading-relaxed">
              <li className="flex justify-between gap-4 py-2">
                <span className="text-muted-foreground">signal layer</span>
                <span className="text-right text-foreground">FPO &amp; farmer planting reports</span>
              </li>
              <li className="flex justify-between gap-4 py-2">
                <span className="text-muted-foreground">model</span>
                <span className="text-right text-foreground">XGBoost + SHAP (v1: calibrated engine)</span>
              </li>
              <li className="flex justify-between gap-4 py-2">
                <span className="text-muted-foreground">output</span>
                <span className="text-right text-foreground">glut risk + uncertainty, per district</span>
              </li>
              <li className="flex justify-between gap-4 py-2">
                <span className="text-muted-foreground">decisions</span>
                <span className="text-right text-foreground">scenario simulator &amp; briefs for FPOs</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-6">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-muted-foreground">
            <span>cropx · early-warning intelligence for regional crop oversupply</span>
            <span>prototype — signals simulated · v1 scope: nashik onion</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
