import type { Vector3Tuple } from "../galaxy-definition";

export type ForgePlanetDefinition = Readonly<{
  cameraLookTarget: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  description: string;
  externalUrl?: string;
  galaxyId: "forge";
  id: string;
  kind: "landing";
  labelPosition: Readonly<{
    compact: readonly [x: number, y: number];
    desktop: readonly [x: number, y: number];
    portrait: readonly [x: number, y: number];
  }>;
  landingOrigin: Vector3Tuple;
  name: string;
  palette: Readonly<{
    accent: string;
    atmosphere: string;
    base: string;
  }>;
  position: Vector3Tuple;
  seed: number;
  systemId: "firmus" | "delicias";
}>;
