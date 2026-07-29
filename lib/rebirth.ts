export const rebirthUpdate = {
  codename: "CURSORS INTRODUCTION",
  id: "rebirth-cursors-introduction",
  name: "REBIRTH UPDATE",
  tagline: "Daily orbit. Living cosmos. One instrument cluster.",
} as const;

const welcomeStorageKey = `mission-control:${rebirthUpdate.id}:welcome-dismissed`;

export function hasDismissedRebirthWelcome() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(welcomeStorageKey) === "1";
  } catch {
    return false;
  }
}

export function dismissRebirthWelcome() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(welcomeStorageKey, "1");
  } catch {
    // Private mode may reject persistence; the banner can still close in-session.
  }
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const dailyNudgeStorageKey = "mission-control:daily-nudge-seen";

export function hasSeenDailyNudgeToday() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(dailyNudgeStorageKey) === getLocalDateKey();
  } catch {
    return false;
  }
}

export function markDailyNudgeSeen() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(dailyNudgeStorageKey, getLocalDateKey());
  } catch {
    // Ignore persistence failures.
  }
}
