"use client";

import { createContext, useContext, type ReactNode } from "react";

export type DashboardChromeLayout = "overlay" | "page";

type DashboardChromeValue = Readonly<{
  layout: DashboardChromeLayout;
}>;

const DashboardChromeContext = createContext<DashboardChromeValue>({
  layout: "overlay",
});

type DashboardChromeProviderProps = Readonly<{
  children: ReactNode;
  layout?: DashboardChromeLayout;
}>;

export function DashboardChromeProvider({
  children,
  layout = "page",
}: DashboardChromeProviderProps) {
  return (
    <DashboardChromeContext value={{ layout }}>
      {children}
    </DashboardChromeContext>
  );
}

export function useDashboardChrome() {
  return useContext(DashboardChromeContext);
}
