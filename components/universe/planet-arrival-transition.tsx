"use client";

export type PlanetArrivalPhase = "covering" | "holding" | "idle" | "revealing";

type PlanetArrivalTransitionProps = Readonly<{
  phase: PlanetArrivalPhase;
}>;

export function PlanetArrivalTransition({
  phase,
}: PlanetArrivalTransitionProps) {
  return (
    <div
      aria-hidden="true"
      className="planet-arrival-transition"
      data-phase={phase}
    >
      <span />
      <span />
    </div>
  );
}
