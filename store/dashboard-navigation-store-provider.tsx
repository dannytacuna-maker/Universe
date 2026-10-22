"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { useStore } from "zustand";

import type { DashboardNavigation } from "@/lib/dashboard-sections";

import {
  createDashboardNavigationStore,
  type DashboardNavigationStore,
  type DashboardNavigationStoreApi,
} from "./dashboard-navigation-store";

const DashboardNavigationStoreContext =
  createContext<DashboardNavigationStoreApi | null>(null);

type DashboardNavigationStoreProviderProps = Readonly<{
  children: ReactNode;
  initialState?: DashboardNavigation;
}>;

export function DashboardNavigationStoreProvider({
  children,
  initialState,
}: DashboardNavigationStoreProviderProps) {
  const [store] = useState<DashboardNavigationStoreApi>(() =>
    createDashboardNavigationStore(initialState),
  );

  return (
    <DashboardNavigationStoreContext value={store}>
      {children}
    </DashboardNavigationStoreContext>
  );
}

export function useDashboardNavigationStore<T>(
  selector: (store: DashboardNavigationStore) => T,
): T {
  const store = useContext(DashboardNavigationStoreContext);

  if (store === null) {
    throw new Error(
      "useDashboardNavigationStore must be used within a DashboardNavigationStoreProvider.",
    );
  }

  return useStore(store, selector);
}
