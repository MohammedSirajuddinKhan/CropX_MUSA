import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { StatusTag } from "./StatusTag";
import { cropxApi } from "@/lib/cropx/data";
import { useLang } from "@/i18n";
import { cropName, districtName } from "@/i18n/names";
import { bandLabelT } from "./labels";

/**
 * CropX recommendation — generated from the current scenario risk state.
 * In production this is where the LLM's decision brief renders; numbers
 * still come from the engine, the LLM only words the brief. The brief body
 * stays English in v1 (it is generated content, not chrome); panel labels
 * follow the active language.
 */
export function RecommendationPanel() {
  const { scenario, baseline, bundle } = useConsole();
  const { t, lang } = useLang();
  const risk = scenario.risk;
  const regionName = districtName(bundle.region.id, lang);
  const cropNameL = cropName(bundle.crop.id, lang);
  const rec = cropxApi.getRecommendation(risk, bundle.region.name, bundle.crop.name);
  const changed = scenario.risk.glutRisk !== baseline.risk.glutRisk;
  const audienceLabel =
    rec.audience === "FPO"
      ? t("rec.audience.FPO")
      : rec.audience === "FPO + buyers"
        ? t("rec.audience.fpoBuyers")
        : t("rec.audience.all");

  return (
    <Panel
      title={t("rec.title")}
      meta={changed ? t("rec.reflectsScenario") : t("rec.baselineState")}
      right={<StatusTag band={risk.band} label={bandLabelT(t, risk.band)} />}
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
        <span>
          {t("rec.priority", { p: rec.priority })} · {t("rec.for", { audience: audienceLabel })}
        </span>
        <span>{t("rec.foot")}</span>
      </div>
    </Panel>
  );
}
