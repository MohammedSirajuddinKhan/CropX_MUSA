import type { TooltipProps } from "recharts";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useConsole } from "@/components/cropx/console-state";
import { Panel } from "@/components/cropx/Panel";
import { DataCoverage } from "@/components/cropx/DataCoverage";
import { RegionSwitcher } from "@/components/cropx/RegionSwitcher";
import { DistrictRiskGrid } from "@/components/cropx/DistrictRiskGrid";
import { CompareTable } from "@/components/cropx/CompareTable";
import { MandiPrices } from "@/components/cropx/MandiPrices";
import { WeatherPanel } from "@/components/cropx/WeatherPanel";
import { CropProvenance } from "@/components/cropx/CropProvenance";
import { useLang } from "@/i18n";
import { cropName, districtName } from "@/i18n/names";

function ForecastTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const { t } = useLang();
  if (!active || !payload?.length) return null;
  const row = payload.find((p) => p.dataKey === "mid");
  const arr = payload.find((p) => p.dataKey === "arrivals");
  return (
    <div
      className="border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] text-foreground"
      style={{ boxShadow: "0 1px 2px oklch(0.22 0.005 90 / 0.08)" }}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {row && (
        <p className="tabular-nums">
          {t("mon.tooltipForecast", { n: Number(row.value).toLocaleString() })}
        </p>
      )}
      {arr && (
        <p className="tabular-nums text-muted-foreground">
          {t("mon.tooltipArrivals", { n: Number(arr.value).toLocaleString() })}
        </p>
      )}
    </div>
  );
}

/**
 * Risk Monitor — the full data picture, kept scannable:
 * forecast split (scenario-aware) → all-district grid (click a cell to
 * inspect that district; per-district planting/gap/coverage detail lives in
 * the Risk header once selected) → digital twin (baseline → scenario) →
 * LIVE mandi + weather feeds → provenance + data-honesty strip.
 */
export default function ConsoleMonitor() {
  const { bundle, scenario, baseline, crop } = useConsole();
  const { t, lang } = useLang();

  // Chart reacts to the active scenario: production scales the forecast line,
  // absorption shift scales the capacity line. History stays untouched.
  const pScale = baseline.risk.expectedProductionT > 0
    ? scenario.risk.expectedProductionT / baseline.risk.expectedProductionT
    : 1;
  const cScale = baseline.risk.expectedArrivalsT > 0
    ? 1 + scenario.capacityDeltaPct / 100
    : 1;

  const forecast = bundle.forecast;
  const bandData = forecast.map((p) => ({
    week: p.label,
    lo: p.forecastLoT != null ? Math.round(p.forecastLoT * pScale) : null,
    spread:
      p.forecastLoT != null && p.forecastHiT != null
        ? Math.round((p.forecastHiT - p.forecastLoT) * pScale)
        : null,
    mid: p.forecastT != null ? Math.round(p.forecastT * pScale) : null,
    arrivals: p.arrivalsT ?? null,
    absorption: p.absorptionT != null ? Math.round(p.absorptionT * cScale) : null,
  }));

  return (
    <div className="flex flex-col gap-4">
      <RegionSwitcher />

      {/* Forecast chart with uncertainty band */}
      <Panel
        title={t("mon.forecastTitle")}
        meta={t("mon.forecastMeta", {
          region: districtName(bundle.region.id, lang),
          crop: cropName(crop.id, lang),
        })}
        right={
          scenario.risk.glutRisk !== baseline.risk.glutRisk ? (
            <span className="font-mono text-[10px] text-muted-foreground">
              {t("mon.scenarioApplied", {
                d: `${pScale >= 1 ? "+" : "−"}${Math.abs((pScale - 1) * 100).toFixed(0)}`,
              })}
            </span>
          ) : undefined
        }
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bandData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fontFamily: "var(--font-plex-mono)", fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 10, fontFamily: "var(--font-plex-mono)", fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                width={44}
              />
              <Tooltip content={<ForecastTooltip />} cursor={{ stroke: "var(--border)" }} />
              {/* Uncertainty band: invisible base at lo, spread painted above */}
              <Area
                type="linear"
                dataKey="lo"
                stackId="band"
                stroke="none"
                fill="none"
                connectNulls={false}
              />
              <Area
                type="linear"
                dataKey="spread"
                stackId="band"
                stroke="none"
                fill="var(--chart-2)"
                fillOpacity={0.14}
                connectNulls={false}
              />
              <Area
                type="linear"
                dataKey="mid"
                stroke="var(--chart-2)"
                strokeWidth={1.5}
                fill="none"
                dot={false}
                connectNulls={false}
              />
              <Area
                type="linear"
                dataKey="arrivals"
                stroke="var(--chart-1)"
                strokeWidth={1.25}
                strokeDasharray="4 3"
                fill="none"
                dot={false}
                connectNulls={false}
              />
              <Area
                type="linear"
                dataKey="absorption"
                stroke="var(--chart-3)"
                strokeWidth={1.25}
                strokeDasharray="2 3"
                fill="none"
                dot={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 flex flex-wrap gap-4 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-4 bg-chart-2" /> {t("mon.legendForecast")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-4 border-t border-dashed border-chart-1" /> {t("mon.legendHistorical")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-4 border-t border-dotted border-chart-3" /> {t("mon.legendAbsorption")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4 bg-chart-2/15" /> {t("mon.legendEnvelope")}
          </span>
        </div>
      </Panel>

      {/* All-district risk grid (selectable; replaces the old long table) */}
      <DistrictRiskGrid />

      {/* Digital twin (baseline → scenario) + live data feeds */}
      <div className="grid gap-4 xl:grid-cols-2">
        <CompareTable />
        <div className="grid content-start gap-4">
          <MandiPrices />
          <WeatherPanel />
        </div>
      </div>

      {/* Where this crop's numbers come from (official/derived citations) */}
      <CropProvenance />

      <DataCoverage />
    </div>
  );
}
