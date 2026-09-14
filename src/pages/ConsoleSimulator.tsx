import { RiskHeader } from "@/components/cropx/RiskHeader";
import { ScenarioSimulator } from "@/components/cropx/ScenarioSimulator";
import { RiskDrivers } from "@/components/cropx/RiskDrivers";
import { RecommendationPanel } from "@/components/cropx/RecommendationPanel";
import { DecisionBrief } from "@/components/cropx/DecisionBrief";
import { DataCoverage } from "@/components/cropx/DataCoverage";
import { RegionSwitcher } from "@/components/cropx/RegionSwitcher";

/**
 * Main console screen — ONE decision flow, nothing else:
 *   current risk → why (drivers) → what to do (recommendation + brief),
 * with the scenario simulator as the interactive core. The thin coverage
 * strip stays — data honesty is part of the risk read.
 */
export default function ConsoleSimulator() {
  return (
    <div className="flex flex-col gap-4">
      <RegionSwitcher />

      <RiskHeader />

      <ScenarioSimulator />

      {/* WHY it is happening + WHAT to do about it */}
      <div className="grid gap-4 xl:grid-cols-2">
        <RiskDrivers />
        <RecommendationPanel />
      </div>

      <DecisionBrief />

      <DataCoverage />
    </div>
  );
}
