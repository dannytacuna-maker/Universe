"use client";

import { forgeGalaxyId } from "../../universe-destinations";
import { ProceduralGalaxy } from "../procedural-galaxy";
import { forgeGalaxyDefinition } from "./forge-galaxy-definition";

type ForgeGalaxyProps = Readonly<{
  attention?: number;
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
  presence: number;
}>;

export function ForgeGalaxy(props: ForgeGalaxyProps) {
  return (
    <ProceduralGalaxy
      definition={forgeGalaxyDefinition}
      labelAnchorId={`galaxy:${forgeGalaxyId}`}
      {...props}
    />
  );
}
