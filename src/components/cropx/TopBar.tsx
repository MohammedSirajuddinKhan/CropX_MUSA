import type { Crop, Region } from "@/lib/cropx/types";
import { useLang } from "@/i18n";
import { cropName, districtName } from "@/i18n/names";

interface TopBarProps {
  region: Region;
  crop: Crop;
  horizon: string;
  updated: string;
  coverage: number;
}

export function TopBar({ region, crop, horizon, updated, coverage }: TopBarProps) {
  const { t, lang } = useLang();
  return (
    <header className="flex h-12 shrink-0 items-center gap-6 border-b border-border bg-card px-5">
      <div className="flex items-center gap-2">
        <span className="font-mono-t">{t("top.region")}</span>
        <span className="font-mono text-[12px] font-medium text-foreground">
          {districtName(region.id, lang)}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          · {region.state}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono-t">{t("top.crop")}</span>
        <span className="font-mono text-[12px] font-medium text-foreground">
          {cropName(crop.id, lang)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono-t">{t("top.horizon")}</span>
        <span className="font-mono text-[12px] text-foreground">{horizon}</span>
      </div>
      <div className="ml-auto flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-mono-t">{t("top.updated")}</span>
          <span className="font-mono text-[12px] text-foreground">{updated}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-t">{t("top.coverage")}</span>
          <span className="font-mono text-[12px] font-medium text-foreground">
            {coverage}%
          </span>
        </div>
      </div>
    </header>
  );
}
