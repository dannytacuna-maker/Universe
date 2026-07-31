const briefingSeenKey = "mission-control:observatory-briefing-seen";

export function getSeenObservatoryBriefingId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(briefingSeenKey);
  } catch {
    return null;
  }
}

export function markObservatoryBriefingSeen(briefingId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(briefingSeenKey, briefingId);
  } catch {
    // Ignore persistence failures.
  }
}

const lastDestinationKey = "mission-control:last-destination";
const lastDestinationChangedEvent = "mission-control:last-destination-changed";
const ceremonySeenKey = "mission-control:weekly-ceremony-seen";
const ceremonySeenChangedEvent = "mission-control:weekly-ceremony-seen-changed";

export function rememberMissionDestination(destinationId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(lastDestinationKey, destinationId);
    window.dispatchEvent(new Event(lastDestinationChangedEvent));
  } catch {
    // Ignore persistence failures.
  }
}

export function getLastMissionDestination() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(lastDestinationKey);
  } catch {
    return null;
  }
}

export function subscribeToLastMissionDestination(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(lastDestinationChangedEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(lastDestinationChangedEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

export function getSeenWeeklyCeremonyWeek(weekStart: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(ceremonySeenKey) === weekStart;
  } catch {
    return false;
  }
}

export function markWeeklyCeremonySeen(weekStart: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ceremonySeenKey, weekStart);
    window.dispatchEvent(new Event(ceremonySeenChangedEvent));
  } catch {
    // Ignore persistence failures.
  }
}

export function subscribeToWeeklyCeremonySeen(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(ceremonySeenChangedEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(ceremonySeenChangedEvent, listener);
    window.removeEventListener("storage", listener);
  };
}
