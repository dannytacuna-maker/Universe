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
    compact: [55, 56],
    desktop: [55, 54],
    portrait: [54, 57],
  },
  landingOrigin: [30, -2, -33],
  name: "Hyperbolic Time Chamber",
  palette: {
    accent: "#a9e4dc",
    atmosphere: "#62a8a3",
    base: "#0b1820",
  },
  position: [3.76, -0.86, -9.68],
  seed: 294_731,
  systemId: "jiu-jitsu",
} as const satisfies PersonalGrowthPlanetDefinition;

export const jiuJitsuPlanets = [
  hyperbolicTimeChamberDefinition,
] as const satisfies readonly PersonalGrowthPlanetDefinition[];
