import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { formatHa } from "@/lib/cropx/format";
import { cn } from "@/lib/utils";

/**
 * Village / taluka node table for the active district + crop: planting area,
 * deviation vs 5-yr baseline, and stream freshness per node. Areas scale
 * with the selected crop — every district × crop cell has data.
 */
export function VillageTable() {
  const { bundle } = useConsole();
  const region = bundle.region;
  const villages = bundle.villages;
  const cropName = bundle.crop.name.toLowerCase();

  if (!villages.length) return null;

  return (
    <Panel
      title="Village / taluka nodes"
      meta={`${villages.length} monitored nodes · ${region.name} · ${cropName}`}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="py-1.5 pr-2 font-medium">Node</th>
            <th className="py-1.5 px-2 text-right font-medium">Planting</th>
            <th className="py-1.5 px-2 text-right font-medium">Share</th>
            <th className="py-1.5 px-2 text-right font-medium">vs median</th>
            <th className="py-1.5 pl-2 text-right font-medium">Stream</th>
          </tr>
        </thead>
        <tbody>
          {villages.map((v) => (
            <tr key={v.name} className="border-b border-border/60 last:border-b-0">
              <td className="py-1.5 pr-2 text-[12.5px] text-foreground">
                <span className="flex items-center gap-1.5">
                  {v.name}
                  {v.mandi && (
                    <span className="border border-border bg-secondary px-1 py-px font-mono text-[8.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                      mandi
                    </span>
                  )}
                </span>
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-[11.5px] tabular-nums text-foreground">
                {formatHa(v.areaHa)}
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                {(v.share * 100).toFixed(0)}%
              </td>
              <td
                className={cn(
                  "py-1.5 px-2 text-right font-mono text-[11.5px] font-medium tabular-nums",
                  v.deviationPct >= 0 ? "text-risk-high" : "text-fresh",
                )}
              >
                {v.deviationPct >= 0 ? "+" : "−"}
                {Math.abs(v.deviationPct).toFixed(1)}%
              </td>
              <td className="py-1.5 pl-2 text-right font-mono text-[10.5px] tabular-nums text-muted-foreground">
                {v.minutesAgo}m ago
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
        Node areas estimated from simulated FPO/taluka reports; shares
        normalized within the district. Prototype data, not live surveys.
      </p>
    </Panel>
  );
}
