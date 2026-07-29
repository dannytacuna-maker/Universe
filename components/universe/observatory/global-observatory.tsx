"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, DoubleSide, type Group, type Mesh } from "three";

import { SpatialLabelAnchor } from "../spatial-label-anchor";
import {
  globalObservatoryDefinition,
  type ObservatoryDefinition,
} from "./observatory-definition";

const EQUATOR_MODULES = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2;

  return {
    angle,
    position: [Math.cos(angle) * 0.475, 0, Math.sin(angle) * 0.475] as const,
  };
});

const RELAYS = [
  { angle: 0.35, radius: 0.72, scale: 0.82 },
  { angle: 2.48, radius: 0.79, scale: 0.64 },
  { angle: 4.64, radius: 0.68, scale: 0.72 },
] as const;

export type GlobalObservatoryProps = Readonly<{
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
  const relayOrbit = useRef<Group>(null);
  const signalDisc = useRef<Mesh>(null);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) return;

    const safeDelta = Math.min(delta, 0.075);

    if (station.current !== null) {
      station.current.rotation.y += safeDelta * 0.011;
    }

    if (relayOrbit.current !== null) {
      relayOrbit.current.rotation.z -= safeDelta * 0.007;
    }

    if (signalDisc.current !== null) {
      signalDisc.current.rotation.z += safeDelta * 0.004;
    }
  });

  const emphasis = isEmphasized ? 1 : 0;
  const palette = definition.palette;

  return (
    <group
      position={definition.position}
      rotation={definition.orientation}
      scale={definition.scale * (1 + emphasis * 0.035)}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`planet:${definition.id}`}
        enabled={isInteractive && isVisible}
      />

      <pointLight
        color="#c7dce3"
        decay={2}
        distance={3.2}
        intensity={1.75}
        position={[1.35, 1.1, 1.8]}
      />

      <group ref={station}>
        <mesh>
          <sphereGeometry args={[0.44, 52, 36]} />
          <meshStandardMaterial
            color={palette.metalDark}
            emissive="#06090c"
            emissiveIntensity={0.22}
            metalness={0.94}
            roughness={0.38}
          />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.455, 0.029, 12, 96]} />
          <meshStandardMaterial
            color={palette.metalLight}
            emissive="#121a1f"
            emissiveIntensity={0.16}
            metalness={0.96}
            roughness={0.26}
          />
        </mesh>

        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.438, 0.008, 8, 96]} />
          <meshStandardMaterial
            color="#374047"
            metalness={0.96}
            roughness={0.3}
          />
        </mesh>

        <mesh rotation={[Math.PI / 2.9, 0.08, 0.25]}>
          <torusGeometry args={[0.442, 0.006, 8, 96]} />
          <meshStandardMaterial
            color="#2c343a"
            metalness={0.94}
            roughness={0.32}
          />
        </mesh>

        {EQUATOR_MODULES.map((module, index) => (
          <group
            key={index}
            position={module.position}
            rotation={[0, -module.angle, 0]}
          >
            <mesh>
              <boxGeometry args={[0.092, 0.092, 0.042]} />
              <meshStandardMaterial
                color={index % 3 === 0 ? "#657078" : "#313a40"}
                emissive={index % 4 === 0 ? "#14242a" : "#080b0d"}
                emissiveIntensity={0.18}
                metalness={0.95}
                roughness={0.29}
              />
            </mesh>
            <mesh position={[0, 0, 0.022]}>
              <boxGeometry args={[0.054, 0.012, 0.004]} />
              <meshBasicMaterial
                color={index % 4 === 0 ? palette.beacon : palette.signal}
                opacity={0.24 + emphasis * 0.12}
                toneMapped={false}
                transparent
              />
            </mesh>
          </group>
        ))}

        <group position={[0.095, 0.055, 0.432]}>
          <mesh>
            <circleGeometry args={[0.115, 48]} />
            <meshBasicMaterial color="#010304" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <ringGeometry args={[0.116, 0.13, 64]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={palette.aperture}
              depthWrite={false}
              opacity={0.28 + emphasis * 0.14}
              toneMapped={false}
              transparent
            />
          </mesh>
          <mesh position={[0, 0, 0.003]}>
            <circleGeometry args={[0.076, 40]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={palette.aperture}
              depthWrite={false}
              opacity={0.045 + emphasis * 0.025}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>

        <group position={[-0.16, 0.43, -0.04]} rotation={[0.1, 0, -0.18]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.018, 0.22, 12]} />
            <meshStandardMaterial
              color="#707a80"
              metalness={0.96}
              roughness={0.26}
            />
          </mesh>
          <mesh position={[0, 0.125, 0]}>
            <octahedronGeometry args={[0.028, 0]} />
            <meshBasicMaterial color={palette.beacon} toneMapped={false} />
          </mesh>
        </group>
      </group>

      <group ref={relayOrbit} rotation={[Math.PI / 2.55, 0.12, -0.26]}>
        <mesh>
          <ringGeometry args={[0.69, 0.694, 144]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={palette.signal}
            depthWrite={false}
            opacity={0.065 + emphasis * 0.035}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>
        {RELAYS.map((relay) => (
          <group
            key={relay.angle}
            position={[
              Math.cos(relay.angle) * relay.radius,
              Math.sin(relay.angle) * relay.radius,
              0.014,
            ]}
            rotation={[0, 0, relay.angle]}
            scale={relay.scale}
          >
            <mesh>
              <boxGeometry args={[0.075, 0.026, 0.034]} />
              <meshStandardMaterial
                color="#606b72"
                metalness={0.95}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[-0.075, 0, 0]}>
              <boxGeometry args={[0.065, 0.045, 0.008]} />
              <meshBasicMaterial color="#243f4b" />
            </mesh>
            <mesh position={[0.075, 0, 0]}>
              <boxGeometry args={[0.065, 0.045, 0.008]} />
              <meshBasicMaterial color="#243f4b" />
            </mesh>
          </group>
        ))}
      </group>

      <mesh ref={signalDisc} rotation={[Math.PI / 2.55, 0.12, -0.26]}>
        <ringGeometry args={[0.82, 0.823, 160]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={palette.aperture}
          depthWrite={false}
          opacity={0.025 + emphasis * 0.025}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      <mesh scale={1 + emphasis * 0.04}>
        <sphereGeometry args={[0.56, 22, 14]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={palette.signal}
          depthWrite={false}
          opacity={0.012 + emphasis * 0.008}
          toneMapped={false}
          transparent
        />
      </mesh>

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
          <sphereGeometry args={[0.88, 18, 12]} />
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
