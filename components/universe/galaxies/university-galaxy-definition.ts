import type { GalaxyDefinition } from "./galaxy-definition";

export const universityGalaxyDefinition = {
  name: "University",
  orientation: [0.62, -0.12, -0.22],
  palette: {
    accent: [0.58, 0.48, 0.92],
    core: [0.92, 0.97, 1],
    primary: [0.3, 0.55, 0.96],
    secondary: [0.5, 0.84, 1],
  },
  particleDistribution: {
    armCount: 4,
    armParticleCount: 5_600,
    armSpread: 0.17,
    coreParticleCount: 900,
    haloParticleCount: 1_200,
    radius: 1.9,
    seed: 314_159,
    thickness: 0.14,
    twist: 1.16,
  },
  position: [-1.45, 0.9, -8.5],
  rotationSpeed: 0.006,
  scale: 1.15,
} as const satisfies GalaxyDefinition;
