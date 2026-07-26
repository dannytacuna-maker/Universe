import type { NavigationLevel } from "@/store/navigation-store";

import { frenchStationDefinition } from "./galaxies/personal-growth/french/french-station-definition";
import { personalGrowthPlanets } from "./galaxies/personal-growth/personal-growth-planets";
import { personalGrowthSystems } from "./galaxies/personal-growth/personal-growth-systems";
import { universityCourseSystems } from "./galaxies/university/university-course-systems";
import {
  personalGrowthGalaxyId,
  universityGalaxyId,
} from "./universe-destinations";

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

    const planet = personalGrowthPlanets.find(
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
