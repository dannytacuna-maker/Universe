import type { Vector3Tuple } from "../galaxies/galaxy-definition";

export type ObservatoryPalette = Readonly<{
  aperture: string;
  beacon: string;
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
  descriptor: "Weekly World Intelligence",
  galaxyId: null,
  id: "global-observatory",
  name: "The Observatory",
  orientation: [0.12, -0.28, -0.08],
  palette: {
    aperture: "#efad60",
    beacon: "#effcff",
    metalDark: "#202a32",
    metalLight: "#84939d",
    signal: "#b8dce5",
  },
  position: [0.9, -3.35, -12.2],
  scale: 1.02,
};
