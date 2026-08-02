import type { NavigationLevel } from "@/store/navigation-store";

import { frenchStationDefinition } from "./galaxies/personal-growth/french/french-station-definition";
import { forgeSystems } from "./galaxies/forge/forge-systems";
import { forgePlanets } from "./galaxies/forge/firmus-planets";
import { personalGrowthPlanets } from "./galaxies/personal-growth/personal-growth-planets";
import { personalGrowthSystems } from "./galaxies/personal-growth/personal-growth-systems";
import { universityCourseSystems } from "./galaxies/university/university-course-systems";
import {
  forgeGalaxyId,
  personalGrowthGalaxyId,
  universityGalaxyId,
} from "./universe-destinations";
import { globalObservatoryDefinition } from "./observatory/observatory-definition";

export type CameraPose = Readonly<{
  ambientScale: number;
  fov: number;
  lookTarget: readonly [number, number, number];
  position: readonly [number, number, number];
}>;

const universePose: CameraPose = {
  ambientScale: 1,
  fov: 48,
  lookTarget: [0, 0, 0],
  position: [0, 0, 8],
};

const galaxyPoses: Readonly<Record<string, CameraPose>> = {
  [forgeGalaxyId]: {
    ambientScale: 0.34,
    fov: 46,
    lookTarget: [-9.3, -2.3, -14.35],
    position: [-9.3, -1.95, -9.55],
  },
  [personalGrowthGalaxyId]: {
    ambientScale: 0.34,
    fov: 46,
    lookTarget: [4.2, -1, -9.75],
    position: [4.2, -0.72, -4.9],
  },
  [universityGalaxyId]: {
    ambientScale: 0.36,
    fov: 46,
    lookTarget: [-1.45, 0, -8.9],
    position: [-1.45, 0.3, -4.4],
  },
};

export function getCameraPose(
  navigationLevel: NavigationLevel,
  selectedGalaxyId: string | null,
  selectedSystemId: string | null,
  selectedPlanetId: string | null,
): CameraPose {
  if (navigationLevel === "planet") {
    if (
      selectedGalaxyId === null &&
      selectedSystemId === null &&
      selectedPlanetId === globalObservatoryDefinition.id
    ) {
      return {
        ambientScale: 0.1,
        fov: 42,
        lookTarget: globalObservatoryDefinition.cameraLookTarget,
        position: globalObservatoryDefinition.cameraPosition,
      };
    }

    if (
      selectedGalaxyId === frenchStationDefinition.galaxyId &&
      selectedSystemId === null &&
      selectedPlanetId === frenchStationDefinition.id
    ) {
      return {
        ambientScale: 0.08,
        fov: 42,
        lookTarget: frenchStationDefinition.cameraLookTarget,
        position: frenchStationDefinition.cameraPosition,
      };
    }

    const planet =
      personalGrowthPlanets.find(
        (definition) =>
          definition.galaxyId === selectedGalaxyId &&
          definition.systemId === selectedSystemId &&
          definition.id === selectedPlanetId,
      ) ??
      forgePlanets.find(
        (definition) =>
          definition.galaxyId === selectedGalaxyId &&
          definition.systemId === selectedSystemId &&
          definition.id === selectedPlanetId,
      );

    if (planet !== undefined) {
      return {
        ambientScale: 0.08,
        fov: 42,
        lookTarget: planet.cameraLookTarget,
        position: planet.cameraPosition,
      };
    }
  }

  if (navigationLevel === "system" && selectedGalaxyId !== null) {
    const systems =
      selectedGalaxyId === personalGrowthGalaxyId
        ? personalGrowthSystems
        : selectedGalaxyId === universityGalaxyId
          ? universityCourseSystems
          : selectedGalaxyId === forgeGalaxyId
            ? forgeSystems
            : [];
    const system = systems.find(
      (definition) => definition.id === selectedSystemId,
    );

    if (system !== undefined) {
      return {
        ambientScale: 0.16,
        fov: 40,
        lookTarget: system.position,
        position: system.cameraPosition,
      };
    }
  }

  if (navigationLevel === "galaxy" && selectedGalaxyId !== null) {
    return galaxyPoses[selectedGalaxyId] ?? universePose;
  }

  return universePose;
}
