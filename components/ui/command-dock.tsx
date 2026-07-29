"use client";

import type { ReactNode } from "react";

import styles from "./command-dock.module.css";

type CommandDockProps = Readonly<{
  children: ReactNode;
}>;

export function CommandDock({ children }: CommandDockProps) {
  return (
    <div aria-label="Mission Control instruments" className={styles.dock}>
      {children}
    </div>
  );
}
