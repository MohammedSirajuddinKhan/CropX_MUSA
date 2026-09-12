import { useConsole } from "./console-state";

/**
 * Data honesty strip: what feeds the engine, how complete it is, and when
 * it was last refreshed. Kept visible per spec §21.
 */
export function DataCoverage() {
  const { bundle } = useConsole();
  const q = bundle.quality;

  return (
    <section className="border border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3.5 py-2.5">
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
    </section>
  );
}
