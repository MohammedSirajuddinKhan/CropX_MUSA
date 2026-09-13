import { useConsole } from "./console-state";
import { cn } from "@/lib/utils";
import type { ProvenanceKind } from "@/lib/cropx/types";

const KIND_STYLE: Record<ProvenanceKind, { tag: string; text: string }> = {
  official: { tag: "border-risk-low/40 bg-risk-low/10 text-risk-low", text: "OFFICIAL" },
  derived: { tag: "border-risk-medium/40 bg-risk-medium/10 text-risk-medium", text: "DERIVED" },
  simulated: { tag: "border-border bg-secondary text-muted-foreground", text: "SIMULATED" },
};

/**
 * Data honesty strip: what feeds the engine, how complete it is, when it was
 * last refreshed, and — new — the provenance lineage of every number class
 * (official GoI/NHB aggregates vs derived district splits vs simulated
 * signals). Kept visible per spec §21.
 */
export function DataCoverage() {
  const { bundle } = useConsole();
  const q = bundle.quality;

  return (
    <section className="border border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border/60 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono-t">data coverage</span>
          <span className="font-mono text-[12.5px] font-semibold tabular-nums text-foreground">
            {q.overallCoverage}%
          </span>
        </div>
        {q.sources.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className={
                s.status === "ok"
                  ? "inline-block size-1.5 bg-fresh"
                  : s.status === "delayed"
                    ? "inline-block size-1.5 bg-risk-medium"
                    : "inline-block size-1.5 bg-risk-high"
              }
              aria-hidden
            />
            <span className="font-mono text-[10.5px] text-muted-foreground">{s.label}</span>
            <span className="font-mono text-[10.5px] font-medium tabular-nums text-foreground">
              {s.coverage}%
            </span>
            {s.status !== "ok" && (
              <span className="font-mono text-[9px] uppercase tracking-wider text-risk-medium">
                {s.status}
              </span>
            )}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono-t">updated</span>
          <span className="font-mono text-[10.5px] text-foreground">{q.lastUpdatedLabel}</span>
        </div>
      </div>
      {/* Provenance lineage — what is real, what is derived, what is simulated */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-3.5 py-2">
        <span className="font-mono-t">number lineage</span>
        {q.lineage.map((l) => {
          const style = KIND_STYLE[l.kind];
          return (
            <div key={l.label} className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "shrink-0 border px-1 py-px font-mono text-[8.5px] font-semibold uppercase tracking-wider",
                  style.tag,
                )}
              >
                {style.text}
              </span>
              <span className="truncate font-mono text-[10px] text-muted-foreground" title={l.detail}>
                {l.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
