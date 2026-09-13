import { useMemo, useState } from "react";
import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { cn } from "@/lib/utils";
import { EXCLUDED_DISTRICTS } from "@/lib/cropx/dataset";

/**
 * District risk grid — every monitored district as a selectable cell, tinted
 * by baseline glut-risk band with the score printed in text (risk is never
 * color-alone). Splits Maharashtra into its four recognized divisions.
 */

type Cell = { id: string; name: string; risk: number; band: string };

const DIVISIONS: { label: string; ids: string[] }[] = [
  { label: "Pune division", ids: ["pune", "ahmednagar", "solapur", "satara", "sangli", "kolhapur"] },
  { label: "Nashik division", ids: ["nashik", "dhule", "nandurbar", "jalgaon", "buldhana", "palghar", "thane"] },
  { label: "Chhatrapati Sambhajinagar (Marathwada)", ids: ["aurangabad", "beed", "jalna", "latur", "dharashiv", "nanded", "parbhani", "hingoli"] },
  { label: "Nagpur (Vidarbha)", ids: ["nagpur", "amravati", "akola", "washim", "yavatmal", "wardha", "bhandara", "gondia", "chandrapur", "gadchiroli"] },
  { label: "Konkan", ids: ["raigad", "ratnagiri", "sindhudurg"] },
];

function bandTone(risk: number): { cell: string; text: string } {
  if (risk >= 85) return { cell: "bg-risk-critical/15 hover:bg-risk-critical/25", text: "text-risk-critical" };
  if (risk >= 65) return { cell: "bg-risk-high/12 hover:bg-risk-high/22", text: "text-risk-high" };
  if (risk >= 40) return { cell: "bg-risk-medium/12 hover:bg-risk-medium/22", text: "text-risk-medium" };
  return { cell: "bg-risk-low/10 hover:bg-risk-low/20", text: "text-risk-low" };
}

export function DistrictRiskGrid({ compact = false }: { compact?: boolean }) {
  const { districtRows, bundle, setRegion } = useConsole();

  const byId = useMemo(() => {
    const m = new Map<string, Cell>();
    for (const row of districtRows) {
      m.set(row.region.id, {
        id: row.region.id,
        name: row.region.name,
        risk: row.risk.glutRisk,
        band: row.risk.band,
      });
    }
    return m;
  }, [districtRows]);

  return (
    <Panel
      title="District risk grid"
      meta={`${districtRows.length} monitored districts · onion baseline`}
      right={
        <span className="font-mono text-[10px] text-muted-foreground">
          {EXCLUDED_DISTRICTS.map((d) => d.name).join(" · ")} — not monitored (urban, negligible cultivated area)
        </span>
      }
      className={compact ? "" : undefined}
    >
      <div className="flex flex-col gap-3">
        {DIVISIONS.map((div) => {
          const cells = div.ids
            .map((id) => byId.get(id))
            .filter((c): c is Cell => c !== undefined);
          if (cells.length === 0) return null;
          return (
            <div key={div.label}>
              <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                {div.label}
              </p>
              <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-7">
                {cells.map((c) => {
                  const active = c.id === bundle.region.id;
                  const tone = bandTone(c.risk);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRegion(c.id)}
                      title={`${c.name} — glut risk ${c.risk}% (${c.band})`}
                      className={cn(
                        "border px-1.5 py-1 text-left transition-colors",
                        tone.cell,
                        active
                          ? "border-foreground ring-1 ring-foreground/60"
                          : "border-border hover:border-muted-foreground/50",
                      )}
                    >
                      <span className="block truncate text-[11px] font-medium text-foreground">
                        {c.name}
                      </span>
                      <span className={cn("font-mono text-[11.5px] font-semibold tabular-nums", tone.text)}>
                        {c.risk}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
