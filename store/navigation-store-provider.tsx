"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { useStore } from "zustand";

import {
  createNavigationStore,
  type NavigationState,
  type NavigationStore,
  type NavigationStoreApi,
} from "./navigation-store";

const NavigationStoreContext = createContext<NavigationStoreApi | null>(null);

type NavigationStoreProviderProps = Readonly<{
  children: ReactNode;
  initialState?: NavigationState;
}>;

export function NavigationStoreProvider({
  children,
  initialState,
}: NavigationStoreProviderProps) {
  const [store] = useState<NavigationStoreApi>(() =>
    createNavigationStore(initialState),
  );

  return (
    <NavigationStoreContext value={store}>{children}</NavigationStoreContext>
  );
}

export function useNavigationStore<T>(
  selector: (store: NavigationStore) => T,
): T {
  const store = useContext(NavigationStoreContext);

  if (store === null) {
    throw new Error(
      "useNavigationStore must be used within a NavigationStoreProvider.",
    );
  }

  return useStore(store, selector);
}
