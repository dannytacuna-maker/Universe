"use client";

import { ForgeSystem } from "./forge-system";
import { forgeSystems } from "./forge-systems";

type ForgeSystemGroupProps = Readonly<{
  activeSystemId: string | null;
  emphasizedSystemId: string | null;
  hoveredSystemId: string | null;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: (systemId: string) => void;
  onHoverChange: (systemId: string | null) => void;
}>;

export function ForgeSystemGroup({
  activeSystemId,
  emphasizedSystemId,
  hoveredSystemId,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
}: ForgeSystemGroupProps) {
  return forgeSystems.map((definition) => (
    <ForgeSystem
      definition={definition}
      isActive={activeSystemId === definition.id}
      isEmphasized={emphasizedSystemId === definition.id}
      isHovered={hoveredSystemId === definition.id}
      isInteractive={isInteractive}
      isVisible={
        isVisible &&
        (activeSystemId === null || activeSystemId === definition.id)
      }
      key={definition.id}
      motionEnabled={motionEnabled}
      onActivate={onActivate}
      onHoverChange={onHoverChange}
    />
  ));
}
