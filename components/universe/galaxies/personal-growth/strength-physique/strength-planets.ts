import { beerusPlanetDefinition } from "./beerus-planet-definition";
import type { PersonalGrowthPlanetDefinition } from "../personal-growth-planet-definition";

export const trainingArchivePlanetDefinition = {
  cameraLookTarget: [18, -1, -25.4],
  cameraPosition: [18, -0.18, -19.2],
  description:
    "Daniel's original four-week powerlifting and bodybuilding hypertrophy program.",
  galaxyId: "personal-growth",
  id: "training-archive",
  kind: "program",
  labelPosition: {
    compact: [33, 43],
    desktop: [35, 42],
    portrait: [32, 43],
  },
  landingOrigin: [18, -2, -25],
  name: "Training Archive",
  palette: {
    accent: "#d0aa70",
    atmosphere: "#8c7659",
    base: "#20262b",
  },
  position: [5.05, -0.3, -10.05],
  seed: 438_217,
  systemId: "strength-physique",
} as const satisfies PersonalGrowthPlanetDefinition;

export const gymPlaylistPlanetDefinition = {
  cameraLookTarget: [24, -1, -29.4],
  cameraPosition: [24, -0.18, -23.2],
  description:
    "Daniel's Spotify gym playlists, kept separate from training records and programming.",
  galaxyId: "personal-growth",
  id: "gym-playlist",
  kind: "playlist",
  labelPosition: {
    compact: [50, 70],
    desktop: [49, 72],
    portrait: [50, 71],
  },
  landingOrigin: [24, -2, -29],
  name: "Gym Playlist",
  palette: {
    accent: "#70d6ac",
    atmosphere: "#4a9a83",
    base: "#10242a",
  },
  position: [5.45, -1.5, -10.15],
  seed: 916_403,
  systemId: "strength-physique",
} as const satisfies PersonalGrowthPlanetDefinition;

export const strengthPlanets = [
  beerusPlanetDefinition,
  trainingArchivePlanetDefinition,
  gymPlaylistPlanetDefinition,
] as const satisfies readonly PersonalGrowthPlanetDefinition[];
