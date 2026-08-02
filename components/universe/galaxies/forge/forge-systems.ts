import type { ForgeSystemDefinition } from "./forge-system-definition";

export const forgeSystems = [
  {
    cameraPosition: [-9.35, -2.15, -9.75],
    description:
      "Firmus landing and venture workspace — briefs, assets, and ship decisions.",
    displayName: "Firmus",
    id: "firmus",
    labelPosition: {
      compact: [48, 52],
      desktop: [50, 50],
      portrait: [49, 51],
    },
    name: "Firmus",
    palette: {
      core: "#fff4ef",
      halo: "#e85a4f",
      orbit: "#a83228",
    },
    position: [-9.35, -2.65, -14.55],
    scale: 1,
    seed: 314_159,
    status: "explorable",
  },
] as const satisfies readonly ForgeSystemDefinition[];

export const firmusSystem = forgeSystems[0];
