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
  cameraPosition: [2.35, -2.55, -9.35],
  description:
    "A weekly intelligence station translating verified world developments into a concise, source-grounded briefing.",
  descriptor: "Global insight. Clear mind.",
  galaxyId: null,
  id: "global-observatory",
  name: "The Observatory",
  orientation: [0.18, -0.72, -0.08],
  palette: {
    aperture: "#d8b57a",
    beacon: "#f3f6fa",
    core: "#1c222a",
    metalDark: "#0d1014",
    metalLight: "#2c343f",
    signal: "#8a96a8",
  },
  position: [0.9, -3.35, -12.2],
  scale: 1.15,
};
