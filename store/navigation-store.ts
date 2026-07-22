import { createStore } from "zustand/vanilla";

export type NavigationLevel = "galaxy" | "system" | "universe";

export type NavigationState = {
  level: NavigationLevel;
  selectedGalaxyId: string | null;
  selectedSystemId: string | null;
};

export type NavigationActions = {
  enterGalaxy: (galaxyId: string) => void;
  enterSystem: (galaxyId: string, systemId: string) => void;
  returnToGalaxy: (galaxyId: string) => void;
  returnToUniverse: () => void;
  replaceNavigationState: (state: NavigationState) => void;
};

export type NavigationStore = NavigationState & NavigationActions;

const initialState: NavigationState = {
  level: "universe",
  selectedGalaxyId: null,
  selectedSystemId: null,
};

export function createNavigationStore(
  initialNavigationState: NavigationState = initialState,
) {
  return createStore<NavigationStore>()((set) => ({
    ...initialNavigationState,
    enterGalaxy: (selectedGalaxyId) =>
      set({ level: "galaxy", selectedGalaxyId, selectedSystemId: null }),
    enterSystem: (selectedGalaxyId, selectedSystemId) =>
      set({ level: "system", selectedGalaxyId, selectedSystemId }),
    returnToGalaxy: (selectedGalaxyId) =>
      set({ level: "galaxy", selectedGalaxyId, selectedSystemId: null }),
    returnToUniverse: () =>
      set({
        level: "universe",
        selectedGalaxyId: null,
        selectedSystemId: null,
      }),
    replaceNavigationState: (state) => set(state),
  }));
}

export type NavigationStoreApi = ReturnType<typeof createNavigationStore>;
