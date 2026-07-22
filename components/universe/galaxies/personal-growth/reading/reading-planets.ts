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
    compact: [55, 56],
    desktop: [55, 54],
    portrait: [54, 57],
  },
  landingOrigin: [36, -2, -37],
  name: "Celestial Library",
  palette: {
    accent: "#e3c88f",
    atmosphere: "#9d86b5",
    base: "#171424",
  },
  position: [4.76, -1.82, -9.7],
  seed: 672_145,
  systemId: "reading",
} as const satisfies PersonalGrowthPlanetDefinition;

export const readingPlanets = [
  celestialLibraryDefinition,
] as const satisfies readonly PersonalGrowthPlanetDefinition[];
