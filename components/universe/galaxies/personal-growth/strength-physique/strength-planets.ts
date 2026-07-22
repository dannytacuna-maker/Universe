import { beerusPlanetDefinition } from "./beerus-planet-definition";
import type { StrengthPlanetDefinition } from "./strength-planet-definition";

export const trainingArchivePlanetDefinition = {
  cameraLookTarget: [18, -1, -25.4],
  cameraPosition: [18, -0.18, -19.2],
  description:
    "Daniel's original four-week powerlifting and bodybuilding hypertrophy program.",
  galaxyId: "personal-growth",
  id: "training-archive",
  kind: "program",
  labelPosition: {
    compact: [34, 43],
    desktop: [38, 42],
    portrait: [32, 42],
  },
  landingOrigin: [18, -2, -25],
  name: "Training Archive",
  palette: {
    accent: "#d0aa70",
    atmosphere: "#8c7659",
    base: "#20262b",
  },
  position: [4.64, -0.62, -10.02],
  seed: 438_217,
  systemId: "strength-physique",
} as const satisfies StrengthPlanetDefinition;

export const gymPlaylistPlanetDefinition = {
  cameraLookTarget: [24, -1, -29.4],
  cameraPosition: [24, -0.18, -23.2],
  description:
    "Daniel's Spotify gym playlist, kept separate from training records and programming.",
  galaxyId: "personal-growth",
  id: "gym-playlist",
  kind: "playlist",
  labelPosition: {
    compact: [51, 66],
    desktop: [51, 66],
    portrait: [51, 68],
  },
  landingOrigin: [24, -2, -29],
  name: "Gym Playlist",
  palette: {
    accent: "#70d6ac",
    atmosphere: "#4a9a83",
    base: "#10242a",
  },
  position: [4.96, -1.08, -9.98],
  seed: 916_403,
  systemId: "strength-physique",
} as const satisfies StrengthPlanetDefinition;

export const strengthPlanets = [
  beerusPlanetDefinition,
  trainingArchivePlanetDefinition,
  gymPlaylistPlanetDefinition,
] as const satisfies readonly StrengthPlanetDefinition[];

export const supportingStrengthPlanets = [
  trainingArchivePlanetDefinition,
  gymPlaylistPlanetDefinition,
] as const satisfies readonly StrengthPlanetDefinition[];
