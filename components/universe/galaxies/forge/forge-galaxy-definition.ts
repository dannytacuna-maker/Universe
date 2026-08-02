import type { GalaxyDefinition } from "../galaxy-definition";

export const forgeGalaxyDefinition = {
  morphology: "flocculent",
  name: "The Forge",
  orientation: [-0.32, 0.22, -0.18],
  palette: {
    accent: [0.52, 0.07, 0.1],
    core: [1, 0.93, 0.88],
    primary: [0.86, 0.16, 0.14],
    secondary: [0.96, 0.42, 0.18],
  },
  particleDistribution: {
    armCount: 4,
    armParticleCount: 5_800,
    armSpread: 0.22,
    coreParticleCount: 1_050,
    haloParticleCount: 1_180,
    radius: 2.02,
    seed: 908_441,
    thickness: 0.24,
    twist: 1.05,
  },
  position: [-9.35, -2.45, -14.4],
  rotationSpeed: 0.0036,
  scale: 1.12,
} as const satisfies GalaxyDefinition;
