import type { PersonalGrowthSystemDefinition } from "./personal-growth-system-definition";

export const personalGrowthSystems = [
  {
    cameraPosition: [3.55, -0.62, -7.55],
    description: "Training consistency, techniques, sparring, and reflection.",
    displayName: "Jiu-Jitsu",
    id: "jiu-jitsu",
    labelPosition: {
      compact: [27, 45],
      desktop: [38, 43],
      portrait: [29, 44],
    },
    name: "Jiu-Jitsu",
    palette: {
      core: "#f0f6ec",
      halo: "#6ab9ae",
      orbit: "#739b97",
    },
    position: [3.55, -0.75, -9.5],
    scale: 1,
    seed: 121_019,
    status: "explorable",
  },
  {
    cameraPosition: [4.95, -0.7, -7.8],
    description: "Strength training, physique, recovery, and progression.",
    displayName: "Strength & Physique",
    id: "strength-physique",
    labelPosition: {
      compact: [73, 43],
      desktop: [65, 43],
      portrait: [71, 43],
    },
    name: "Strength and Physique",
    palette: {
      core: "#f2f3ee",
      halo: "#9cae91",
      orbit: "#7d8e75",
    },
    position: [4.95, -0.78, -10],
    scale: 0.78,
    seed: 412_887,
    status: "future",
  },
  {
    cameraPosition: [4.55, -1.58, -7.7],
    description: "Books, reading consistency, ideas, and lasting insight.",
    displayName: "Reading",
    id: "reading",
    labelPosition: {
      compact: [67, 66],
      desktop: [61, 70],
      portrait: [65, 69],
    },
    name: "Reading",
    palette: {
      core: "#f5f1e8",
      halo: "#a89d82",
      orbit: "#8f826b",
    },
    position: [4.55, -1.75, -9.55],
    scale: 0.72,
    seed: 805_721,
    status: "future",
  },
  {
    cameraPosition: [3.7, -1.5, -8],
    description: "Daily push-ups, sit-ups, mobility, and personal discipline.",
    displayName: "Daily Discipline",
    id: "daily-discipline",
    labelPosition: {
      compact: [28, 66],
      desktop: [40, 68],
      portrait: [30, 67],
    },
    name: "Daily Discipline",
    palette: {
      core: "#edf5f5",
      halo: "#6f9da3",
      orbit: "#66868a",
    },
    position: [3.7, -1.62, -10.15],
    scale: 0.7,
    seed: 511_301,
    status: "future",
  },
] as const satisfies readonly PersonalGrowthSystemDefinition[];

export const jiuJitsuSystem = personalGrowthSystems[0];
