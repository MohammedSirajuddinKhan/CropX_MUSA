import { useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Refresh-on-open — fires BOTH live ingests (AGMARKNET mandi prices +
 * Open-Meteo district weather) the moment the site loads, so every page
 * shows the freshest official data without waiting for the 6-hour cron.
 *
 * Politeness & cost control:
 *  - Both server actions carry a 10-minute success cooldown; a stale cache
 *    is what actually decides whether a refresh runs (see freshness check).
 *  - This component also self-throttles in sessionStorage so re-renders,
 *    remounts and route changes never re-fire within the window.
 *  - Both calls run in parallel and NEVER block rendering; failures are
 *    silent (panels keep their LIVE/STALE/DEMO honesty badges).
 */

const THROTTLE_KEY = "cropx.refresh.v1";
const THROTTLE_MS = 10 * 60_000;

/** Dispatched after the refresh pass completes so watchers can refetch. */
export const DATA_REFRESHED_EVENT = "cropx:data-refreshed";

export function LiveRefresh() {
  const syncMandi = useAction(api.agmarknet.ingest);
  const syncWeather = useAction(api.openmeteo.ingest);

  useEffect(() => {
    let cancelled = false;

    // Skip entirely when another mount already refreshed within the window.
    try {
      const last = Number(sessionStorage.getItem(THROTTLE_KEY) ?? 0);
      if (Date.now() - last < THROTTLE_MS) return;
      sessionStorage.setItem(THROTTLE_KEY, String(Date.now()));
    } catch {
      /* storage unavailable — proceed; server cooldown still guards */
    }

    const run = async () => {
      const results = await Promise.allSettled([
        syncWeather({}), // no key needed; feeds the engine's weather driver
        syncMandi({}), // server cooldown handles politeness; force: false
      ]);
      if (cancelled) return;
      const touched = results.some(
        (r) => r.status === "fulfilled" && r.value.recordCount > 0,
      );
      if (touched) {
        window.dispatchEvent(new CustomEvent(DATA_REFRESHED_EVENT));
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [syncMandi, syncWeather]);

  return null;
}
