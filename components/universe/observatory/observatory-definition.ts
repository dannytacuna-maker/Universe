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
  cameraPosition: [3.15, -2.35, -8.55],
  description:
    "A weekly intelligence station translating verified world developments into a concise, source-grounded briefing.",
  descriptor: "Global insight. Clear mind.",
  galaxyId: null,
  id: "global-observatory",
  name: "The Observatory",
  orientation: [0.22, -0.78, -0.1],
  palette: {
    aperture: "#e8c78a",
    beacon: "#f5f8fc",
    core: "#2a323c",
    metalDark: "#161b22",
    metalLight: "#3d4856",
    signal: "#8a96a8",
  },
  position: [0.9, -3.35, -12.2],
  scale: 2.85,
};
