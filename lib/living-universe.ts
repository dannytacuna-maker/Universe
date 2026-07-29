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
