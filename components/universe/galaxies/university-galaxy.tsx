"use client";

import { ProceduralGalaxy } from "./procedural-galaxy";
import { universityGalaxyDefinition } from "./university-galaxy-definition";

type UniversityGalaxyProps = Readonly<{
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
  presence: number;
}>;

export function UniversityGalaxy(props: UniversityGalaxyProps) {
  return (
    <ProceduralGalaxy definition={universityGalaxyDefinition} {...props} />
  );
}
