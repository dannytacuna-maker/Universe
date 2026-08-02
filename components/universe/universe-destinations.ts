import type { NavigationState } from "@/store/navigation-store";

import { frenchStationDefinition } from "./galaxies/personal-growth/french/french-station-definition";
import { universityCourseSystems } from "./galaxies/university/university-course-systems";
import { forgeSystems } from "./galaxies/forge/forge-systems";
import { forgePlanets } from "./galaxies/forge/firmus-planets";
import { personalGrowthPlanets } from "./galaxies/personal-growth/personal-growth-planets";
import { personalGrowthSystems } from "./galaxies/personal-growth/personal-growth-systems";
import { globalObservatoryDefinition } from "./observatory/observatory-definition";

export const universityGalaxyId = "university";
export const personalGrowthGalaxyId = "personal-growth";
export const forgeGalaxyId = "forge";

export type UniverseGalaxyId =
  | typeof forgeGalaxyId
  | typeof personalGrowthGalaxyId
  | typeof universityGalaxyId;

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
  {
    id: forgeGalaxyId,
    name: "The Forge",
    systems: forgeSystems,
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
  if (systemId === null || planetId === null) {
    return null;
  }

  if (galaxyId === personalGrowthGalaxyId) {
    return (
      personalGrowthPlanets.find(
        (planet) => planet.systemId === systemId && planet.id === planetId,
      ) ?? null
    );
  }

  if (galaxyId === forgeGalaxyId) {
    return (
      forgePlanets.find(
        (planet) => planet.systemId === systemId && planet.id === planetId,
      ) ?? null
    );
  }

  return null;
}

export function findGalaxyStation(
  galaxyId: string | null,
  stationId: string | null,
) {
  if (
    galaxyId === frenchStationDefinition.galaxyId &&
    stationId === frenchStationDefinition.id
  ) {
    return frenchStationDefinition;
  }

  return stationId === globalObservatoryDefinition.id && galaxyId === null
    ? globalObservatoryDefinition
    : null;
}
