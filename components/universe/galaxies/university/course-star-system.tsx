"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, type Group } from "three";

import type { CourseSystemDefinition } from "./course-system-definition";
import { LogisticsOrbitalField } from "./logistics-orbital-field";
import { StellarGlow } from "./stellar-glow";

type CourseStarSystemProps = Readonly<{
  definition: CourseSystemDefinition;
  isActive: boolean;
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: (courseId: string) => void;
  onHoverChange: (courseId: string | null) => void;
}>;

export function CourseStarSystem({
  definition,
  isActive,
  isEmphasized,
  isHovered,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
}: CourseStarSystemProps) {
  const orbitalGroup = useRef<Group>(null);
  const isExplorable = definition.status === "explorable";
  const presence = isVisible ? 1 : 0;
  const emphasis = isEmphasized ? 1 : 0;
  const activeScale = isActive && isExplorable ? 1.55 : 1;
  const activeGlow = isActive ? 0.055 : 0;

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (
      !motionEnabled ||
      !isExplorable ||
      !isVisible ||
      orbitalGroup.current === null
    ) {
      return;
    }

    orbitalGroup.current.rotation.z += Math.min(delta, 0.075) * 0.004;
  });

  return (
    <group
      position={definition.position}
      scale={definition.scale * activeScale}
      visible={isVisible}
    >
      <mesh>
        <sphereGeometry args={[isExplorable ? 0.02 : 0.018, 18, 14]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={definition.palette.core}
          opacity={presence * (0.8 + emphasis * 0.12)}
          toneMapped={false}
          transparent
        />
      </mesh>

      <StellarGlow
        color={definition.palette.halo}
        opacity={
          presence *
          (isExplorable
            ? 0.075 + emphasis * 0.025 + activeGlow
            : 0.035 + emphasis * 0.015)
        }
        radius={isExplorable ? 0.072 : 0.052}
      />
      <StellarGlow
        color={definition.palette.orbit}
        opacity={
          presence *
          (isExplorable
            ? 0.022 + emphasis * 0.01 + activeGlow * 0.45
            : 0.009 + emphasis * 0.006)
        }
        radius={isExplorable ? 0.14 : 0.09}
      />

      {!isExplorable ? (
        <mesh scale={0.78}>
          <sphereGeometry args={[0.078, 16, 12]} />
          <meshBasicMaterial
            color={definition.palette.halo}
            depthWrite={false}
            opacity={presence * (0.018 + emphasis * 0.014)}
            toneMapped={false}
            transparent
          />
        </mesh>
      ) : null}

      <group ref={orbitalGroup} rotation={[0.18, 0.05, -0.16]}>
        {isExplorable ? (
          <LogisticsOrbitalField
            opacity={presence * (0.46 + emphasis * 0.1)}
            schedule={definition.schedule}
            seed={definition.seed}
          />
        ) : (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.16, 0.164, 64]} />
            <meshBasicMaterial
              color={definition.palette.orbit}
              depthWrite={false}
              opacity={presence * (0.12 + emphasis * 0.06)}
              toneMapped={false}
              transparent
            />
          </mesh>
        )}
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
          <sphereGeometry args={[isExplorable ? 0.34 : 0.25, 12, 8]} />
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
