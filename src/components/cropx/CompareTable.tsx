import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { formatT, formatHa } from "@/lib/cropx/format";
import { useLang } from "@/i18n";
import { cn } from "@/lib/utils";

function AnimatedCell({ value, format }: { value: number; format: (n: number) => string }) {
  const v = useAnimatedNumber(value);
  return <span className="tabular-nums">{format(v)}</span>;
}

function DeltaCell({
  delta,
  fmt,
  goodWhenNegative = true,
}: {
  delta: number;
  fmt: (n: number) => string;
  goodWhenNegative?: boolean;
}) {
  const significant = Math.round(Math.abs(delta * 100)) > 0;
  if (!significant) {
    return <span className="font-mono text-[11px] text-muted-foreground">—</span>;
  }
  const positive = delta > 0;
  // For risk metrics, up = bad (red); down = good (green). Inverted for "good when negative".
  const bad = goodWhenNegative ? positive : !positive;
  return (
    <span
      className={cn(
        "font-mono text-[11px] font-medium tabular-nums",
        bad ? "text-risk-critical" : "text-fresh",
      )}
    >
      {positive ? "+" : "−"}
      {fmt(Math.abs(delta))}
    </span>
  );
}

/**
 * Digital-twin view: BASELINE → SCENARIO with per-row deltas.
 * Every scenario lever change re-renders this table; numbers interpolate.
 */
export function CompareTable() {
  const { baseline, scenario, effectiveSeason } = useConsole();
  const { t } = useLang();
  const b = baseline.risk;
  const s = scenario.risk;
  const plantingDeltaPct = scenario.plantingDeltaPct;
  const capacityDeltaPct = scenario.capacityDeltaPct;

  const rows: {
    label: string;
    baselineNode: React.ReactNode;
    scenarioNode: React.ReactNode;
    delta: number;
    fmt: (n: number) => string;
  }[] = [
    {
      label: t("cmp.plantingArea"),
      baselineNode: <span>{formatHa(effectiveSeason.baselineAreaHa)}</span>,
      scenarioNode: (
        <AnimatedCell
          value={effectiveSeason.plantingAreaHa * (1 + plantingDeltaPct / 100)}
          format={formatHa}
        />
      ),
      delta: effectiveSeason.plantingAreaHa * (plantingDeltaPct / 100),
      fmt: formatHa,
    },
    {
      label: t("cmp.expectedProduction"),
      baselineNode: <AnimatedCell value={b.expectedProductionT} format={formatT} />,
      scenarioNode: <AnimatedCell value={s.expectedProductionT} format={formatT} />,
      delta: s.expectedProductionT - b.expectedProductionT,
      fmt: formatT,
    },
    {
      label: t("cmp.expectedArrivals"),
      baselineNode: <AnimatedCell value={b.expectedArrivalsT} format={formatT} />,
      scenarioNode: <AnimatedCell value={s.expectedArrivalsT} format={formatT} />,
      delta: s.expectedArrivalsT - b.expectedArrivalsT,
      fmt: formatT,
    },
    {
      label: t("cmp.oversupplyGap"),
      baselineNode: <AnimatedCell value={b.oversupplyGapT} format={formatT} />,
      scenarioNode: <AnimatedCell value={s.oversupplyGapT} format={formatT} />,
      delta: s.oversupplyGapT - b.oversupplyGapT,
      fmt: formatT,
    },
    {
      label: t("cmp.glutRisk"),
      baselineNode: <span>{b.glutRisk}%</span>,
      scenarioNode: (
        <AnimatedCell value={s.glutRisk} format={(n) => `${Math.round(n)}%`} />
      ),
      delta: s.glutRisk - b.glutRisk,
      fmt: (n) => `${Math.round(n)}%`,
    },
  ];

  return (
    <Panel
      title={t("cmp.title")}
      meta={t("cmp.meta")}
      right={
        <span className="font-mono text-[10px] text-muted-foreground">
          {plantingDeltaPct === 0 && capacityDeltaPct === 0
            ? t("cmp.noScenario")
            : t("cmp.applied", { p: `${plantingDeltaPct > 0 ? "+" : ""}${plantingDeltaPct}`, c: `${capacityDeltaPct > 0 ? "+" : ""}${capacityDeltaPct}` })}
        </span>
      }
    >
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="py-1.5 pr-2 font-medium">{t("cmp.metric")}</th>
            <th className="py-1.5 px-2 text-right font-medium">{t("cmp.baseline")}</th>
            <th className="py-1.5 px-2 text-right font-medium">{t("cmp.scenario")}</th>
            <th className="py-1.5 pl-2 text-right font-medium">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border/60 last:border-b-0">
              <td className="py-1.5 pr-2 text-[12px] text-secondary-foreground">{row.label}</td>
              <td className="py-1.5 px-2 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                {row.baselineNode}
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-[12.5px] font-medium tabular-nums text-foreground">
                {row.scenarioNode}
              </td>
              <td className="py-1.5 pl-2 text-right">
                <DeltaCell delta={row.delta} fmt={row.fmt} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
