"use client";

import type { NavigationLevel } from "@/store/navigation-store";
import type { JiuJitsuProgress } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-progress";
import type { StrengthProgress } from "./galaxies/personal-growth/strength-physique/strength-physique-progress";

import { UniverseCanvas } from "./universe-canvas";
import { UniverseScene } from "./universe-scene";

const camera = {
  far: 220,
  fov: 48,
  near: 0.1,
  position: [0, 0, 8] as const,
};

export type UniverseSceneCanvasProps = Readonly<{
  activeSystemId: string | null;
  cameraResetToken: number;
  emphasizedGalaxyId: string | null;
  emphasizedPlanetId: string | null;
  emphasizedSystemId: string | null;
  hoveredGalaxyId: string | null;
  hoveredPlanetId: string | null;
  hoveredSystemId: string | null;
  jiuJitsuProgress: JiuJitsuProgress;
  navigationLevel: NavigationLevel;
  onCameraArrive: () => void;
  onGalaxyActivate: (galaxyId: string) => void;
  onGalaxyHoverChange: (galaxyId: string | null) => void;
  onPlanetActivate: (planetId: string) => void;
  onPlanetHoverChange: (planetId: string | null) => void;
  onSystemActivate: (systemId: string) => void;
  onSystemHoverChange: (systemId: string | null) => void;
  selectedGalaxyId: string | null;
  selectedPlanetId: string | null;
  strengthProgress: StrengthProgress;
}>;

export function UniverseSceneCanvas({
  activeSystemId,
  cameraResetToken,
  emphasizedGalaxyId,
  emphasizedPlanetId,
  emphasizedSystemId,
  hoveredGalaxyId,
  hoveredPlanetId,
  hoveredSystemId,
  jiuJitsuProgress,
  navigationLevel,
  onCameraArrive,
  onGalaxyActivate,
  onGalaxyHoverChange,
  onPlanetActivate,
  onPlanetHoverChange,
  onSystemActivate,
  onSystemHoverChange,
  selectedGalaxyId,
  selectedPlanetId,
  strengthProgress,
}: UniverseSceneCanvasProps) {
  return (
    <div aria-hidden="true" style={{ inset: 0, position: "absolute" }}>
      <UniverseCanvas
        camera={camera}
        className="h-full w-full touch-none select-none"
      >
        <UniverseScene
          activeSystemId={activeSystemId}
          cameraResetToken={cameraResetToken}
          emphasizedGalaxyId={emphasizedGalaxyId}
          emphasizedPlanetId={emphasizedPlanetId}
          emphasizedSystemId={emphasizedSystemId}
          hoveredGalaxyId={hoveredGalaxyId}
          hoveredPlanetId={hoveredPlanetId}
          hoveredSystemId={hoveredSystemId}
          jiuJitsuProgress={jiuJitsuProgress}
          navigationLevel={navigationLevel}
          onCameraArrive={onCameraArrive}
          onGalaxyActivate={onGalaxyActivate}
          onGalaxyHoverChange={onGalaxyHoverChange}
          onPlanetActivate={onPlanetActivate}
          onPlanetHoverChange={onPlanetHoverChange}
          onSystemActivate={onSystemActivate}
          onSystemHoverChange={onSystemHoverChange}
          selectedGalaxyId={selectedGalaxyId}
          selectedPlanetId={selectedPlanetId}
          strengthProgress={strengthProgress}
        />
      </UniverseCanvas>
    </div>
  );
}
