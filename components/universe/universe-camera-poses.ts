import type { NavigationLevel } from "@/store/navigation-store";

import { personalGrowthGalaxyDefinition } from "./galaxies/personal-growth/personal-growth-galaxy-definition";
import { personalGrowthSystems } from "./galaxies/personal-growth/personal-growth-systems";
import { strengthPlanets } from "./galaxies/personal-growth/strength-physique/strength-planets";
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
    ambientScale: 0.45,
    fov: 47,
    lookTarget: personalGrowthGalaxyDefinition.position,
    position: [4.25, -1.02, -6.15],
  },
  [universityGalaxyId]: {
    ambientScale: 0.5,
    fov: 47,
    lookTarget: [-1.45, 0.9, -8.5],
    position: [-1.45, 1.02, -5],
  },
};

export function getCameraPose(
  navigationLevel: NavigationLevel,
  selectedGalaxyId: string | null,
  selectedSystemId: string | null,
  selectedPlanetId: string | null,
): CameraPose {
  if (navigationLevel === "planet") {
    const planet = strengthPlanets.find(
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
        ambientScale: 0.2,
        fov: 38,
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
