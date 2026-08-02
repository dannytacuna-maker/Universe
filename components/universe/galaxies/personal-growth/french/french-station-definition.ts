import type { Vector3Tuple } from "../../galaxy-definition";

export type FrenchStationDefinition = Readonly<{
  cameraLookTarget: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  description: string;
  externalUrl: string;
  galaxyId: "personal-growth";
  id: "french-station";
  labelPosition: Readonly<{
    compact: readonly [x: number, y: number];
    desktop: readonly [x: number, y: number];
    portrait: readonly [x: number, y: number];
  }>;
  landingOrigin: Vector3Tuple;
  name: string;
  palette: Readonly<{
    accent: string;
    atmosphere: string;
    base: string;
    metal: string;
  }>;
  position: Vector3Tuple;
  seed: number;
}>;

export const lumiereStationUrl = "https://www.duolingo.com/learn";

export const frenchStationDefinition = {
  cameraLookTarget: [48, 0.65, -52.4],
  cameraPosition: [48, 0.85, -45.4],
  description:
    "An independent orbital station for French practice — opens Duolingo while you stay in Personal Growth.",
  externalUrl: lumiereStationUrl,
  galaxyId: "personal-growth",
  id: "french-station",
  labelPosition: {
    compact: [69, 29],
    desktop: [67, 29],
    portrait: [70, 31],
  },
  landingOrigin: [48, 0, -52],
  name: "Lumière Station",
  palette: {
    accent: "#83c8f2",
    atmosphere: "#405b78",
    base: "#07101a",
    metal: "#81909a",
  },
  position: [5.35, 0.25, -10.08],
  seed: 314_159,
} as const satisfies FrenchStationDefinition;
