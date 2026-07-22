import { createStore } from "zustand/vanilla";

export type NavigationLevel = "galaxy" | "planet" | "system" | "universe";

export type NavigationState = {
  level: NavigationLevel;
  selectedGalaxyId: string | null;
  selectedPlanetId: string | null;
  selectedSystemId: string | null;
};

export type NavigationActions = {
  enterGalaxy: (galaxyId: string) => void;
  enterPlanet: (galaxyId: string, systemId: string, planetId: string) => void;
  enterSystem: (galaxyId: string, systemId: string) => void;
  returnToGalaxy: (galaxyId: string) => void;
  returnToSystem: (galaxyId: string, systemId: string) => void;
  returnToUniverse: () => void;
  replaceNavigationState: (state: NavigationState) => void;
};

export type NavigationStore = NavigationState & NavigationActions;

const initialState: NavigationState = {
  level: "universe",
  selectedGalaxyId: null,
  selectedPlanetId: null,
  selectedSystemId: null,
};

export function createNavigationStore(
  initialNavigationState: NavigationState = initialState,
) {
  return createStore<NavigationStore>()((set) => ({
    ...initialNavigationState,
    enterGalaxy: (selectedGalaxyId) =>
      set({
        level: "galaxy",
        selectedGalaxyId,
        selectedPlanetId: null,
        selectedSystemId: null,
      }),
    enterPlanet: (selectedGalaxyId, selectedSystemId, selectedPlanetId) =>
      set({
        level: "planet",
        selectedGalaxyId,
        selectedPlanetId,
        selectedSystemId,
      }),
    enterSystem: (selectedGalaxyId, selectedSystemId) =>
      set({
        level: "system",
        selectedGalaxyId,
        selectedPlanetId: null,
        selectedSystemId,
      }),
    returnToGalaxy: (selectedGalaxyId) =>
      set({
        level: "galaxy",
        selectedGalaxyId,
        selectedPlanetId: null,
        selectedSystemId: null,
      }),
    returnToSystem: (selectedGalaxyId, selectedSystemId) =>
      set({
        level: "system",
        selectedGalaxyId,
        selectedPlanetId: null,
        selectedSystemId,
      }),
    returnToUniverse: () =>
      set({
        level: "universe",
        selectedGalaxyId: null,
        selectedPlanetId: null,
        selectedSystemId: null,
      }),
    replaceNavigationState: (state) => set(state),
  }));
}

export type NavigationStoreApi = ReturnType<typeof createNavigationStore>;
