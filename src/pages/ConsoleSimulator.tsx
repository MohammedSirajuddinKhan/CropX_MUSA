import { RiskHeader } from "@/components/cropx/RiskHeader";
import { ScenarioSimulator } from "@/components/cropx/ScenarioSimulator";
import { CompareTable } from "@/components/cropx/CompareTable";
import { RiskDrivers } from "@/components/cropx/RiskDrivers";
import { PlantingSignals } from "@/components/cropx/PlantingSignals";
import { RecommendationPanel } from "@/components/cropx/RecommendationPanel";
import { DataCoverage } from "@/components/cropx/DataCoverage";
import { RegionSwitcher } from "@/components/cropx/RegionSwitcher";
import { VillageTable } from "@/components/cropx/VillageTable";
import { DistrictRiskGrid } from "@/components/cropx/DistrictRiskGrid";
import { CropProvenance } from "@/components/cropx/CropProvenance";
import { MandiPrices } from "@/components/cropx/MandiPrices";

/**
 * Main console screen — the Scenario Simulator is the product.
 * Layout: risk header → simulator (hero) → comparison & drivers →
 * signals → recommendation. Every panel below the simulator reacts to it.
 */
export default function ConsoleSimulator() {
  return (
    <div className="flex flex-col gap-3">
      {/* Region strip + horizon note */}
      <RegionSwitcher />

      <RiskHeader />

      <ScenarioSimulator />

      <div className="grid gap-3 xl:grid-cols-2">
        <CompareTable />
        <RiskDrivers />
      </div>

      {/* Village/taluka layer + state-wide context for the active district */}
      <div className="grid gap-3 xl:grid-cols-2">
        <VillageTable />
        <DistrictRiskGrid compact />
      </div>

      {/* LIVE government mandi prices (AGMARKNET via data.gov.in) */}
      <MandiPrices />

      <CropProvenance />

      <div className="grid gap-3 xl:grid-cols-2">
        <PlantingSignals />
        <RecommendationPanel />
      </div>

      <DataCoverage />
    </div>
  );
}
