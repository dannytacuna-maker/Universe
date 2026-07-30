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
import { ObservatoryCrystallineCore } from "./observatory-visuals";

const PERIMETER_LIGHT_COUNT = 12;
const SUPPORT_COUNT = 4;

const perimeterLights = Array.from(
  { length: PERIMETER_LIGHT_COUNT },
  (_, index) => {
    const angle = (index / PERIMETER_LIGHT_COUNT) * Math.PI * 2;
    return {
      angle,
      position: [Math.cos(angle) * 0.92, 0.08, Math.sin(angle) * 0.92] as const,
    };
  },
);

const supportLegs = Array.from({ length: SUPPORT_COUNT }, (_, index) => {
  const angle = (index / SUPPORT_COUNT) * Math.PI * 2 + Math.PI / 4;
  return {
    angle,
    position: [Math.cos(angle) * 0.58, -0.42, Math.sin(angle) * 0.58] as const,
  };
});

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
  const coreLight = useRef<PointLight>(null);
  const pulseGlow = useRef<Mesh>(null);
  const pulsePhase = useRef(0);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  const emphasis = isEmphasized ? 1 : 0;
  const hoverLift = isHovered ? 0.12 : 0;
  const palette = definition.palette;
  const presence = 0.9 + emphasis * 0.1 + hoverLift;

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) return;

    const safeDelta = Math.min(delta, 0.075);

    if (station.current !== null) {
      station.current.rotation.y += safeDelta * 0.007;
    }

    const pulse =
      briefingPulse > 0.05
        ? (0.5 + 0.5 * Math.sin(pulsePhase.current)) * briefingPulse
        : 0;

    if (briefingPulse > 0.05) {
      pulsePhase.current += safeDelta * (1.4 + briefingPulse * 1.8);
    }

    if (root.current !== null) {
      const nextScale =
        definition.scale *
        (1 + emphasis * 0.04 + hoverLift * 0.015 + pulse * 0.03);
      root.current.scale.setScalar(nextScale);
    }

    if (coreLight.current !== null) {
      coreLight.current.intensity = 3.4 + emphasis * 1.1 + pulse * 0.9;
    }

    if (pulseGlow.current !== null) {
      const material = pulseGlow.current.material;
      if (!Array.isArray(material) && "opacity" in material) {
        material.opacity = 0.04 + pulse * 0.1;
      }
    }
  });

  return (
    <group
      position={definition.position}
      ref={root}
      rotation={definition.orientation}
      scale={definition.scale * (1 + emphasis * 0.04 + hoverLift * 0.015)}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`planet:${definition.id}`}
        enabled={isInteractive && isVisible}
      />

      <pointLight
        color={palette.core}
        decay={2}
        distance={5.2}
        intensity={3.4 + emphasis * 1.1}
        position={[0.15, 0.75, 1.35]}
        ref={coreLight}
      />
      <pointLight
        color={palette.aperture}
        decay={2}
        distance={4.2}
        intensity={1.45 + emphasis * 0.5}
        position={[-0.9, 0.2, 0.85]}
      />
      <pointLight
        color={palette.beacon}
        decay={2}
        distance={3.4}
        intensity={0.85}
        position={[0.05, 1.65, 0.1]}
      />

      <group ref={station}>
        {/* Habitat drum */}
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.72, 0.78, 0.55, 48]} />
          <meshStandardMaterial
            color={palette.metalDark}
            emissive="#0a1218"
            emissiveIntensity={0.28}
            metalness={0.96}
            roughness={0.34}
          />
        </mesh>

        {/* Mid belt */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.74, 0.74, 0.08, 48]} />
          <meshStandardMaterial
            color={palette.metalLight}
            emissive="#152028"
            emissiveIntensity={0.22}
            metalness={0.97}
            roughness={0.22}
          />
        </mesh>

        {/* Central dome */}
        <mesh position={[0, 0.34, 0]}>
          <sphereGeometry
            args={[0.58, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial
            color="#1a2834"
            emissive={palette.signal}
            emissiveIntensity={0.08 + emphasis * 0.05}
            metalness={0.88}
            roughness={0.28}
          />
        </mesh>

        {/* Dome window band */}
        <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.018, 10, 64]} />
          <meshStandardMaterial
            color={palette.metalLight}
            emissive="#18242c"
            emissiveIntensity={0.35}
            metalness={0.96}
            roughness={0.2}
          />
        </mesh>

        {/* Interior aperture glow under dome glass */}
        <mesh position={[0, 0.36, 0]}>
          <sphereGeometry
            args={[0.34, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2.2]}
          />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={palette.core}
            depthWrite={false}
            opacity={0.12 + emphasis * 0.06}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>

        <group position={[0, 0.22, 0]}>
          <ObservatoryCrystallineCore
            apertureColor={palette.aperture}
            coreColor={palette.core}
            opacity={presence}
            radius={0.14}
            signalColor={palette.signal}
          />
        </group>

        {/* Structural habitat ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.92, 0.045, 14, 96]} />
          <meshStandardMaterial
            color={palette.metalLight}
            emissive="#18242c"
            emissiveIntensity={0.28}
            metalness={0.97}
            roughness={0.24}
          />
        </mesh>

        {/* Ring edge accent */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.92, 0.008, 8, 96]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={palette.signal}
            depthWrite={false}
            opacity={0.22 + emphasis * 0.1}
            toneMapped={false}
            transparent
          />
        </mesh>

        {perimeterLights.map((light, index) => (
          <group
            key={light.angle}
            position={light.position}
            rotation={[0, -light.angle, 0]}
          >
            <mesh>
              <boxGeometry args={[0.07, 0.04, 0.05]} />
              <meshStandardMaterial
                color={palette.metalDark}
                metalness={0.95}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[0.045, 0.018, 0.028]} />
              <meshBasicMaterial
                color={index % 3 === 0 ? palette.aperture : palette.beacon}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0, 0.035, 0]}>
              <sphereGeometry args={[0.028, 10, 8]} />
              <meshBasicMaterial
                blending={AdditiveBlending}
                color={index % 3 === 0 ? palette.aperture : palette.beacon}
                depthWrite={false}
                opacity={0.18 + emphasis * 0.1}
                toneMapped={false}
                transparent
              />
            </mesh>
          </group>
        ))}

        {supportLegs.map((leg) => (
          <group key={leg.angle} position={leg.position}>
            <mesh rotation={[0.35, -leg.angle, 0.18]}>
              <cylinderGeometry args={[0.02, 0.028, 0.55, 8]} />
              <meshStandardMaterial
                color={palette.metalLight}
                metalness={0.96}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, -0.28, 0]}>
              <boxGeometry args={[0.1, 0.035, 0.1]} />
              <meshStandardMaterial
                color={palette.metalDark}
                metalness={0.94}
                roughness={0.34}
              />
            </mesh>
          </group>
        ))}

        {/* Lower disc platform */}
        <mesh position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.48, 0.52, 0.06, 40]} />
          <meshStandardMaterial
            color={palette.metalDark}
            emissive="#0a1218"
            emissiveIntensity={0.2}
            metalness={0.95}
            roughness={0.36}
          />
        </mesh>

        {/* Tall antenna mast */}
        <group position={[0.02, 0.55, 0.02]}>
          <mesh>
            <cylinderGeometry args={[0.018, 0.028, 1.15, 12]} />
            <meshStandardMaterial
              color={palette.metalLight}
              metalness={0.97}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.12, 0.04, 0.04]} />
            <meshStandardMaterial
              color={palette.metalDark}
              metalness={0.95}
              roughness={0.26}
            />
          </mesh>
          <mesh position={[0.09, 0.42, 0]} rotation={[0, 0, Math.PI / 2.4]}>
            <cylinderGeometry args={[0.055, 0.055, 0.012, 24]} />
            <meshStandardMaterial
              color={palette.metalLight}
              metalness={0.96}
              roughness={0.22}
            />
          </mesh>
          <mesh position={[-0.08, 0.58, 0]} rotation={[0.2, 0, -Math.PI / 2.6]}>
            <cylinderGeometry args={[0.04, 0.04, 0.01, 20]} />
            <meshStandardMaterial
              color={palette.metalLight}
              metalness={0.96}
              roughness={0.22}
            />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <octahedronGeometry args={[0.042, 0]} />
            <meshBasicMaterial color={palette.beacon} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.62, 0]} ref={pulseGlow}>
            <sphereGeometry args={[0.08, 14, 10]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={palette.beacon}
              depthWrite={false}
              opacity={0.14 + emphasis * 0.08}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>

        {/* Side aperture / sensor eye */}
        <group position={[-0.55, 0.05, 0.48]} rotation={[0, 0.65, 0]}>
          <mesh>
            <circleGeometry args={[0.11, 40]} />
            <meshBasicMaterial color="#020508" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <ringGeometry args={[0.11, 0.128, 48]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={palette.aperture}
              depthWrite={false}
              opacity={0.5 + emphasis * 0.16}
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
          <sphereGeometry args={[1.15, 18, 12]} />
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
