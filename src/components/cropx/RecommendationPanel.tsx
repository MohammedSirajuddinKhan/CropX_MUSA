import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { StatusTag } from "./StatusTag";
import { cropxApi } from "@/lib/cropx/data";

/**
 * CropX recommendation — generated from the current scenario risk state.
 * In production this is where the LLM's decision brief renders; numbers
 * still come from the engine, the LLM only words the brief.
 */
export function RecommendationPanel() {
  const { scenario, baseline, bundle } = useConsole();
  const risk = scenario.risk;
  const rec = cropxApi.getRecommendation(risk, bundle.region.name, bundle.crop.name);
  const changed = scenario.risk.glutRisk !== baseline.risk.glutRisk;

  return (
    <Panel
      title="CropX recommendation"
      meta={changed ? "reflects active scenario" : "baseline state"}
      right={<StatusTag band={risk.band} label={`priority: ${rec.priority}`} />}
    >
      <p className="text-[13.5px] font-medium leading-snug text-foreground">
        {rec.headline}
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-secondary-foreground">
        {rec.reason}
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {rec.actions.map((a, i) => (
          <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-foreground">
            <span className="font-mono text-[11px] text-fresh" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{a}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 font-mono text-[10px] text-muted-foreground">
        <span>for: {rec.audience}</span>
        <span>brief generated from model output · not investment advice</span>
      </div>
    </Panel>
  );
}
