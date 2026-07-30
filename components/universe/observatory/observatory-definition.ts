import type { Vector3Tuple } from "../galaxies/galaxy-definition";

export type ObservatoryPalette = Readonly<{
  aperture: string;
  beacon: string;
  core: string;
  metalDark: string;
  metalLight: string;
  signal: string;
}>;

export type ObservatoryDefinition = Readonly<{
  cameraLookTarget: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  description: string;
  descriptor: string;
  galaxyId: null;
  id: string;
  name: string;
  orientation: Vector3Tuple;
  palette: ObservatoryPalette;
  position: Vector3Tuple;
  scale: number;
}>;

export const globalObservatoryDefinition: ObservatoryDefinition = {
  cameraLookTarget: [0.9, -3.35, -12.2],
  cameraPosition: [2.2, -2.7, -9.4],
  description:
    "A weekly intelligence station translating verified world developments into a concise, source-grounded briefing.",
  descriptor: "Global insight. Clear mind.",
  galaxyId: null,
  id: "global-observatory",
  name: "The Observatory",
  orientation: [0.2, -0.75, -0.08],
  palette: {
    aperture: "#f0c888",
    beacon: "#eef4fb",
    core: "#1a1f26",
    metalDark: "#0c0f13",
    metalLight: "#262d36",
    signal: "#8a7348",
  },
  position: [0.9, -3.35, -12.2],
  scale: 1.15,
};
