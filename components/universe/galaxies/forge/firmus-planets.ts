import type { ForgePlanetDefinition } from "./forge-planet-definition";

export const firmusLandingDefinition = {
  cameraLookTarget: [-48, -1.05, -52.35],
  cameraPosition: [-48, -0.12, -45.8],
  description:
    "Firmus landing page workspace — positioning, assets, and ship readiness for the public site.",
  galaxyId: "forge",
  id: "firmus-landing",
  kind: "landing",
  labelPosition: {
    compact: [62, 48],
    desktop: [64, 46],
    portrait: [63, 48],
  },
  landingOrigin: [-48, -2.05, -52],
  name: "Firmus Landing",
  palette: {
    accent: "#ff7a5c",
    atmosphere: "#c94a3c",
    base: "#1a0c0b",
  },
  position: [-8.55, -2.35, -14.35],
  seed: 271_828,
  systemId: "firmus",
} as const satisfies ForgePlanetDefinition;

export const forgePlanets = [
  firmusLandingDefinition,
] as const satisfies readonly ForgePlanetDefinition[];
