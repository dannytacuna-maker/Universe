"use client";

import { PointMaterial, Points, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, type Group } from "three";

import type { GalaxyDefinition } from "./galaxy-definition";
import {
  createProceduralGalaxyData,
  type GalaxyParticleLayer,
} from "./procedural-galaxy-data";

type ProceduralGalaxyProps = Readonly<{
  definition: GalaxyDefinition;
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
  presence: number;
}>;

type ParticleLayerProps = Readonly<{
  data: GalaxyParticleLayer;
  opacity: number;
  size: number;
}>;

function ParticleLayer({ data, opacity, size }: ParticleLayerProps) {
  return (
    <Points colors={data.colors} positions={data.positions}>
      <PointMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        opacity={opacity}
        size={size}
        sizeAttenuation
        toneMapped={false}
        transparent
        vertexColors
      />
    </Points>
  );
}

export function ProceduralGalaxy({
  definition,
  isEmphasized,
  isHovered,
  isInteractive,
  motionEnabled,
  onActivate,
  onHoverChange,
  presence,
}: ProceduralGalaxyProps) {
  const rotatingGroup = useRef<Group>(null);
  const data = useMemo(
    () => createProceduralGalaxyData(definition),
    [definition],
  );

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (!motionEnabled || rotatingGroup.current === null) {
      return;
    }

    rotatingGroup.current.rotation.z +=
      Math.min(delta, 0.075) * definition.rotationSpeed;
  });

  const clarity = isEmphasized ? 1 : 0;
  const particleSizeScale = Math.max(0.28, Math.sqrt(presence));

  return (
    <group
      position={definition.position}
      rotation={definition.orientation}
      scale={definition.scale}
    >
      <group ref={rotatingGroup}>
        <ParticleLayer
          data={data.halo}
          opacity={(0.2 + clarity * 0.04) * presence}
          size={0.014 * particleSizeScale}
        />
        <ParticleLayer
          data={data.arms}
          opacity={(0.64 + clarity * 0.08) * presence}
          size={0.023 * particleSizeScale}
        />
        <ParticleLayer
          data={data.core}
          opacity={(0.78 + clarity * 0.08) * presence}
          size={0.032 * particleSizeScale}
        />

        <mesh scale={[0.24, 0.24, 0.1]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#d5eaff"
            depthWrite={false}
            opacity={(0.045 + clarity * 0.012) * presence}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>

      {isInteractive ? (
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            onActivate();
          }}
          onPointerOut={(event) => {
            event.stopPropagation();
            onHoverChange(false);
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHoverChange(true);
          }}
        >
          <sphereGeometry
            args={[definition.particleDistribution.radius * 1.12, 14, 10]}
          />
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
