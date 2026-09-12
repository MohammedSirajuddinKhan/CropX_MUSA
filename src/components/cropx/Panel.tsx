import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Terminal-style section container: squared, thin borders, mono header row.
 */
export function Panel({
  title,
  meta,
  right,
  children,
  className,
}: {
  title: string;
  meta?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col border border-border bg-card",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border bg-secondary/50 px-3.5 py-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-foreground">
            {title}
          </h2>
          {meta && (
            <span className="truncate font-mono text-[10px] text-muted-foreground">
              {meta}
            </span>
          )}
        </div>
        {right}
      </header>
      <div className="flex-1 p-3.5">{children}</div>
    </section>
  );
}

/** Labeled key–value row used across all analytical panels. */
export function StatRow({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: "fresh" | "amber" | "critical" | undefined;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 last:border-b-0">
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <span className="text-right">
        <span
          className={cn(
            "font-mono text-[12.5px] font-medium tabular-nums",
            accent === "fresh" && "text-fresh",
            accent === "amber" && "text-risk-medium",
            accent === "critical" && "text-risk-critical",
          )}
        >
          {value}
        </span>
        {sub && (
          <span className="ml-2 font-mono text-[10px] text-muted-foreground">{sub}</span>
        )}
      </span>
    </div>
  );
}

/** Large mono readout for headline numbers. */
export function BigReadout({
  value,
  unit,
  label,
  tone = "ink",
}: {
  value: string;
  unit?: string;
  label: string;
  tone?: "ink" | "fresh" | "amber" | "critical";
}) {
  const toneClass =
    tone === "fresh"
      ? "text-fresh"
      : tone === "amber"
        ? "text-risk-medium"
        : tone === "critical"
          ? "text-risk-critical"
          : "text-foreground";
  return (
    <div>
      <p className="font-mono-t">{label}</p>
      <p className={cn("mt-0.5 font-mono text-[26px] font-semibold leading-none tabular-nums", toneClass)}>
        {value}
        {unit && (
          <span className="ml-1 font-mono text-[13px] font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}
