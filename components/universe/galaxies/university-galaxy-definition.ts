import type { GalaxyDefinition } from "./galaxy-definition";

export const universityGalaxyDefinition = {
  morphology: "grand-design",
  name: "University",
  orientation: [0.54, -0.12, -0.24],
  palette: {
    accent: [0.58, 0.48, 0.92],
    core: [0.92, 0.97, 1],
    primary: [0.3, 0.55, 0.96],
    secondary: [0.5, 0.84, 1],
  },
  particleDistribution: {
    armCount: 4,
    armParticleCount: 6_800,
    armSpread: 0.135,
    coreParticleCount: 1_100,
    haloParticleCount: 1_450,
    radius: 2.25,
    seed: 314_159,
    thickness: 0.18,
    twist: 1.22,
  },
  position: [-1.45, 0.9, -8.5],
  rotationSpeed: 0.0042,
  scale: 1.22,
} as const satisfies GalaxyDefinition;
