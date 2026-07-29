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
    "A global intelligence station monitoring finite, source-grounded economic and institutional developments.",
  descriptor: "Global Intelligence Station",
  galaxyId: null,
  id: "global-observatory",
  name: "The Observatory",
  orientation: [0.12, -0.28, -0.08],
  palette: {
    aperture: "#d99b55",
    beacon: "#d8edf2",
    metalDark: "#11171d",
    metalLight: "#59636a",
    signal: "#8caeb8",
  },
  position: [0.9, -3.35, -12.2],
  scale: 0.92,
};
