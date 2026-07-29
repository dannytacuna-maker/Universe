"use client";

import type { ReactNode } from "react";

import { rebirthUpdate } from "@/lib/rebirth";

import styles from "./command-dock.module.css";

type CommandDockProps = Readonly<{
  children: ReactNode;
}>;

export function CommandDock({ children }: CommandDockProps) {
  return (
    <div aria-label="Mission Control instruments" className={styles.dock}>
      <span aria-hidden="true" className={styles.versionMark}>
        {rebirthUpdate.name}
      </span>
      {children}
    </div>
  );
}
