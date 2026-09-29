const listeners = new Set<() => void>();
let openWorkspaceCount = 0;

function emit() {
  for (const listener of listeners) listener();
}

export function registerOpenWorkspace() {
  openWorkspaceCount += 1;
  emit();

  let isRegistered = true;
  return () => {
    if (!isRegistered) return;
    isRegistered = false;
    openWorkspaceCount = Math.max(0, openWorkspaceCount - 1);
    emit();
  };
}

export function isAnyWorkspaceOpen() {
  return openWorkspaceCount > 0;
}

export function isAnyWorkspaceOpenOnServer() {
  return false;
}

export function subscribeToWorkspacePresence(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
