"use client";

import { personalGrowthGalaxyId } from "../../universe-destinations";
import { ProceduralGalaxy } from "../procedural-galaxy";
import { personalGrowthGalaxyDefinition } from "./personal-growth-galaxy-definition";

type PersonalGrowthGalaxyProps = Readonly<{
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
  presence: number;
}>;

export function PersonalGrowthGalaxy(props: PersonalGrowthGalaxyProps) {
  return (
    <ProceduralGalaxy
      definition={personalGrowthGalaxyDefinition}
      labelAnchorId={`galaxy:${personalGrowthGalaxyId}`}
      {...props}
    />
  );
}
