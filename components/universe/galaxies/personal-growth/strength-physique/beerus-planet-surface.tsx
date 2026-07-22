"use client";

import { BeerusSanctuaryEnvironment } from "./beerus-sanctuary-environment";
import { beerusPlanetDefinition } from "./beerus-planet-definition";
import { WhisPresence } from "./whis-presence";

type BeerusPlanetSurfaceProps = Readonly<{
  isVisible: boolean;
  motionEnabled: boolean;
}>;

export function BeerusPlanetSurface({
  isVisible,
  motionEnabled,
}: BeerusPlanetSurfaceProps) {
  return (
    <group position={beerusPlanetDefinition.landingOrigin} visible={isVisible}>
      <BeerusSanctuaryEnvironment motionEnabled={motionEnabled && isVisible} />
      <WhisPresence />
    </group>
  );
}
