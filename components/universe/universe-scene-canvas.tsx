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
  emphasizedSystemId: string | null;
  hoveredGalaxyId: string | null;
  hoveredSystemId: string | null;
  jiuJitsuProgress: JiuJitsuProgress;
  navigationLevel: NavigationLevel;
  onCameraArrive: () => void;
  onGalaxyActivate: (galaxyId: string) => void;
  onGalaxyHoverChange: (galaxyId: string | null) => void;
  onSystemActivate: (systemId: string) => void;
  onSystemHoverChange: (systemId: string | null) => void;
  selectedGalaxyId: string | null;
  strengthProgress: StrengthProgress;
}>;

export function UniverseSceneCanvas({
  activeSystemId,
  cameraResetToken,
  emphasizedGalaxyId,
  emphasizedSystemId,
  hoveredGalaxyId,
  hoveredSystemId,
  jiuJitsuProgress,
  navigationLevel,
  onCameraArrive,
  onGalaxyActivate,
  onGalaxyHoverChange,
  onSystemActivate,
  onSystemHoverChange,
  selectedGalaxyId,
  strengthProgress,
}: UniverseSceneCanvasProps) {
  return (
    <div aria-hidden="true" style={{ inset: 0, position: "absolute" }}>
      <UniverseCanvas camera={camera} className="h-full w-full">
        <UniverseScene
          activeSystemId={activeSystemId}
          cameraResetToken={cameraResetToken}
          emphasizedGalaxyId={emphasizedGalaxyId}
          emphasizedSystemId={emphasizedSystemId}
          hoveredGalaxyId={hoveredGalaxyId}
          hoveredSystemId={hoveredSystemId}
          jiuJitsuProgress={jiuJitsuProgress}
          navigationLevel={navigationLevel}
          onCameraArrive={onCameraArrive}
          onGalaxyActivate={onGalaxyActivate}
          onGalaxyHoverChange={onGalaxyHoverChange}
          onSystemActivate={onSystemActivate}
          onSystemHoverChange={onSystemHoverChange}
          selectedGalaxyId={selectedGalaxyId}
          strengthProgress={strengthProgress}
        />
      </UniverseCanvas>
    </div>
  );
}
