import type { GalaxyDefinition } from "../galaxy-definition";

export const personalGrowthGalaxyDefinition = {
  name: "Personal Growth",
  orientation: [0.48, 0.16, 0.2],
  palette: {
    accent: [0.68, 0.55, 0.9],
    core: [0.96, 0.98, 0.94],
    primary: [0.28, 0.72, 0.73],
    secondary: [0.62, 0.84, 0.79],
  },
  particleDistribution: {
    armCount: 3,
    armParticleCount: 4_800,
    armSpread: 0.19,
    coreParticleCount: 760,
    haloParticleCount: 980,
    radius: 1.82,
    seed: 270_121,
    thickness: 0.19,
    twist: 1.02,
  },
  position: [4.25, -1.15, -9.8],
  rotationSpeed: -0.0045,
  scale: 1.08,
} as const satisfies GalaxyDefinition;
