export type EvidenceCometTarget = "personal-growth" | "university";

export const evidenceCometEventName = "mission-control:evidence-comet";

export type EvidenceCometDetail = Readonly<{
  incompleteEvidenceRatio: number;
  target: EvidenceCometTarget;
}>;

export function requestEvidenceComet(detail: EvidenceCometDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<EvidenceCometDetail>(evidenceCometEventName, { detail }),
  );
}

export function subscribeToEvidenceComet(
  listener: (detail: EvidenceCometDetail) => void,
) {
  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent<EvidenceCometDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(evidenceCometEventName, handleEvent);
  return () => window.removeEventListener(evidenceCometEventName, handleEvent);
}

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

export function rememberMissionDestination(destinationId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(lastDestinationKey, destinationId);
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

const ceremonySeenKey = "mission-control:weekly-ceremony-seen";

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
  } catch {
    // Ignore persistence failures.
  }
}
