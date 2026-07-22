"use client";

import type { JiuJitsuProgress } from "./jiu-jitsu/jiu-jitsu-progress";
import { PersonalGrowthSystem } from "./personal-growth-system";
import { personalGrowthSystems } from "./personal-growth-systems";

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
    />
  ));
}
