import type { Vector3Tuple } from "../../galaxy-definition";

export const beerusPlanetDefinition = {
  cameraLookTarget: [12, -1, -20.4],
  cameraPosition: [12, -0.18, -14.2],
  description:
    "A celestial training sanctuary where Whis guides the six-day strength program.",
  galaxyId: "personal-growth",
  id: "beerus-planet",
  landingOrigin: [12, -2, -20],
  name: "Beerus' Planet",
  position: [5.3, -0.7, -9.86],
  systemId: "strength-physique",
} as const satisfies Readonly<{
  cameraLookTarget: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  description: string;
  galaxyId: string;
  id: string;
  landingOrigin: Vector3Tuple;
  name: string;
  position: Vector3Tuple;
  systemId: string;
}>;
