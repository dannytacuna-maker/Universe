export type InterfaceSurfaceId =
  | "jarvis"
  | "jiu-jitsu-review"
  | "jiu-jitsu-training-log"
  | "mission"
  | "observatory"
  | "reading-library"
  | "strength-whis"
  | "today-orbit"
  | "university-operations"
  | "university-schedule";

const interfaceSurfaceEvent = "mission-control:interface-surface";

type InterfaceSurfaceDetail = Readonly<{
  id: InterfaceSurfaceId;
}>;

export function activateInterfaceSurface(id: InterfaceSurfaceId) {
  window.dispatchEvent(
    new CustomEvent<InterfaceSurfaceDetail>(interfaceSurfaceEvent, {
      detail: { id },
    }),
  );
}

export function subscribeToInterfaceSurfaces(
  listener: (id: InterfaceSurfaceId) => void,
) {
  const handleSurfaceChange = (event: Event) => {
    const customEvent = event as CustomEvent<InterfaceSurfaceDetail>;
    listener(customEvent.detail.id);
  };

  window.addEventListener(interfaceSurfaceEvent, handleSurfaceChange);
  return () =>
    window.removeEventListener(interfaceSurfaceEvent, handleSurfaceChange);
}
