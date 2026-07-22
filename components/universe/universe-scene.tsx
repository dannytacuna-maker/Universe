"use client";

import { useReducedMotion } from "framer-motion";
import { useThree } from "@react-three/fiber";
import { Suspense } from "react";

import type { NavigationLevel } from "@/store/navigation-store";

import { AmbientFrameScheduler } from "./ambient-frame-scheduler";
import { CameraRig } from "./camera-rig";
import { CosmicFilamentField } from "./cosmic-filament-field";
import { CosmicGuardian } from "./cosmic-guardian";
import { DeepSpaceBackdrop } from "./deep-space-backdrop";
import { DistantCelestialStructures } from "./distant-celestial-structures";
import { UniversityGalaxy } from "./galaxies/university-galaxy";
import { UniversityCourseSystemGroup } from "./galaxies/university/university-course-system-group";
import { UniversityInteriorField } from "./galaxies/university/university-interior-field";
import type { JiuJitsuProgress } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-progress";
import { PersonalGrowthGalaxy } from "./galaxies/personal-growth/personal-growth-galaxy";
import { PersonalGrowthInteriorField } from "./galaxies/personal-growth/personal-growth-interior-field";
import { PersonalGrowthSystemGroup } from "./galaxies/personal-growth/personal-growth-system-group";
import { ProceduralStarfield } from "./procedural-starfield";
import {
  personalGrowthGalaxyId,
  universityGalaxyId,
} from "./universe-destinations";

type UniverseSceneProps = Readonly<{
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
}>;

export function UniverseScene({
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
}: UniverseSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const motionEnabled = shouldReduceMotion === false;
  const viewportSize = useThree((state) => state.size);
  const isPortrait = viewportSize.height > viewportSize.width;
  const starfieldPresence =
    navigationLevel === "universe"
      ? isPortrait
        ? 0.78
        : 1
      : navigationLevel === "galaxy"
        ? isPortrait
          ? 0.18
          : 0.26
        : isPortrait
          ? 0.1
          : 0.13;
  const universitySelected = selectedGalaxyId === universityGalaxyId;
  const personalGrowthSelected = selectedGalaxyId === personalGrowthGalaxyId;
  const universityNavigationLevel = universitySelected
    ? navigationLevel
    : "universe";

  return (
    <>
      <color attach="background" args={["#01030a"]} />
      <fog attach="fog" args={["#01030a", 72, 168]} />

      <DeepSpaceBackdrop />
      <CosmicFilamentField motionEnabled={motionEnabled} />
      <DistantCelestialStructures />
      <Suspense fallback={null}>
        <CosmicGuardian
          isPortrait={isPortrait}
          motionEnabled={motionEnabled}
          presence={
            navigationLevel === "universe"
              ? isPortrait
                ? 0.52
                : 1
              : navigationLevel === "galaxy"
                ? 0.05
                : 0.012
          }
        />
      </Suspense>
      <ProceduralStarfield
        motionEnabled={motionEnabled}
        presence={starfieldPresence}
      />
      <UniversityGalaxy
        isEmphasized={emphasizedGalaxyId === universityGalaxyId}
        isHovered={hoveredGalaxyId === universityGalaxyId}
        isInteractive={navigationLevel === "universe"}
        motionEnabled={motionEnabled}
        onActivate={() => onGalaxyActivate(universityGalaxyId)}
        onHoverChange={(isHovered) =>
          onGalaxyHoverChange(isHovered ? universityGalaxyId : null)
        }
        presence={
          navigationLevel === "universe"
            ? 1
            : universitySelected && navigationLevel === "galaxy"
              ? 0.24
              : universitySelected
                ? 0.01
                : 0.025
        }
      />
      <UniversityInteriorField
        motionEnabled={motionEnabled}
        navigationLevel={universityNavigationLevel}
      />
      <UniversityCourseSystemGroup
        activeCourseId={universitySelected ? activeSystemId : null}
        emphasizedCourseId={universitySelected ? emphasizedSystemId : null}
        hoveredCourseId={universitySelected ? hoveredSystemId : null}
        isInteractive={universitySelected && navigationLevel === "galaxy"}
        isVisible={universitySelected && navigationLevel !== "universe"}
        motionEnabled={motionEnabled}
        onActivate={onSystemActivate}
        onHoverChange={onSystemHoverChange}
      />
      <PersonalGrowthGalaxy
        isEmphasized={emphasizedGalaxyId === personalGrowthGalaxyId}
        isHovered={hoveredGalaxyId === personalGrowthGalaxyId}
        isInteractive={navigationLevel === "universe"}
        motionEnabled={motionEnabled}
        onActivate={() => onGalaxyActivate(personalGrowthGalaxyId)}
        onHoverChange={(isHovered) =>
          onGalaxyHoverChange(isHovered ? personalGrowthGalaxyId : null)
        }
        presence={
          navigationLevel === "universe"
            ? 0.92
            : personalGrowthSelected && navigationLevel === "galaxy"
              ? 0.24
              : personalGrowthSelected
                ? 0.01
                : 0.022
        }
      />
      <PersonalGrowthInteriorField
        isVisible={personalGrowthSelected && navigationLevel !== "universe"}
        motionEnabled={motionEnabled}
        presence={navigationLevel === "galaxy" ? 1 : 0.16}
      />
      <PersonalGrowthSystemGroup
        activeSystemId={personalGrowthSelected ? activeSystemId : null}
        emphasizedSystemId={personalGrowthSelected ? emphasizedSystemId : null}
        hoveredSystemId={personalGrowthSelected ? hoveredSystemId : null}
        isInteractive={personalGrowthSelected && navigationLevel === "galaxy"}
        isVisible={personalGrowthSelected && navigationLevel !== "universe"}
        jiuJitsuProgress={jiuJitsuProgress}
        motionEnabled={motionEnabled}
        onActivate={onSystemActivate}
        onHoverChange={onSystemHoverChange}
      />
      <CameraRig
        motionEnabled={motionEnabled}
        navigationLevel={navigationLevel}
        onArrive={onCameraArrive}
        resetToken={cameraResetToken}
        selectedGalaxyId={selectedGalaxyId}
        selectedSystemId={activeSystemId}
      />
      <AmbientFrameScheduler active={motionEnabled} />
    </>
  );
}
