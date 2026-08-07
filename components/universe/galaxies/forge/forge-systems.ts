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
  {
    cameraPosition: [-7.55, -1.55, -9.15],
    description:
      "Delicias Típicas La Sancarlena — the live public site for the food venture.",
    displayName: "Delicias",
    id: "delicias",
    labelPosition: {
      compact: [62, 38],
      desktop: [64, 36],
      portrait: [63, 37],
    },
    name: "Delicias",
    palette: {
      core: "#fff8e8",
      halo: "#e8a03a",
      orbit: "#a85a1a",
    },
    position: [-7.55, -1.85, -13.65],
    scale: 0.94,
    seed: 577_215,
    status: "explorable",
  },
] as const satisfies readonly ForgeSystemDefinition[];

export const firmusSystem = forgeSystems[0];
export const deliciasSystem = forgeSystems[1];
