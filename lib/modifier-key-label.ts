"use client";

import { useSyncExternalStore } from "react";

function isApplePlatform() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Mac|iPhone|iPad|iPod/i.test(
    navigator.platform || navigator.userAgent,
  );
}

function subscribe() {
  return () => undefined;
}

function getSnapshot() {
  return isApplePlatform() ? "⌘" : "Ctrl";
}

function getServerSnapshot() {
  return "Ctrl";
}

export function useModifierKeyLabel() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
