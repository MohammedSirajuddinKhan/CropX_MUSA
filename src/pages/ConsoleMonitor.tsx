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
import { runEngine } from "@/lib/cropx/engine";
import { SEASON_STATES, CROPS } from "@/lib/cropx/dataset";

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
 * Risk Monitor — regional view: forecast split, district comparison table,
 * arrivals vs absorption chart, coverage strip.
 */
export default function ConsoleMonitor() {
  const { bundle, regions } = useConsole();

  // Chart data: forecast with uncertainty band. The band renders as a stacked
  // pair: invisible base at `lo`, spread = hi − lo painted on top.
  const bandData = bundle.forecast.map((p) => ({
    week: p.label,
    lo: p.forecastLoT ?? null,
    spread: p.forecastLoT != null && p.forecastHiT != null ? p.forecastHiT - p.forecastLoT : null,
    mid: p.forecastT ?? null,
    arrivals: p.arrivalsT ?? null,
  }));

  // District comparison rows.
  const rows = regions
    .map((r) => {
      const season = SEASON_STATES[r.id];
      const risk = season
        ? runEngine({ regionId: r.id, crop: CROPS[0], season, signals: [] }).risk
        : null;
      return { region: r, risk };
    })
    .sort((a, b) => (b.risk?.glutRisk ?? 0) - (a.risk?.glutRisk ?? 0));

  return (
    <div className="flex flex-col gap-3">
      <RegionSwitcher />

      {/* Forecast chart with uncertainty band */}
      <Panel
        title="Arrivals forecast"
        meta="weekly tonnes · uncertainty band = confidence interval"
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
              />              <Tooltip
                content={<ForecastTooltip />}
                cursor={{ stroke: "var(--border)" }}
              />
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
            <span className="inline-block h-2.5 w-4 bg-chart-2/15" /> 76–88% style uncertainty envelope
          </span>
        </div>
      </Panel>

      {/* District risk table */}
      <Panel title="District risk table" meta="onion · baseline">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <th className="py-1.5 pr-2 font-medium">District</th>
              <th className="py-1.5 px-2 text-right font-medium">Glut risk</th>
              <th className="py-1.5 px-2 text-right font-medium">Band</th>
              <th className="py-1.5 px-2 text-right font-medium">Planting</th>
              <th className="py-1.5 px-2 text-right font-medium">Gap</th>
              <th className="py-1.5 pl-2 text-right font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ region, risk }) => (
              <tr key={region.id} className="border-b border-border/60 last:border-b-0">
                <td className="py-1.5 pr-2 text-[12.5px] font-medium text-foreground">
                  {region.name}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-[12.5px] font-semibold tabular-nums text-foreground">
                  {risk ? `${risk.glutRisk}%` : "—"}
                </td>
                <td className="py-1.5 px-2 text-right">
                  {risk ? <StatusTag band={risk.band} label={risk.band} /> : "—"}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                  {(region.areaHa / 1000).toFixed(0)}k ha
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                  {risk ? `${Math.round(risk.oversupplyGapPct)}%` : "—"}
                </td>
                <td className="py-1.5 pl-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                  {SEASON_STATES[region.id]?.signalCoverage ?? "—"}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <DataCoverage />
    </div>
  );
}
