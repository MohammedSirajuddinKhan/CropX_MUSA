import { cn } from "@/lib/utils";
import { BAND_COLORS } from "@/lib/cropx/format";

interface StatusTagProps {
  band: string;
  label: string;
  className?: string;
}

/**
 * Risk status communicated with text + color, never color alone.
 */
export function StatusTag({ band, label, className }: StatusTagProps) {
  const c = BAND_COLORS[band] ?? BAND_COLORS.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
        c.text,
        c.bg,
        c.border,
        className,
      )}
    >
      <span className="inline-block size-1.5 bg-current" aria-hidden />
      {label}
    </span>
  );
}
