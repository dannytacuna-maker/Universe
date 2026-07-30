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
  cameraPosition: [0.9, -3.02, -9.05],
  description:
    "A weekly intelligence station translating verified world developments into a concise, source-grounded briefing.",
  descriptor: "Global insight. Clear mind.",
  galaxyId: null,
  id: "global-observatory",
  name: "The Observatory",
  orientation: [0.1, -0.24, -0.06],
  palette: {
    aperture: "#f5c06a",
    beacon: "#f8feff",
    core: "#9de8f4",
    metalDark: "#0e151c",
    metalLight: "#5a7284",
    signal: "#6ecde8",
  },
  position: [0.9, -3.35, -12.2],
  scale: 1.18,
};
