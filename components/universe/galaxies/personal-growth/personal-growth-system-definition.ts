import type { Vector3Tuple } from "../galaxy-definition";

export type PersonalGrowthSystemDefinition = Readonly<{
  cameraPosition: Vector3Tuple;
  description: string;
  displayName: string;
  id: "french" | "jiu-jitsu" | "reading" | "strength-physique";
  labelPosition: Readonly<{
    compact: readonly [number, number];
    desktop: readonly [number, number];
    portrait: readonly [number, number];
  }>;
  name: string;
  palette: Readonly<{
    core: string;
    halo: string;
    orbit: string;
  }>;
  position: Vector3Tuple;
  scale: number;
  seed: number;
  status: "explorable" | "future";
}>;
