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
    case "french-station":
      return {
        level: "planet",
        selectedGalaxyId: "personal-growth",
        selectedPlanetId: "french-station",
        selectedSystemId: null,
      };
    case "hyperbolic-time-chamber":
      return {
        level: "planet",
        selectedGalaxyId: "personal-growth",
        selectedPlanetId: "hyperbolic-time-chamber",
        selectedSystemId: "jiu-jitsu",
      };
    case "beerus-planet":
      return {
        level: "planet",
        selectedGalaxyId: "personal-growth",
        selectedPlanetId: "beerus-planet",
        selectedSystemId: "strength-physique",
      };
    case "celestial-library":
      return {
        level: "planet",
        selectedGalaxyId: "personal-growth",
        selectedPlanetId: "celestial-library",
        selectedSystemId: "reading",
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
    case "forge":
      return {
        level: "galaxy",
        selectedGalaxyId: "forge",
        selectedPlanetId: null,
        selectedSystemId: null,
      };
    case "firmus":
      return {
        level: "system",
        selectedGalaxyId: "forge",
        selectedPlanetId: null,
        selectedSystemId: "firmus",
      };
    case "firmus-landing":
      return {
        level: "planet",
        selectedGalaxyId: "forge",
        selectedPlanetId: "firmus-landing",
        selectedSystemId: "firmus",
      };
    case "observatory":
      return {
        level: "planet",
        selectedGalaxyId: null,
        selectedPlanetId: "global-observatory",
        selectedSystemId: null,
      };
  }
}
