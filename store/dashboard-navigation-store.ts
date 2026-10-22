import { createStore } from "zustand/vanilla";

import {
  defaultDashboardNavigation,
  type DashboardNavigation,
  type DashboardSectionId,
  type JiuJitsuSubview,
  type StrengthSubview,
} from "@/lib/dashboard-sections";

export type DashboardNavigationActions = {
  navigate: (navigation: Partial<DashboardNavigation> & { section: DashboardSectionId }) => void;
  replaceNavigation: (navigation: DashboardNavigation) => void;
  setJiuJitsuSubview: (subview: JiuJitsuSubview) => void;
  setStrengthSubview: (subview: StrengthSubview) => void;
};

export type DashboardNavigationStore = DashboardNavigation &
  DashboardNavigationActions;

export function createDashboardNavigationStore(
  initialNavigation: DashboardNavigation = defaultDashboardNavigation,
) {
  return createStore<DashboardNavigationStore>()((set) => ({
    ...initialNavigation,
    navigate: (navigation) =>
      set((state) => ({
        section: navigation.section,
        jiuJitsuSubview:
          navigation.jiuJitsuSubview ??
          (navigation.section === "jiu-jitsu"
            ? state.jiuJitsuSubview
            : "log"),
        strengthSubview:
          navigation.strengthSubview ??
          (navigation.section === "strength-physique"
            ? state.strengthSubview
            : "training"),
      })),
    replaceNavigation: (navigation) => set(navigation),
    setJiuJitsuSubview: (jiuJitsuSubview) => set({ jiuJitsuSubview }),
    setStrengthSubview: (strengthSubview) => set({ strengthSubview }),
  }));
}

export type DashboardNavigationStoreApi = ReturnType<
  typeof createDashboardNavigationStore
>;
