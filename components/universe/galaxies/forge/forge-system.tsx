"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import { SpatialLabelAnchor } from "../../spatial-label-anchor";
import { SystemStellarCore } from "../system-stellar-core";
import { FirmusSystemField } from "./firmus-system-field";
import type { ForgeSystemDefinition } from "./forge-system-definition";

type ForgeSystemProps = Readonly<{
  definition: ForgeSystemDefinition;
  isActive: boolean;
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: (systemId: string) => void;
  onHoverChange: (systemId: string | null) => void;
}>;

export function ForgeSystem({
  definition,
  isActive,
  isEmphasized,
  isHovered,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
}: ForgeSystemProps) {
  const orbitalGroup = useRef<Group>(null);
  const isExplorable = definition.status === "explorable";
  const emphasis = isEmphasized ? 1 : 0;

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible || orbitalGroup.current === null) {
      return;
    }

    orbitalGroup.current.rotation.z +=
      Math.min(delta, 0.075) * (isExplorable ? 0.0034 : 0.0015);
  });

  return (
    <group
      position={definition.position}
      scale={definition.scale}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`system:${definition.id}`}
        enabled={isInteractive && isVisible}
      />

      <SystemStellarCore
        activity={0.42 + emphasis * 0.2}
        coreColor={definition.palette.core}
        emphasis={emphasis}
        haloColor={definition.palette.halo}
        radius={isActive && isExplorable ? 0.115 : isExplorable ? 0.048 : 0.032}
      />

      <group ref={orbitalGroup} scale={isActive ? 3 : 1}>
        <FirmusSystemField activity={0.45} emphasis={emphasis} />
      </group>

      {isInteractive ? (
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            onActivate(definition.id);
          }}
          onPointerOut={(event) => {
            event.stopPropagation();
            onHoverChange(null);
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHoverChange(definition.id);
          }}
        >
          <sphereGeometry args={[isExplorable ? 0.36 : 0.25, 12, 8]} />
          <meshBasicMaterial
            colorWrite={false}
            depthWrite={false}
            opacity={0}
            transparent
          />
        </mesh>
      ) : null}
    </group>
  );
}
