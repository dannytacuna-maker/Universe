import type { NavigationState } from "@/store/navigation-store";

import { universityCourseSystems } from "./galaxies/university/university-course-systems";
import { personalGrowthSystems } from "./galaxies/personal-growth/personal-growth-systems";
import { beerusPlanetDefinition } from "./galaxies/personal-growth/strength-physique/beerus-planet-definition";

export const universityGalaxyId = "university";
export const personalGrowthGalaxyId = "personal-growth";

export type UniverseGalaxyId =
  typeof personalGrowthGalaxyId | typeof universityGalaxyId;

export type UniverseSystemStatus = "explorable" | "future";

export type UniverseSystemDestination = Readonly<{
  id: string;
  name: string;
  status: UniverseSystemStatus;
}>;

export type UniverseGalaxyDestination = Readonly<{
  id: UniverseGalaxyId;
  name: string;
  systems: readonly UniverseSystemDestination[];
}>;

export const universeGalaxies = [
  {
    id: universityGalaxyId,
    name: "University",
    systems: universityCourseSystems,
  },
  {
    id: personalGrowthGalaxyId,
    name: "Personal Growth",
    systems: personalGrowthSystems,
  },
] as const satisfies readonly UniverseGalaxyDestination[];

export const universeOriginState: NavigationState = {
  level: "universe",
  selectedGalaxyId: null,
  selectedPlanetId: null,
  selectedSystemId: null,
};

export function findGalaxy(galaxyId: string | null) {
  return universeGalaxies.find((galaxy) => galaxy.id === galaxyId) ?? null;
}

export function findSystem(galaxyId: string | null, systemId: string | null) {
  return (
    findGalaxy(galaxyId)?.systems.find((system) => system.id === systemId) ??
    null
  );
}

export function findPlanet(
  galaxyId: string | null,
  systemId: string | null,
  planetId: string | null,
) {
  return galaxyId === beerusPlanetDefinition.galaxyId &&
    systemId === beerusPlanetDefinition.systemId &&
    planetId === beerusPlanetDefinition.id
    ? beerusPlanetDefinition
    : null;
}
