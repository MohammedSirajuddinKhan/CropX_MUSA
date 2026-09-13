import { useConsole } from "./console-state";
import { useLang } from "@/i18n";
import type { ProvenanceKind } from "@/lib/cropx/types";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<ProvenanceKind, { tag: string; textKey: string }> = {
  official: { tag: "border-risk-low/40 bg-risk-low/10 text-risk-low", textKey: "dq.off" },
  derived: { tag: "border-risk-medium/40 bg-risk-medium/10 text-risk-medium", textKey: "dq.derived" },
  simulated: { tag: "border-border bg-secondary text-muted-foreground", textKey: "dq.simulated" },
};

/** Lineage label + detail translation keys, matched by label id. */
const LINEAGE_KEYS: Record<string, { labelKey: string; detailKey: string }> = {
  area: { labelKey: "dq.lin.area", detailKey: "dq.lin.areaDetail" },
  district: { labelKey: "dq.lin.district", detailKey: "dq.lin.districtDetail" },
  signals: { labelKey: "dq.lin.signals", detailKey: "dq.lin.signalsDetail" },
  mandi: { labelKey: "dq.lin.mandi", detailKey: "dq.lin.mandiDetail" },
};

/**
 * Data honesty strip: what feeds the engine, how complete it is, when it was
 * last refreshed, and the provenance lineage of every number class
 * (official GoI/NHB aggregates vs derived district splits vs simulated
 * signals vs live mandi prices). Kept visible per spec §21.
 */
export function DataCoverage() {
  const { bundle } = useConsole();
  const { t } = useLang();
  const q = bundle.quality;

  return (
    <section className="border border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border/60 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono-t">{t("dq.coverage")}</span>
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
                {t("dq.status.delayed")}
              </span>
            )}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono-t">{t("dq.updated")}</span>
          <span className="font-mono text-[10.5px] text-foreground">{q.lastUpdatedLabel}</span>
        </div>
      </div>
      {/* Provenance lineage — what is real, what is derived, what is simulated */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-3.5 py-2">
        <span className="font-mono-t">{t("dq.lineage")}</span>
        {q.lineage.map((l) => {
          const style = KIND_STYLE[l.kind];
          const keys = LINEAGE_KEYS[l.label];
          return (
            <div key={l.label} className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "shrink-0 border px-1 py-px font-mono text-[8.5px] font-semibold uppercase tracking-wider",
                  style.tag,
                )}
              >
                {t(style.textKey as never)}
              </span>
              <span
                className="truncate font-mono text-[10px] text-muted-foreground"
                title={keys ? t(keys.detailKey as never) : l.detail}
              >
                {keys ? t(keys.labelKey as never) : l.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
