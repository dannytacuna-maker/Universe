import type { PersonalGrowthSystemDefinition } from "./personal-growth-system-definition";

export const personalGrowthSystems = [
  {
    cameraPosition: [4.15, 0.42, -5.72],
    description:
      "French practice, Duolingo progress, confidence, and lasting fluency.",
    displayName: "French",
    id: "french",
    labelPosition: {
      compact: [52, 25],
      desktop: [51, 24],
      portrait: [52, 25],
    },
    name: "French",
    palette: {
      core: "#eef8ff",
      halo: "#79b9ed",
      orbit: "#6e83d5",
    },
    position: [4.15, 0.25, -10.18],
    scale: 0.88,
    seed: 731_947,
    status: "explorable",
  },
  {
    cameraPosition: [2.85, -0.28, -5.35],
    description: "Training consistency, techniques, sparring, and reflection.",
    displayName: "Jiu-Jitsu",
    id: "jiu-jitsu",
    labelPosition: {
      compact: [26, 43],
      desktop: [32, 43],
      portrait: [27, 43],
    },
    name: "Jiu-Jitsu",
    palette: {
      core: "#f0f6ec",
      halo: "#6ab9ae",
      orbit: "#739b97",
    },
    position: [2.85, -0.55, -9.45],
    scale: 1,
    seed: 121_019,
    status: "explorable",
  },
  {
    cameraPosition: [5.65, -0.25, -5.8],
    description: "Strength training, physique, recovery, and progression.",
    displayName: "Strength & Physique",
    id: "strength-physique",
    labelPosition: {
      compact: [74, 43],
      desktop: [69, 43],
      portrait: [73, 43],
    },
    name: "Strength and Physique",
    palette: {
      core: "#f2f3ee",
      halo: "#9cae91",
      orbit: "#7d8e75",
    },
    position: [5.65, -0.55, -10.1],
    scale: 0.92,
    seed: 412_887,
    status: "explorable",
  },
  {
    cameraPosition: [4.15, -1.9, -5.5],
    description: "Books, reading consistency, ideas, and lasting insight.",
    displayName: "Reading",
    id: "reading",
    labelPosition: {
      compact: [52, 70],
      desktop: [51, 72],
      portrait: [52, 71],
    },
    name: "Reading",
    palette: {
      core: "#f5f1e8",
      halo: "#a89d82",
      orbit: "#8f826b",
    },
    position: [4.15, -2.15, -9.65],
    scale: 0.82,
    seed: 805_721,
    status: "explorable",
  },
] as const satisfies readonly PersonalGrowthSystemDefinition[];

export const frenchSystem = personalGrowthSystems[0];
export const jiuJitsuSystem = personalGrowthSystems[1];
export const strengthPhysiqueSystem = personalGrowthSystems[2];
export const readingSystem = personalGrowthSystems[3];
