"use client";

import type { JiuJitsuProgress } from "./jiu-jitsu/jiu-jitsu-progress";
import { PersonalGrowthSystem } from "./personal-growth-system";
import { personalGrowthSystems } from "./personal-growth-systems";
import type { StrengthProgress } from "./strength-physique/strength-physique-progress";
import type { UniverseActivitySignals } from "../../universe-activity";

type PersonalGrowthSystemGroupProps = Readonly<{
  activeSystemId: string | null;
  emphasizedSystemId: string | null;
  hoveredSystemId: string | null;
  isInteractive: boolean;
  isVisible: boolean;
  jiuJitsuProgress: JiuJitsuProgress;
  motionEnabled: boolean;
  onActivate: (systemId: string) => void;
  onHoverChange: (systemId: string | null) => void;
  strengthProgress: StrengthProgress;
  signals: UniverseActivitySignals["personalGrowth"];
}>;

export function PersonalGrowthSystemGroup({
  activeSystemId,
  emphasizedSystemId,
  hoveredSystemId,
  isInteractive,
  isVisible,
  jiuJitsuProgress,
  motionEnabled,
  onActivate,
  onHoverChange,
  signals,
  strengthProgress,
}: PersonalGrowthSystemGroupProps) {
  return personalGrowthSystems.map((definition) => (
    <PersonalGrowthSystem
      definition={definition}
      isActive={activeSystemId === definition.id}
      isEmphasized={emphasizedSystemId === definition.id}
      isHovered={hoveredSystemId === definition.id}
      isInteractive={isInteractive}
      isVisible={
        isVisible &&
        (activeSystemId === null || activeSystemId === definition.id)
      }
      jiuJitsuProgress={jiuJitsuProgress}
      key={definition.id}
      motionEnabled={motionEnabled}
      onActivate={onActivate}
      onHoverChange={onHoverChange}
      signal={signals[definition.id]}
      strengthProgress={strengthProgress}
    />
  ));
}
