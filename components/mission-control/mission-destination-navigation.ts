import type { NavigationState } from "@/store/navigation-store";

import type { MissionDestinationId } from "./mission-operating-record";

export function createMissionDestinationState(
  destinationId: MissionDestinationId,
): NavigationState {
  switch (destinationId) {
    case "university":
      return {
        level: "galaxy",
        selectedGalaxyId: "university",
        selectedPlanetId: null,
        selectedSystemId: null,
      };
    case "logistics":
      return {
        level: "system",
        selectedGalaxyId: "university",
        selectedPlanetId: null,
        selectedSystemId: "logistics",
      };
    case "jiu-jitsu":
    case "reading":
    case "strength-physique":
      return {
        level: "system",
        selectedGalaxyId: "personal-growth",
        selectedPlanetId: null,
        selectedSystemId: destinationId,
      };
  }
}
