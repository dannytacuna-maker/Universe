"use client";

import { PointMaterial, Points, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, type Group } from "three";

import type { GalaxyDefinition } from "./galaxy-definition";
import { GalaxyLuminousVeil } from "./galaxy-luminous-veil";
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
        <GalaxyLuminousVeil
          definition={definition}
          emphasis={clarity}
          presence={presence}
        />
        <ParticleLayer
          data={data.halo}
          opacity={(0.2 + clarity * 0.045) * presence}
          size={0.017 * particleSizeScale}
        />
        <ParticleLayer
          data={data.dust}
          opacity={(0.14 + clarity * 0.03) * presence}
          size={0.046 * particleSizeScale}
        />
        <ParticleLayer
          data={data.arms}
          opacity={(0.58 + clarity * 0.09) * presence}
          size={0.028 * particleSizeScale}
        />
        <ParticleLayer
          data={data.beacons}
          opacity={(0.74 + clarity * 0.12) * presence}
          size={0.045 * particleSizeScale}
        />
        <ParticleLayer
          data={data.core}
          opacity={(0.72 + clarity * 0.08) * presence}
          size={0.037 * particleSizeScale}
        />

        <mesh
          scale={
            definition.morphology === "grand-design"
              ? [0.42, 0.15, 0.16]
              : [0.31, 0.25, 0.19]
          }
        >
          <sphereGeometry args={[1, 18, 12]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={
              definition.morphology === "grand-design" ? "#d5eaff" : "#ffe3ad"
            }
            depthWrite={false}
            opacity={(0.11 + clarity * 0.022) * presence}
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
