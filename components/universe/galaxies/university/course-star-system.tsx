"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import type { UniverseActivitySignal } from "../../universe-activity";
import { SpatialLabelAnchor } from "../../spatial-label-anchor";
import { SystemStellarCore } from "../system-stellar-core";
import type { CourseSystemDefinition } from "./course-system-definition";
import { LogisticsOrbitalField } from "./logistics-orbital-field";
import { MappedCourseSystemField } from "./mapped-course-system-field";

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
  signal: UniverseActivitySignal;
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
  signal,
}: CourseStarSystemProps) {
  const orbitalGroup = useRef<Group>(null);
  const isExplorable = definition.status === "explorable";
  const hasSchedule = definition.schedule.length > 0;
  const presence = isVisible ? 1 : 0;
  const emphasis = isEmphasized ? 1 : 0;
  const activeGlow =
    (isActive ? 0.055 : 0) + signal.activity * 0.7 + signal.attention * 0.16;

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
      scale={definition.scale}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`system:${definition.id}`}
        enabled={isInteractive && isVisible}
      />

      <SystemStellarCore
        activity={activeGlow}
        coreColor={definition.palette.core}
        emphasis={emphasis * presence}
        haloColor={definition.palette.halo}
        radius={isActive && isExplorable ? 0.12 : isExplorable ? 0.047 : 0.031}
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

      <group
        ref={orbitalGroup}
        rotation={[0.18, 0.05, -0.16]}
        scale={isActive ? 3.05 : 1}
      >
        {isExplorable && hasSchedule ? (
          <LogisticsOrbitalField
            haloColor={definition.palette.halo}
            opacity={presence * (0.46 + emphasis * 0.1)}
            orbitColor={definition.palette.orbit}
            schedule={definition.schedule}
            seed={definition.seed}
          />
        ) : (
          <MappedCourseSystemField
            emphasis={emphasis * presence}
            haloColor={definition.palette.halo}
            orbitColor={definition.palette.orbit}
            seed={definition.seed}
          />
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
