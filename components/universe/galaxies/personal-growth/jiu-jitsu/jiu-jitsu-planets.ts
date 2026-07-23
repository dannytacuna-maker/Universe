import type { PersonalGrowthPlanetDefinition } from "../personal-growth-planet-definition";

export const hyperbolicTimeChamberDefinition = {
  cameraLookTarget: [30, -1, -33.4],
  cameraPosition: [30, -0.08, -26.9],
  description:
    "A quiet training chamber for reviewing accumulated Jiu-Jitsu practice, techniques, rounds, and reflection.",
  galaxyId: "personal-growth",
  id: "hyperbolic-time-chamber",
  kind: "time-chamber",
  labelPosition: {
    compact: [68, 55],
    desktop: [68, 53],
    portrait: [67, 55],
  },
  landingOrigin: [30, -2, -33],
  name: "Hyperbolic Time Chamber",
  palette: {
    accent: "#a9e4dc",
    atmosphere: "#62a8a3",
    base: "#0b1820",
  },
  position: [4, -0.9, -9.5],
  seed: 294_731,
  systemId: "jiu-jitsu",
} as const satisfies PersonalGrowthPlanetDefinition;

export const jiuJitsuPlanets = [
  hyperbolicTimeChamberDefinition,
] as const satisfies readonly PersonalGrowthPlanetDefinition[];
