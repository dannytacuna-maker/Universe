import type { NavigationState } from "@/store/navigation-store";

import {
  findGalaxy,
  findSystem,
  universeOriginState,
} from "./universe-destinations";

const destinationParameter = "destination";

export function readUniverseNavigation(search: string): NavigationState {
  const parameters = new URLSearchParams(search);
  const destination = parameters.get(destinationParameter);

  if (destination !== null) {
    const [galaxyId, systemId, ...remainingSegments] = destination.split("/");
    const galaxy = findGalaxy(galaxyId ?? null);

    if (galaxy !== null && remainingSegments.length === 0) {
      if (systemId === undefined) {
        return {
          level: "galaxy",
          selectedGalaxyId: galaxy.id,
          selectedSystemId: null,
        };
      }

      const system = findSystem(galaxy.id, systemId);

      if (system?.status === "explorable") {
        return {
          level: "system",
          selectedGalaxyId: galaxy.id,
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
    state.level === "system" &&
    state.selectedGalaxyId !== null &&
    state.selectedSystemId !== null
  ) {
    url.searchParams.set(
      destinationParameter,
      `${state.selectedGalaxyId}/${state.selectedSystemId}`,
    );
  } else {
    url.searchParams.delete(destinationParameter);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
