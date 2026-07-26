import type { PersonalGrowthPlanetDefinition } from "../personal-growth-planet-definition";

export const frenchStationDefinition = {
  cameraLookTarget: [48, 0.65, -52.4],
  cameraPosition: [48, 0.85, -45.4],
  description:
    "A quiet orbital station for French practice, Duolingo progress, and language reflection.",
  galaxyId: "personal-growth",
  id: "french-station",
  kind: "station",
  labelPosition: {
    compact: [68, 52],
    desktop: [68, 50],
    portrait: [67, 53],
  },
  landingOrigin: [48, 0, -52],
  name: "Lumière Station",
  palette: {
    accent: "#8ec9ff",
    atmosphere: "#546fca",
    base: "#07101f",
  },
  position: [5.28, 0.38, -10.18],
  seed: 314_159,
  systemId: "french",
} as const satisfies PersonalGrowthPlanetDefinition;

export const frenchPlanets = [
  frenchStationDefinition,
] as const satisfies readonly PersonalGrowthPlanetDefinition[];
