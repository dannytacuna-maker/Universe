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
import { EvidenceComet } from "./evidence-comet";
import { UniversityGalaxy } from "./galaxies/university-galaxy";
import { UniversityCourseSystemGroup } from "./galaxies/university/university-course-system-group";
import { UniversityInteriorField } from "./galaxies/university/university-interior-field";
import { FrenchLearningStation } from "./galaxies/personal-growth/french/french-learning-station";
import { frenchStationDefinition } from "./galaxies/personal-growth/french/french-station-definition";
import { FrenchStationSurface } from "./galaxies/personal-growth/french/french-station-surface";
import type { JiuJitsuProgress } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-progress";
import { hyperbolicTimeChamberDefinition } from "./galaxies/personal-growth/jiu-jitsu/jiu-jitsu-planets";
import { TimeChamberSurface } from "./galaxies/personal-growth/jiu-jitsu/time-chamber-surface";
import { PersonalGrowthDestinationPlanet } from "./galaxies/personal-growth/personal-growth-destination-planet";
import { PersonalGrowthDestinationSurface } from "./galaxies/personal-growth/personal-growth-destination-surface";
import { standardPersonalGrowthPlanets } from "./galaxies/personal-growth/personal-growth-planets";
import type { StrengthProgress } from "./galaxies/personal-growth/strength-physique/strength-physique-progress";
import { BeerusPlanet } from "./galaxies/personal-growth/strength-physique/beerus-planet";
import { beerusPlanetDefinition } from "./galaxies/personal-growth/strength-physique/beerus-planet-definition";
import { BeerusPlanetSurface } from "./galaxies/personal-growth/strength-physique/beerus-planet-surface";
import { PersonalGrowthGalaxy } from "./galaxies/personal-growth/personal-growth-galaxy";
import { PersonalGrowthInteriorField } from "./galaxies/personal-growth/personal-growth-interior-field";
import { PersonalGrowthSystemGroup } from "./galaxies/personal-growth/personal-growth-system-group";
import { ProceduralStarfield } from "./procedural-starfield";
import { GlobalObservatory } from "./observatory/global-observatory";
import { globalObservatoryDefinition } from "./observatory/observatory-definition";
import {
  personalGrowthGalaxyId,
  universityGalaxyId,
} from "./universe-destinations";
import type { UniverseActivitySignals } from "./universe-activity";

type UniverseSceneProps = Readonly<{
  activeSystemId: string | null;
  activitySignals: UniverseActivitySignals;
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

const genericPersonalGrowthSurfaces = standardPersonalGrowthPlanets.filter(
  (planet) => planet.kind !== "time-chamber",
);

export function UniverseScene({
  activeSystemId,
  activitySignals,
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
          ? 0.26
          : 0.38
        : navigationLevel === "planet"
          ? isPortrait
            ? 0.035
            : 0.05
          : isPortrait
            ? 0.17
            : 0.24;
  const universitySelected = selectedGalaxyId === universityGalaxyId;
  const personalGrowthSelected = selectedGalaxyId === personalGrowthGalaxyId;
  const universityNavigationLevel = universitySelected
    ? navigationLevel
    : "universe";
  const isBeerusSurfaceSelected =
    navigationLevel === "planet" &&
    selectedPlanetId === beerusPlanetDefinition.id;
  const isTimeChamberSurfaceSelected =
    navigationLevel === "planet" &&
    selectedPlanetId === hyperbolicTimeChamberDefinition.id;
  const isFrenchStationSurfaceSelected =
    navigationLevel === "planet" &&
    selectedPlanetId === frenchStationDefinition.id;
  const isObservatorySelected =
    navigationLevel === "planet" &&
    selectedPlanetId === globalObservatoryDefinition.id;
  const selectedGenericPersonalGrowthSurface =
    navigationLevel === "planet"
      ? (genericPersonalGrowthSurfaces.find(
          (planet) => planet.id === selectedPlanetId,
        ) ?? null)
      : null;

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
        attention={activitySignals.galaxy.university.attention}
        isEmphasized={emphasizedGalaxyId === universityGalaxyId}
        isHovered={hoveredGalaxyId === universityGalaxyId}
        isInteractive={navigationLevel === "universe"}
        motionEnabled={motionEnabled}
        onActivate={() => onGalaxyActivate(universityGalaxyId)}
        onHoverChange={(isHovered) =>
          onGalaxyHoverChange(isHovered ? universityGalaxyId : null)
        }
        presence={
          (navigationLevel === "universe"
            ? 1
            : universitySelected && navigationLevel === "galaxy"
              ? 0.24
              : universitySelected
                ? 0.01
                : 0.025) *
          (0.92 + activitySignals.galaxy.university.activity * 0.08)
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
        isVisible={
          universitySelected &&
          navigationLevel !== "universe" &&
          navigationLevel !== "planet"
        }
        motionEnabled={motionEnabled}
        onActivate={onSystemActivate}
        onHoverChange={onSystemHoverChange}
        signals={activitySignals.university}
      />
      <PersonalGrowthGalaxy
        attention={activitySignals.galaxy.personalGrowth.attention}
        isEmphasized={emphasizedGalaxyId === personalGrowthGalaxyId}
        isHovered={hoveredGalaxyId === personalGrowthGalaxyId}
        isInteractive={navigationLevel === "universe"}
        motionEnabled={motionEnabled}
        onActivate={() => onGalaxyActivate(personalGrowthGalaxyId)}
        onHoverChange={(isHovered) =>
          onGalaxyHoverChange(isHovered ? personalGrowthGalaxyId : null)
        }
        presence={
          (navigationLevel === "universe"
            ? 0.92
            : personalGrowthSelected && navigationLevel === "galaxy"
              ? 0.24
              : personalGrowthSelected
                ? 0.01
                : 0.022) *
          (0.92 + activitySignals.galaxy.personalGrowth.activity * 0.08)
        }
      />
      <PersonalGrowthInteriorField
        isVisible={
          personalGrowthSelected &&
          navigationLevel !== "universe" &&
          navigationLevel !== "planet"
        }
        motionEnabled={motionEnabled}
        presence={navigationLevel === "galaxy" ? 1 : 0.16}
      />
      <PersonalGrowthSystemGroup
        activeSystemId={personalGrowthSelected ? activeSystemId : null}
        emphasizedSystemId={personalGrowthSelected ? emphasizedSystemId : null}
        hoveredSystemId={personalGrowthSelected ? hoveredSystemId : null}
        isInteractive={personalGrowthSelected && navigationLevel === "galaxy"}
        isVisible={
          personalGrowthSelected &&
          navigationLevel !== "universe" &&
          navigationLevel !== "planet"
        }
        jiuJitsuProgress={jiuJitsuProgress}
        motionEnabled={motionEnabled}
        onActivate={onSystemActivate}
        onHoverChange={onSystemHoverChange}
        signals={activitySignals.personalGrowth}
        strengthProgress={strengthProgress}
      />
      <BeerusPlanet
        isEmphasized={emphasizedPlanetId === beerusPlanetDefinition.id}
        isHovered={hoveredPlanetId === beerusPlanetDefinition.id}
        isInteractive={
          personalGrowthSelected &&
          navigationLevel === "system" &&
          activeSystemId === beerusPlanetDefinition.systemId
        }
        isVisible={
          personalGrowthSelected &&
          navigationLevel === "system" &&
          activeSystemId === beerusPlanetDefinition.systemId
        }
        motionEnabled={motionEnabled}
        onActivate={() => onPlanetActivate(beerusPlanetDefinition.id)}
        onHoverChange={(isHovered) =>
          onPlanetHoverChange(isHovered ? beerusPlanetDefinition.id : null)
        }
      />
      <FrenchLearningStation
        isEmphasized={emphasizedPlanetId === frenchStationDefinition.id}
        isHovered={hoveredPlanetId === frenchStationDefinition.id}
        isInteractive={personalGrowthSelected && navigationLevel === "galaxy"}
        isVisible={personalGrowthSelected && navigationLevel === "galaxy"}
        motionEnabled={motionEnabled}
        onActivate={() => onPlanetActivate(frenchStationDefinition.id)}
        onHoverChange={(isHovered) =>
          onPlanetHoverChange(isHovered ? frenchStationDefinition.id : null)
        }
      />
      <GlobalObservatory
        briefingPulse={activitySignals.observatoryAttention}
        isEmphasized={emphasizedPlanetId === globalObservatoryDefinition.id}
        isHovered={hoveredPlanetId === globalObservatoryDefinition.id}
        isInteractive={navigationLevel === "universe"}
        isVisible={navigationLevel === "universe" || isObservatorySelected}
        motionEnabled={motionEnabled}
        onActivate={() => onPlanetActivate(globalObservatoryDefinition.id)}
        onHoverChange={(isHovered) =>
          onPlanetHoverChange(isHovered ? globalObservatoryDefinition.id : null)
        }
      />
      <EvidenceComet
        isVisible={navigationLevel === "universe"}
        motionEnabled={motionEnabled}
      />
      {standardPersonalGrowthPlanets.map((planet) => (
        <PersonalGrowthDestinationPlanet
          definition={planet}
          isEmphasized={emphasizedPlanetId === planet.id}
          isHovered={hoveredPlanetId === planet.id}
          isInteractive={
            personalGrowthSelected &&
            navigationLevel === "system" &&
            activeSystemId === planet.systemId
          }
          isVisible={
            personalGrowthSelected &&
            navigationLevel === "system" &&
            activeSystemId === planet.systemId
          }
          key={planet.id}
          motionEnabled={motionEnabled}
          onActivate={() => onPlanetActivate(planet.id)}
          onHoverChange={(isHovered) =>
            onPlanetHoverChange(isHovered ? planet.id : null)
          }
        />
      ))}
      <Suspense fallback={null}>
        {isBeerusSurfaceSelected ? (
          <BeerusPlanetSurface isVisible motionEnabled={motionEnabled} />
        ) : null}
        {isTimeChamberSurfaceSelected ? (
          <TimeChamberSurface isVisible motionEnabled={motionEnabled} />
        ) : null}
        {isFrenchStationSurfaceSelected ? (
          <FrenchStationSurface isVisible motionEnabled={motionEnabled} />
        ) : null}
        {selectedGenericPersonalGrowthSurface ? (
          <PersonalGrowthDestinationSurface
            definition={selectedGenericPersonalGrowthSurface}
            isVisible
            motionEnabled={motionEnabled}
          />
        ) : null}
      </Suspense>
      <CameraRig
        motionEnabled={motionEnabled}
        navigationLevel={navigationLevel}
        onArrive={onCameraArrive}
        resetToken={cameraResetToken}
        selectedGalaxyId={selectedGalaxyId}
        selectedPlanetId={selectedPlanetId}
        selectedSystemId={activeSystemId}
      />
      <AmbientFrameScheduler active={motionEnabled} />
    </>
  );
}
