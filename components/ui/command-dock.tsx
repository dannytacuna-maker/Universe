"use client";

import { useEffect, useRef, type ReactNode } from "react";

import styles from "./command-dock.module.css";

type CommandDockProps = Readonly<{
  children: ReactNode;
}>;

const dockInlineSizeProperty = "--command-dock-inline-size";

export function CommandDock({ children }: CommandDockProps) {
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dock = dockRef.current;
    if (dock === null) return;

    const root = document.documentElement;
    const publishSize = () => {
      root.style.setProperty(
        dockInlineSizeProperty,
        `${Math.ceil(dock.getBoundingClientRect().width)}px`,
      );
    };

    publishSize();
    const observer = new ResizeObserver(publishSize);
    observer.observe(dock);

    return () => {
      observer.disconnect();
      root.style.removeProperty(dockInlineSizeProperty);
    };
  }, []);

  return (
    <div
      aria-label="Mission Control instruments"
      className={styles.dock}
      ref={dockRef}
    >
      {children}
    </div>
  );
}
