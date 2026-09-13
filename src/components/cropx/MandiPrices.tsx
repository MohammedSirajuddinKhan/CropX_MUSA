import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConsole } from "./console-state";
import { Panel } from "./Panel";
import { useLang } from "@/i18n";
import { districtName } from "@/i18n/names";
import { cn } from "@/lib/utils";

/**
 * Mandi prices — LIVE official data from AGMARKNET (data.gov.in), cached in
 * Convex and refreshed by a cron. This panel is the only place in the app
 * fed by a real government API, and it says so. When the ingest has never
 * run (no API key yet), the panel shows OFFLINE with honest demo values
 * clearly labeled as such — never passing them off as official.
 */

/** Demo values, used only when the live cache is empty. Labeled as demo. */
const DEMO_QUOTES: Record<string, { market: string; district: string; modal: number }[]> = {
  onion: [
    { market: "Lasalgaon", district: "nashik", modal: 1420 },
    { market: "Pimpalgaon", district: "nashik", modal: 1385 },
    { market: "Rahata", district: "ahmednagar", modal: 1360 },
    { market: "Baramati", district: "pune", modal: 1345 },
    { market: "Pandharpur", district: "solapur", modal: 1290 },
  ],
  tomato: [
    { market: "Pimpalgaon", district: "nashik", modal: 980 },
    { market: "Baramati", district: "pune", modal: 940 },
    { market: "Nashik", district: "nashik", modal: 910 },
  ],
  potato: [
    { market: "Atpadi", district: "solapur", modal: 1120 },
    { market: "Baramati", district: "pune", modal: 1080 },
  ],
};

const LOCALE: Record<string, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

export function MandiPrices() {
  const { crop } = useConsole();
  const { t, lang } = useLang();

  const feed = useQuery(api.mandi.latestQuotes, { cropId: crop.id, limit: 10 });
  const sync = useQuery(api.mandi.syncStatus, {});

  const hasLive = !!feed && feed.quotes.length > 0;
  const live = hasLive && sync?.status === "ok";
  const state = live ? "live" : sync?.status === "ok" ? "stale" : "demo";

  const updatedLabel = hasLive
    ? new Date(feed.fetchedAt).toLocaleString(LOCALE[lang] ?? "en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const rows = hasLive
    ? feed.quotes.map((q) => ({
        key: q._id,
        market: q.market,
        district: q.district,
        modal: q.modalPrice,
        min: q.minPrice,
        max: q.maxPrice,
        date: q.arrivalDate,
      }))
    : (DEMO_QUOTES[crop.id] ?? DEMO_QUOTES.onion).map((d, i) => ({
        key: `demo-${i}`,
        market: d.market,
        district: districtName(d.district, lang),
        modal: d.modal,
        min: Math.round(d.modal * 0.92),
        max: Math.round(d.modal * 1.08),
        date: "—",
      }));

  return (
    <Panel
      title={t("mandi.title")}
      meta={t("mandi.meta")}
      right={
        <span
          className={cn(
            "flex items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
            state === "live"
              ? "border-risk-low/40 bg-risk-low/10 text-risk-low"
              : state === "stale"
                ? "border-risk-medium/40 bg-risk-medium/10 text-risk-medium"
                : "border-border bg-secondary text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "inline-block size-1.5",
              state === "live" ? "bg-fresh" : state === "stale" ? "bg-risk-medium" : "bg-border",
            )}
            aria-hidden
          />
          {state === "live" ? t("mandi.live") : state === "stale" ? t("mandi.stale") : t("mandi.demo")}
        </span>
      }
    >
      {!hasLive && (
        <p className="mb-2 border border-dashed border-border bg-secondary/40 px-2.5 py-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground">
          {t("mandi.missingKey")}
        </p>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="py-1.5 pr-2 font-medium">{t("mandi.colMarket")}</th>
            <th className="py-1.5 px-2 font-medium">{t("mandi.colDistrict")}</th>
            <th className="py-1.5 px-2 text-right font-medium">{t("mandi.colModal")}</th>
            <th className="py-1.5 px-2 text-right font-medium">{t("mandi.colMin")}</th>
            <th className="py-1.5 px-2 text-right font-medium">{t("mandi.colMax")}</th>
            <th className="py-1.5 pl-2 text-right font-medium">{t("mandi.colDate")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-border/60 last:border-b-0">
              <td className="py-1.5 pr-2 text-[12.5px] font-medium text-foreground">{r.market}</td>
              <td className="py-1.5 px-2 font-mono text-[11.5px] text-muted-foreground">
                {r.district}
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-[12px] font-semibold tabular-nums text-foreground">
                ₹{r.modal.toLocaleString("en-IN")}
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                {r.min.toLocaleString("en-IN")}
              </td>
              <td className="py-1.5 px-2 text-right font-mono text-[11.5px] tabular-nums text-muted-foreground">
                {r.max.toLocaleString("en-IN")}
              </td>
              <td className="py-1.5 pl-2 text-right font-mono text-[10.5px] tabular-nums text-muted-foreground">
                {r.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
        {hasLive
          ? `${t("mandi.updated", { when: updatedLabel })} · ${t("mandi.via")}`
          : t("mandi.demoNote")}
      </p>
    </Panel>
  );
}
