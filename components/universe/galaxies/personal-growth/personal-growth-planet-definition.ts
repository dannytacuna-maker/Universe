import type { Vector3Tuple } from "../galaxy-definition";

export type PersonalGrowthPlanetKind =
  "library" | "playlist" | "program" | "sanctuary" | "time-chamber";

export type PersonalGrowthPlanetSystemId =
  "jiu-jitsu" | "reading" | "strength-physique";

export type PersonalGrowthPlanetDefinition = Readonly<{
  cameraLookTarget: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  description: string;
  galaxyId: "personal-growth";
  id: string;
  kind: PersonalGrowthPlanetKind;
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
  systemId: PersonalGrowthPlanetSystemId;
}>;
