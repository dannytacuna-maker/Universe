"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import { SystemStellarCore } from "../system-stellar-core";
import type { JiuJitsuProgress } from "./jiu-jitsu/jiu-jitsu-progress";
import { JiuJitsuSystemField } from "./jiu-jitsu/jiu-jitsu-system-field";
import type { PersonalGrowthSystemDefinition } from "./personal-growth-system-definition";
import type { StrengthProgress } from "./strength-physique/strength-physique-progress";
import { StrengthPhysiqueSystemField } from "./strength-physique/strength-physique-system-field";

type PersonalGrowthSystemProps = Readonly<{
  definition: PersonalGrowthSystemDefinition;
  isActive: boolean;
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  isVisible: boolean;
  jiuJitsuProgress: JiuJitsuProgress;
  motionEnabled: boolean;
  onActivate: (systemId: string) => void;
  onHoverChange: (systemId: string | null) => void;
  strengthProgress: StrengthProgress;
}>;

export function PersonalGrowthSystem({
  definition,
  isActive,
  isEmphasized,
  isHovered,
  isInteractive,
  isVisible,
  jiuJitsuProgress,
  motionEnabled,
  onActivate,
  onHoverChange,
  strengthProgress,
}: PersonalGrowthSystemProps) {
  const orbitalGroup = useRef<Group>(null);
  const isExplorable = definition.status === "explorable";
  const isJiuJitsu = definition.id === "jiu-jitsu";
  const isStrengthPhysique = definition.id === "strength-physique";
  const emphasis = isEmphasized ? 1 : 0;
  const activeScale = isActive && isExplorable ? 1.62 : 1;
  const recentAttention = isJiuJitsu
    ? jiuJitsuProgress.recentAttention
    : isStrengthPhysique
      ? strengthProgress.weeklyCompletionRatio
      : 0;

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible || orbitalGroup.current === null) {
      return;
    }

    orbitalGroup.current.rotation.z +=
      Math.min(delta, 0.075) * (isExplorable ? 0.003 : 0.0015);
  });

  return (
    <group
      position={definition.position}
      scale={definition.scale * activeScale}
      visible={isVisible}
    >
      <SystemStellarCore
        activity={recentAttention}
        coreColor={definition.palette.core}
        emphasis={emphasis}
        haloColor={definition.palette.halo}
        radius={isExplorable ? 0.029 : 0.022}
      />

      <group ref={orbitalGroup}>
        {isJiuJitsu ? (
          <JiuJitsuSystemField
            emphasis={emphasis}
            progress={jiuJitsuProgress}
          />
        ) : isStrengthPhysique ? (
          <StrengthPhysiqueSystemField
            emphasis={emphasis}
            progress={strengthProgress}
          />
        ) : (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.16, 0.1625, 72]} />
            <meshBasicMaterial
              color={definition.palette.orbit}
              depthWrite={false}
              opacity={0.1 + emphasis * 0.06}
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
