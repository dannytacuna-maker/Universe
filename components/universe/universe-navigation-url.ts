import type { NavigationState } from "@/store/navigation-store";

import {
  findGalaxy,
  findGalaxyStation,
  findPlanet,
  findSystem,
  universeOriginState,
} from "./universe-destinations";

const destinationParameter = "destination";

export function readUniverseNavigation(search: string): NavigationState {
  const parameters = new URLSearchParams(search);
  const destination = parameters.get(destinationParameter);

  if (destination === "observatory") {
    return {
      level: "planet",
      selectedGalaxyId: null,
      selectedPlanetId: "global-observatory",
      selectedSystemId: null,
    };
  }

  if (destination !== null) {
    const [galaxyId, systemId, planetId, ...remainingSegments] =
      destination.split("/");
    const galaxy = findGalaxy(galaxyId ?? null);

    if (galaxy !== null && remainingSegments.length === 0) {
      if (systemId === undefined) {
        return {
          level: "galaxy",
          selectedGalaxyId: galaxy.id,
          selectedPlanetId: null,
          selectedSystemId: null,
        };
      }

      const system = findSystem(galaxy.id, systemId);

      if (
        galaxy.id === "personal-growth" &&
        ((systemId === "french" && planetId === "french-station") ||
          systemId === "french-station")
      ) {
        return {
          level: "galaxy",
          selectedGalaxyId: galaxy.id,
          selectedPlanetId: null,
          selectedSystemId: null,
        };
      }

      if (
        planetId === undefined &&
        findGalaxyStation(galaxy.id, systemId) !== null
      ) {
        return {
          level: "planet",
          selectedGalaxyId: galaxy.id,
          selectedPlanetId: systemId,
          selectedSystemId: null,
        };
      }

      if (system?.status === "explorable" && planetId === undefined) {
        return {
          level: "system",
          selectedGalaxyId: galaxy.id,
          selectedPlanetId: null,
          selectedSystemId: system.id,
        };
      }

      const planet = findPlanet(
        galaxy.id,
        system?.id ?? null,
        planetId ?? null,
      );

      // External launch planets stay at system level; the live site opens on click.
      if (
        system?.status === "explorable" &&
        planet !== null &&
        "externalUrl" in planet &&
        typeof planet.externalUrl === "string"
      ) {
        return {
          level: "system",
          selectedGalaxyId: galaxy.id,
          selectedPlanetId: null,
          selectedSystemId: system.id,
        };
      }

      if (system?.status === "explorable" && planet !== null) {
        return {
          level: "planet",
          selectedGalaxyId: galaxy.id,
          selectedPlanetId: planet.id,
          selectedSystemId: system.id,
        };
      }
    }
  }

  return universeOriginState;
}

export function createUniverseNavigationUrl(
  currentHref: string,
  state: NavigationState,
) {
  const url = new URL(currentHref);

  if (state.level === "galaxy") {
    if (state.selectedGalaxyId !== null) {
      url.searchParams.set(destinationParameter, state.selectedGalaxyId);
    }
  } else if (
    state.level === "planet" &&
    state.selectedGalaxyId === null &&
    state.selectedSystemId === null &&
    state.selectedPlanetId === "global-observatory"
  ) {
    url.searchParams.set(destinationParameter, "observatory");
  } else if (
    state.level === "planet" &&
    state.selectedGalaxyId !== null &&
    state.selectedSystemId === null &&
    state.selectedPlanetId !== null
  ) {
    url.searchParams.set(
      destinationParameter,
      `${state.selectedGalaxyId}/${state.selectedPlanetId}`,
    );
  } else if (
    (state.level === "system" || state.level === "planet") &&
    state.selectedGalaxyId !== null &&
    state.selectedSystemId !== null
  ) {
    url.searchParams.set(
      destinationParameter,
      state.level === "planet" && state.selectedPlanetId !== null
        ? `${state.selectedGalaxyId}/${state.selectedSystemId}/${state.selectedPlanetId}`
        : `${state.selectedGalaxyId}/${state.selectedSystemId}`,
    );
  } else {
    url.searchParams.delete(destinationParameter);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
