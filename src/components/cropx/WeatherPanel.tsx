import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { useLang } from "@/i18n";
import { districtName } from "@/i18n/names";

/**
 * District weather — REAL Open-Meteo data (observed 30 d + forecast 14 d),
 * ingested into Convex by cron/action. Numbers displayed are exactly what
 * the engine's weather driver consumed. When the snapshot hasn't arrived
 * yet, the panel honestly shows the fallback state instead of pretending.
 */
export function WeatherPanel() {
  const { weather, bundle } = useConsole();
  const { t, lang } = useLang();
  const district = districtName(bundle.region.id, lang);

  return (
    <Panel
      title={t("wx.title")}
      meta={weather ? `Open-Meteo · ${district}` : district}
      right={
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
            weather ? "text-fresh" : "text-muted-foreground"
          }`}
        >
          {weather ? t("wx.live") : t("wx.fallback")}
          {" · "}
          {weather ? weather.source : "open-meteo"}
        </span>
      }
    >
      {weather ? (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("wx.rain30"), value: `${weather.rainPast30dMm.toFixed(0)} mm` },
            { label: t("wx.rain14"), value: `${weather.rainNext14dMm.toFixed(0)} mm` },
            { label: t("wx.temp"), value: `${weather.tempNext14dMeanC.toFixed(0)} °C` },
          ].map((m) => (
            <div key={m.label} className="border border-border/60 px-2.5 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-1 font-mono text-[17px] leading-none text-foreground">
                {m.value}
              </p>
            </div>
          ))}
          <p className="col-span-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
            {t("wx.note")}
          </p>
        </div>
      ) : (
        <p className="py-3 text-center font-mono text-[11px] text-muted-foreground">
          {t("wx.connecting")}
        </p>
      )}
    </Panel>
  );
}
