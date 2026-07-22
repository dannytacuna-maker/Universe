import type { StrengthPlanetDefinition } from "./strength-planet-definition";

export const beerusPlanetDefinition = {
  cameraLookTarget: [12, -1, -20.4],
  cameraPosition: [12, -0.18, -14.2],
  description:
    "A celestial training sanctuary where Whis guides the six-day strength program.",
  galaxyId: "personal-growth",
  id: "beerus-planet",
  kind: "sanctuary",
  labelPosition: {
    compact: [70, 43],
    desktop: [68, 46],
    portrait: [70, 43],
  },
  landingOrigin: [12, -2, -20],
  name: "Beerus' Planet",
  palette: {
    accent: "#b767cf",
    atmosphere: "#a96ed2",
    base: "#34143f",
  },
  position: [5.3, -0.7, -9.86],
  seed: 721_909,
  systemId: "strength-physique",
} as const satisfies StrengthPlanetDefinition;
