import { useEffect, useRef, useState } from "react";

/**
 * Smoothly interpolates toward the target value (requestAnimationFrame).
 * Used for simulator readouts so number changes read as continuous
 * recalculation rather than a jarring swap.
 */
export function useAnimatedNumber(target: number, durationMs = 380): number {
  // NaN guard: an upstream bad value renders as "NaN" through toFixed —
  // degrade to 0 instead so readouts stay sane.
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(safeTarget);
  const fromRef = useRef(safeTarget);
  const valueRef = useRef(safeTarget);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = valueRef.current;
    if (fromRef.current === safeTarget) return;
    const start = performance.now();
    const from = fromRef.current;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from + (safeTarget - from) * eased;
      valueRef.current = next;
      setValue(next);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [safeTarget, durationMs]);

  return value;
}
