export type Vector3Tuple = readonly [number, number, number];

export type GalaxyPalette = Readonly<{
  accent: Vector3Tuple;
  core: Vector3Tuple;
  primary: Vector3Tuple;
  secondary: Vector3Tuple;
}>;

export type GalaxyParticleDistribution = Readonly<{
  armCount: number;
  armParticleCount: number;
  armSpread: number;
  coreParticleCount: number;
  haloParticleCount: number;
  radius: number;
  seed: number;
  thickness: number;
  twist: number;
}>;

export type GalaxyDefinition = Readonly<{
  morphology: "flocculent" | "grand-design";
  name: string;
  orientation: Vector3Tuple;
  palette: GalaxyPalette;
  particleDistribution: GalaxyParticleDistribution;
  position: Vector3Tuple;
  rotationSpeed: number;
  scale: number;
}>;
