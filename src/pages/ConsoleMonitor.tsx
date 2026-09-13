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
import { StatusTag } from "@/components/cropx/StatusTag";
import { DataCoverage } from "@/components/cropx/DataCoverage";
import { RegionSwitcher } from "@/components/cropx/RegionSwitcher";
import { DistrictRiskGrid } from "@/components/cropx/DistrictRiskGrid";
import { formatT, formatHa } from "@/lib/cropx/format";
import { cn } from "@/lib/utils";

function ForecastTooltip({ active, payload, label }: TooltipProps<number, string>) {
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
          forecast · {Number(row.value).toLocaleString()} t
        </p>
      )}
      {arr && (
        <p className="tabular-nums text-muted-foreground">
          arrivals · {Number(arr.value).toLocaleString()} t
        </p>
      )}
    </div>
  );
}

/**
 * Risk Monitor — state-wide view: forecast split (scenario-aware), the full
 * district risk grid, a sortable district table, and the coverage strip.
 */
export default function ConsoleMonitor() {
  const { bundle, scenario, baseline, districtRows, setRegion, crop } = useConsole();

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

  const rows = [...districtRows].sort((a, b) => b.risk.glutRisk - a.risk.glutRisk);

  return (
    <div className="flex flex-col gap-3">
      <RegionSwitcher />

      {/* Forecast chart with uncertainty band */}
      <Panel
        title="Arrivals forecast"
        meta={`${bundle.region.name} · ${crop.name.toLowerCase()} · weekly tonnes · uncertainty band = confidence interval`}
        right={
          scenario.risk.glutRisk !== baseline.risk.glutRisk ? (
            <span className="font-mono text-[10px] text-muted-foreground">
              scenario applied — forecast scaled{" "}
              <span className="tabular-nums">
                {pScale >= 1 ? "+" : "−"}
                {Math.abs((pScale - 1) * 100).toFixed(0)}%
              </span>
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
            <span className="inline-block h-px w-4 bg-chart-2" /> forecast (next 8 wks)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-4 border-t border-dashed border-chart-1" /> historical arrivals
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-4 border-t border-dotted border-chart-3" /> absorption capacity
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-4 bg-chart-2/15" /> confidence envelope
          </span>
        </div>
      </Panel>

      {/* Full district risk grid */}
      <DistrictRiskGrid />

      {/* District risk table — all districts, sortable by risk (pre-sorted) */}
      <Panel
        title="District risk table"
        meta={`${crop.name.toLowerCase()} · baseline · ${rows.length} districts`}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="py-1.5 pr-2 font-medium">District</th>
              <th className="py-1.5 px-2 text-right font-medium">Glut risk</th>
              <th className="py-1.5 px-2 text-right font-medium">Band</th>
              <th className="py-1.5 px-2 text-right font-medium">Planting</th>
              <th className="py-1.5 px-2 text-right font-medium">Gap</th>
              <th className="py-1.5 px-2 text-right font-medium">Reports</th>
              <th className="py-1.5 pl-2 text-right font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ region, risk, season }) => {
              const active = region.id === bundle.region.id;
              return (
                <tr
                  key={region.id}
                  onClick={() => setRegion(region.id)}
                  className={cn(
                    "cursor-pointer border-b border-border/60 last:border-b-0 transition-colors hover:bg-secondary/50",
                    active && "bg-secondary/70",
                  )}
                >
                  <td className="py-1.5 pr-2 text-[12.5px] font-medium text-foreground">
                    {region.name}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-[12.5px] font-semibold tabular-nums text-foreground">
                    {risk.glutRisk}%
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <StatusTag band={risk.band} label={risk.band} />
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                    {formatHa(season.plantingAreaHa)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                    {Math.round(risk.oversupplyGapPct)}%
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                    {season.reportCount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-1.5 pl-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                    {season.signalCoverage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <DataCoverage />
    </div>
  );
}
