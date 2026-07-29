"use client";

import { useEffect, useState } from "react";

import {
  dismissRebirthWelcome,
  hasDismissedRebirthWelcome,
  rebirthUpdate,
} from "@/lib/rebirth";

import styles from "./rebirth-welcome.module.css";

export function RebirthWelcome() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!hasDismissedRebirthWelcome());
  }, []);

  if (!isVisible) {
    return null;
  }

  const dismiss = () => {
    dismissRebirthWelcome();
    setIsVisible(false);
  };

  return (
    <aside
      aria-label={`${rebirthUpdate.name}: ${rebirthUpdate.codename}`}
      className={styles.welcome}
      role="status"
    >
      <div className={styles.copy}>
        <span>{rebirthUpdate.name}</span>
        <strong>{rebirthUpdate.codename}</strong>
        <p>{rebirthUpdate.tagline}</p>
      </div>
      <button onClick={dismiss} type="button">
        Enter
      </button>
    </aside>
  );
}
