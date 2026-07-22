"use client";

import { GokuPresence } from "./goku-presence";
import { hyperbolicTimeChamberDefinition } from "./jiu-jitsu-planets";
import { TimeChamberEnvironment } from "./time-chamber-environment";

type TimeChamberSurfaceProps = Readonly<{
  isVisible: boolean;
  motionEnabled: boolean;
}>;

export function TimeChamberSurface({
  isVisible,
  motionEnabled,
}: TimeChamberSurfaceProps) {
  return (
    <group
      position={hyperbolicTimeChamberDefinition.landingOrigin}
      visible={isVisible}
    >
      <TimeChamberEnvironment motionEnabled={motionEnabled && isVisible} />
      <GokuPresence />
    </group>
  );
}
