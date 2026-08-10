import type { ForgePlanetDefinition } from "./forge-planet-definition";

export const firmusLandingUrl = "https://firmus-landing.vercel.app";

export const firmusLandingDefinition = {
  cameraLookTarget: [-48, -1.05, -52.35],
  cameraPosition: [-48, -0.12, -45.8],
  description:
    "Firmus landing page workspace — positioning, assets, and ship readiness for the public site.",
  externalUrl: firmusLandingUrl,
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

export const deliciasLandingUrl =
  "https://delicias-tipicas-la-sancarlena.vercel.app/#inicio";

export const deliciasLandingDefinition = {
  cameraLookTarget: [-38, -0.85, -48.35],
  cameraPosition: [-38, 0.05, -41.8],
  description:
    "Delicias Típicas La Sancarlena — opens the live public site while you stay in The Forge.",
  externalUrl: deliciasLandingUrl,
  galaxyId: "forge",
  id: "delicias-landing",
  kind: "landing",
  labelPosition: {
    compact: [58, 42],
    desktop: [60, 40],
    portrait: [59, 41],
  },
  landingOrigin: [-38, -1.75, -48],
  name: "La Sancarlena",
  palette: {
    accent: "#f0b429",
    atmosphere: "#c45c26",
    base: "#1a1008",
  },
  position: [-6.85, -1.55, -13.45],
  seed: 161_803,
  systemId: "delicias",
} as const satisfies ForgePlanetDefinition;

export const rioTruckingLandingUrl = "https://rio-trucking.vercel.app/#contact";

export const rioTruckingLandingDefinition = {
  cameraLookTarget: [-55, -1.45, -54.35],
  cameraPosition: [-55, -0.35, -47.8],
  description:
    "Rio Trucking — opens the live public site while you stay in The Forge.",
  externalUrl: rioTruckingLandingUrl,
  galaxyId: "forge",
  id: "rio-trucking-landing",
  kind: "landing",
  labelPosition: {
    compact: [40, 54],
    desktop: [42, 52],
    portrait: [41, 53],
  },
  landingOrigin: [-55, -2.35, -54],
  name: "Rio Trucking",
  palette: {
    accent: "#6ea8e0",
    atmosphere: "#2f5f8f",
    base: "#0a121c",
  },
  position: [-10.15, -2.85, -14.75],
  seed: 739_391,
  systemId: "rio-trucking",
} as const satisfies ForgePlanetDefinition;

export const forgePlanets = [
  firmusLandingDefinition,
  deliciasLandingDefinition,
  rioTruckingLandingDefinition,
] as const satisfies readonly ForgePlanetDefinition[];

export function getForgeExternalUrl(planetId: string) {
  const planet = forgePlanets.find((candidate) => candidate.id === planetId);
  return planet?.externalUrl ?? null;
}
