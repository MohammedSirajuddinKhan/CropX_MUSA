import { useEffect, useMemo, useRef, useState } from "react";
import { useConsole } from "./console-state";
import { cn } from "@/lib/utils";

/**
 * Compact district + crop switcher for the strip above panels: hero
 * districts as one-click chips (with baseline risk for the active crop),
 * everything else behind a searchable "all districts" combobox, and a crop
 * selector listing every monitored vegetable. Selection resets scenario
 * state (via console).
 */
export function RegionSwitcher() {
  const {
    regions,
    bundle,
    districtRows,
    setRegion,
    crops,
    crop,
    setCrop,
  } = useConsole();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close the picker on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const heroRows = useMemo(
    () => districtRows.filter((row) => HERO.includes(row.region.id)),
    [districtRows],
  );
  const restRows = useMemo(
    () => districtRows.filter((row) => !HERO.includes(row.region.id)),
    [districtRows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restRows;
    return restRows.filter((r) => r.region.name.toLowerCase().includes(q));
  }, [restRows, query]);

  return (
    <div className="flex flex-wrap items-center gap-1 border border-border bg-card p-1">
      <span className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        crop
      </span>
      {crops.map((c) => {
        const active = c.id === crop.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setCrop(c.id)}
            className={cn(
              "px-2.5 py-1 font-mono text-[11.5px] transition-colors",
              active
                ? "bg-foreground font-medium text-background"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {c.name}
          </button>
        );
      })}

      <span className="mx-1 h-4 w-px bg-border" aria-hidden />

      <span className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        districts
      </span>
      {heroRows.map(({ region: r, risk }) => {
        const active = r.id === bundle.region.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => setRegion(r.id)}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1 font-mono text-[11.5px] transition-colors",
              active
                ? "bg-secondary font-medium text-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            {r.name}
            <span
              className={cn(
                "tabular-nums",
                risk.glutRisk >= 65
                  ? "text-risk-high"
                  : risk.glutRisk >= 40
                    ? "text-risk-medium"
                    : "text-risk-low",
              )}
            >
              {risk.glutRisk}%
            </span>
          </button>
        );
      })}

      {/* All remaining districts behind a searchable picker */}
      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 font-mono text-[11.5px] transition-colors",
            open
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
          )}
        >
          all {regions.length} districts
          <span aria-hidden className="text-[9px]">{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="absolute left-0 top-full z-30 mt-1 w-64 border border-border bg-card shadow-lg">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search districts…"
              aria-label="Search districts"
              className="w-full border-b border-border bg-transparent px-3 py-2 font-mono text-[11.5px] outline-none placeholder:text-muted-foreground/70 focus-visible:outline-none"
            />
            <ul className="max-h-72 overflow-y-auto">
              {filtered.map(({ region: r, risk }) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRegion(r.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left font-mono text-[11.5px] hover:bg-secondary/70",
                      r.id === bundle.region.id && "bg-secondary text-foreground",
                    )}
                  >
                    <span className="truncate">{r.name}</span>
                    <span
                      className={cn(
                        "tabular-nums",
                        risk.glutRisk >= 65
                          ? "text-risk-high"
                          : risk.glutRisk >= 40
                            ? "text-risk-medium"
                            : "text-risk-low",
                      )}
                    >
                      {risk.glutRisk}%
                    </span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  no district matches “{query}”
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const HERO = ["nashik", "ahmednagar", "pune", "solapur", "satara"];
