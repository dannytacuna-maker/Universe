import type { PersonalGrowthPlanetDefinition } from "../personal-growth-planet-definition";

export const beerusPlanetDefinition = {
  cameraLookTarget: [12, -1, -20.4],
  cameraPosition: [12, -0.18, -14.2],
  description:
    "A celestial training sanctuary where Whis guides the six-day strength program.",
  galaxyId: "personal-growth",
  id: "beerus-planet",
  kind: "sanctuary",
  labelPosition: {
    compact: [75, 42],
    desktop: [75, 41],
    portrait: [74, 42],
  },
  landingOrigin: [12, -2, -20],
  name: "Beerus' Planet",
  palette: {
    accent: "#b767cf",
    atmosphere: "#a96ed2",
    base: "#34143f",
  },
  position: [7, -0.15, -10.18],
  seed: 721_909,
  systemId: "strength-physique",
} as const satisfies PersonalGrowthPlanetDefinition;
