import type { Crop, Region } from "@/lib/cropx/types";

interface TopBarProps {
  region: Region;
  crop: Crop;
  horizon: string;
  updated: string;
  coverage: number;
}

export function TopBar({ region, crop, horizon, updated, coverage }: TopBarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-6 border-b border-border bg-card px-5">
      <div className="flex items-center gap-2">
        <span className="font-mono-t">region</span>
        <span className="font-mono text-[12px] font-medium text-foreground">
          {region.name}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          · {region.state}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono-t">crop</span>
        <span className="font-mono text-[12px] font-medium text-foreground">
          {crop.name}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono-t">horizon</span>
        <span className="font-mono text-[12px] text-foreground">{horizon}</span>
      </div>
      <div className="ml-auto flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-mono-t">updated</span>
          <span className="font-mono text-[12px] text-foreground">{updated}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-t">coverage</span>
          <span className="font-mono text-[12px] font-medium text-foreground">
            {coverage}%
          </span>
        </div>
      </div>
    </header>
  );
}
