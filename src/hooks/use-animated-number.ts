import { useEffect, useRef, useState } from "react";

/**
 * Smoothly interpolates toward the target value (requestAnimationFrame).
 * Used for simulator readouts so number changes read as continuous
 * recalculation rather than a jarring swap.
 */
export function useAnimatedNumber(target: number, durationMs = 380): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const valueRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = valueRef.current;
    if (fromRef.current === target) return;
    const start = performance.now();
    const from = fromRef.current;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = from + (target - from) * eased;
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
  }, [target, durationMs]);

  return value;
}
