import type { PersonalGrowthPlanetDefinition } from "../personal-growth-planet-definition";

export const celestialLibraryDefinition = {
  cameraLookTarget: [36, -1, -37.4],
  cameraPosition: [36, -0.08, -30.9],
  description:
    "A celestial library for books, reading sessions, progress, and lasting reflections.",
  galaxyId: "personal-growth",
  id: "celestial-library",
  kind: "library",
  labelPosition: {
    compact: [68, 55],
    desktop: [68, 53],
    portrait: [67, 55],
  },
  landingOrigin: [36, -2, -37],
  name: "Celestial Library",
  palette: {
    accent: "#e3c88f",
    atmosphere: "#9d86b5",
    base: "#171424",
  },
  position: [5.3, -1.8, -9.65],
  seed: 672_145,
  systemId: "reading",
} as const satisfies PersonalGrowthPlanetDefinition;

export const readingPlanets = [
  celestialLibraryDefinition,
] as const satisfies readonly PersonalGrowthPlanetDefinition[];
