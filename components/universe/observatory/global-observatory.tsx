"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  type Mesh,
  type PointLight,
} from "three";

import { SpatialLabelAnchor } from "../spatial-label-anchor";
import {
  globalObservatoryDefinition,
  type ObservatoryDefinition,
} from "./observatory-definition";

function buildWindowLights() {
  const lights: Array<
    Readonly<{ position: readonly [number, number, number] }>
  > = [];

  for (let band = 0; band < 7; band += 1) {
    const y = -0.52 + band * 0.15;
    const radius = Math.sqrt(Math.max(0.04, 0.78 * 0.78 - y * y));
    const count = 18 + (band % 3) * 4;
    for (let index = 0; index < count; index += 1) {
      if ((index + band) % 5 === 0) continue;
      const angle = (index / count) * Math.PI * 2 + band * 0.08;
      lights.push({
        position: [
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius,
        ] as const,
      });
    }
  }

  for (let index = 0; index < 36; index += 1) {
    if (index % 4 === 0) continue;
    const angle = (index / 36) * Math.PI * 2;
    lights.push({
      position: [
        Math.cos(angle) * 1.08,
        0.02 + (index % 3) * 0.04 - 0.04,
        Math.sin(angle) * 1.08,
      ] as const,
    });
  }

  return lights;
}

function buildRingModules() {
  return Array.from({ length: 16 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 2;
    return {
      angle,
      position: [Math.cos(angle) * 1.05, 0, Math.sin(angle) * 1.05] as const,
    };
  });
}

function buildPanelSeams() {
  return Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2;
    return {
      angle,
      position: [
        Math.cos(angle) * 0.795,
        0.08,
        Math.sin(angle) * 0.795,
      ] as const,
    };
  });
}

const windowLights = buildWindowLights();
const ringModules = buildRingModules();
const panelSeams = buildPanelSeams();

export type GlobalObservatoryProps = Readonly<{
  briefingPulse?: number;
  definition?: ObservatoryDefinition;
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function GlobalObservatory({
  briefingPulse = 0,
  definition = globalObservatoryDefinition,
  isEmphasized,
  isHovered,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
}: GlobalObservatoryProps) {
  const station = useRef<Group>(null);
  const root = useRef<Group>(null);
  const rimLight = useRef<PointLight>(null);
  const beacon = useRef<Mesh>(null);
  const pulsePhase = useRef(0);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  const emphasis = isEmphasized ? 1 : 0;
  const hoverLift = isHovered ? 0.08 : 0;
  const palette = definition.palette;

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) return;

    const safeDelta = Math.min(delta, 0.075);

    if (station.current !== null) {
      station.current.rotation.y += safeDelta * 0.0045;
    }

    const pulse =
      briefingPulse > 0.05
        ? (0.5 + 0.5 * Math.sin(pulsePhase.current)) * briefingPulse
        : 0;

    if (briefingPulse > 0.05) {
      pulsePhase.current += safeDelta * (1.2 + briefingPulse * 1.4);
    }

    if (root.current !== null) {
      root.current.scale.setScalar(
        definition.scale *
          (1 + emphasis * 0.03 + hoverLift * 0.012 + pulse * 0.02),
      );
    }

    if (rimLight.current !== null) {
      rimLight.current.intensity = 1.1 + emphasis * 0.35 + pulse * 0.4;
    }

    if (beacon.current !== null) {
      const material = beacon.current.material;
      if (!Array.isArray(material) && "opacity" in material) {
        material.opacity = 0.35 + pulse * 0.35 + emphasis * 0.1;
      }
    }
  });

  return (
    <group
      position={definition.position}
      ref={root}
      rotation={definition.orientation}
      scale={definition.scale * (1 + emphasis * 0.03 + hoverLift * 0.012)}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`planet:${definition.id}`}
        enabled={isInteractive && isVisible}
      />

      {/* Cool rim from above-left — cinematic, not neon */}
      <pointLight
        color="#c8d4e4"
        decay={2}
        distance={6.5}
        intensity={1.15 + emphasis * 0.35}
        position={[-1.6, 2.1, 1.8]}
        ref={rimLight}
      />
      <pointLight
        color="#f0d8a8"
        decay={2}
        distance={3.8}
        intensity={0.55}
        position={[0.2, 0.05, 1.4]}
      />

      <group ref={station}>
        {/* Main habitat sphere — dark gunmetal */}
        <mesh>
          <sphereGeometry args={[0.78, 64, 48]} />
          <meshStandardMaterial
            color="#12161c"
            emissive="#07090c"
            emissiveIntensity={0.18}
            metalness={0.92}
            roughness={0.48}
          />
        </mesh>

        {/* Upper dome plating — slightly lighter rim catch */}
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry
            args={[0.782, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.15]}
          />
          <meshStandardMaterial
            color="#1a2028"
            emissive="#0a0e14"
            emissiveIntensity={0.12}
            metalness={0.94}
            roughness={0.4}
          />
        </mesh>

        {/* Equatorial groove */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.012, 8, 96]} />
          <meshStandardMaterial
            color="#0a0c10"
            metalness={0.9}
            roughness={0.55}
          />
        </mesh>

        {/* Thick structural ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.05, 0.11, 16, 96]} />
          <meshStandardMaterial
            color="#161b22"
            emissive="#080a0e"
            emissiveIntensity={0.15}
            metalness={0.93}
            roughness={0.42}
          />
        </mesh>

        {/* Ring outer rail */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.15, 0.028, 10, 96]} />
          <meshStandardMaterial
            color="#222830"
            metalness={0.95}
            roughness={0.34}
          />
        </mesh>

        {ringModules.map((module) => (
          <group
            key={module.angle}
            position={module.position}
            rotation={[0, -module.angle, 0]}
          >
            <mesh>
              <boxGeometry args={[0.22, 0.14, 0.12]} />
              <meshStandardMaterial
                color="#14181f"
                metalness={0.92}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0.12, 0.09, 0]}>
              <boxGeometry args={[0.04, 0.05, 0.03]} />
              <meshStandardMaterial
                color="#1c222a"
                metalness={0.9}
                roughness={0.36}
              />
            </mesh>
            {(module.angle * 10) % 3 < 1.2 ? (
              <mesh position={[0.14, 0.16, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.18, 6]} />
                <meshStandardMaterial
                  color={palette.metalLight}
                  metalness={0.95}
                  roughness={0.28}
                />
              </mesh>
            ) : null}
          </group>
        ))}

        {/* Panel seam ribs */}
        {panelSeams.map((seam) => (
          <mesh
            key={seam.angle}
            position={seam.position}
            rotation={[0, -seam.angle, 0]}
          >
            <boxGeometry args={[0.012, 0.55, 0.02]} />
            <meshStandardMaterial
              color="#0c0e12"
              metalness={0.88}
              roughness={0.55}
            />
          </mesh>
        ))}

        {/* Warm inhabited windows — discrete emissive points */}
        {windowLights.map((light, index) => (
          <mesh
            key={`${light.position[0]}-${light.position[1]}-${index}`}
            position={light.position}
          >
            <boxGeometry args={[0.028, 0.016, 0.01]} />
            <meshBasicMaterial
              color={index % 7 === 0 ? "#e8c98a" : "#d4b87a"}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* Soft warm fill from windows — restrained */}
        <mesh>
          <sphereGeometry args={[0.79, 32, 24]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#c9a86a"
            depthWrite={false}
            opacity={0.025 + emphasis * 0.012}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>

        {/* Lower docking collar */}
        <mesh position={[0, -0.72, 0]}>
          <cylinderGeometry args={[0.22, 0.28, 0.14, 24]} />
          <meshStandardMaterial
            color="#10141a"
            metalness={0.92}
            roughness={0.45}
          />
        </mesh>

        {/* Tall antenna mast */}
        <group position={[0, 0.78, 0]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.02, 0.95, 10]} />
            <meshStandardMaterial
              color="#2a313a"
              metalness={0.96}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.08, 0.03, 0.03]} />
            <meshStandardMaterial
              color="#1a1f26"
              metalness={0.94}
              roughness={0.32}
            />
          </mesh>
          <mesh position={[0.06, 0.38, 0]} rotation={[0, 0, Math.PI / 2.5]}>
            <cylinderGeometry args={[0.035, 0.035, 0.008, 16]} />
            <meshStandardMaterial
              color="#252b34"
              metalness={0.95}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.022, 12, 10]} />
            <meshBasicMaterial color="#f4f7fb" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.5, 0]} ref={beacon}>
            <sphereGeometry args={[0.055, 12, 10]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color="#eef3f8"
              depthWrite={false}
              opacity={0.35}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>
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
          <sphereGeometry args={[1.25, 18, 12]} />
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
