import type { GalaxyDefinition } from "../galaxy-definition";

export const personalGrowthGalaxyDefinition = {
  morphology: "flocculent",
  name: "Personal Growth",
  orientation: [0.46, 0.14, 0.24],
  palette: {
    accent: [0.65, 0.48, 0.86],
    core: [1, 0.95, 0.82],
    primary: [0.26, 0.66, 0.68],
    secondary: [0.94, 0.68, 0.32],
  },
  particleDistribution: {
    armCount: 5,
    armParticleCount: 6_200,
    armSpread: 0.24,
    coreParticleCount: 980,
    haloParticleCount: 1_300,
    radius: 2.12,
    seed: 270_121,
    thickness: 0.26,
    twist: 0.92,
  },
  position: [4.25, -1.15, -9.8],
  rotationSpeed: -0.0032,
  scale: 1.17,
} as const satisfies GalaxyDefinition;
