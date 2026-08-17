import type { ForgeSystemDefinition } from "./forge-system-definition";

export const forgeSystems = [
  {
    cameraPosition: [-9.3, -2.05, -9.55],
    description:
      "A solar system for the live sites you ship — launch each site or open its Vercel deployment controls.",
    displayName: "Websites",
    id: "websites",
    labelPosition: {
      compact: [50, 48],
      desktop: [50, 48],
      portrait: [50, 49],
    },
    name: "Websites",
    palette: {
      core: "#f5f8ff",
      halo: "#7899d6",
      orbit: "#34588c",
    },
    position: [-9.35, -2.65, -14.45],
    scale: 1.06,
    seed: 902_117,
    status: "explorable",
  },
] as const satisfies readonly ForgeSystemDefinition[];

export const websitesSystem = forgeSystems[0];
