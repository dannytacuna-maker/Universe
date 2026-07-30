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

const TITANIUM = "#2a323c";
const TITANIUM_LIGHT = "#3d4856";
const GRAPHITE = "#161b22";
const GRAPHITE_SOFT = "#1e252e";
const WINDOW_WARM = "#e8c78a";
const WINDOW_WARM_SOFT = "#d4b06a";
const SOLAR_FACE = "#243044";
const SOLAR_CELL = "#31425a";
const BEACON = "#f5f8fc";

function Metal({
  color = TITANIUM,
  roughness = 0.38,
  metalness = 0.92,
  emissive = "#0a0e14",
  emissiveIntensity = 0.22,
}: Readonly<{
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
}>) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      metalness={metalness}
      roughness={roughness}
    />
  );
}

function WindowPane({
  args,
  position,
  rotation,
  soft = false,
}: Readonly<{
  args: readonly [number, number, number];
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  soft?: boolean;
}>) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[...args]} />
      <meshBasicMaterial
        color={soft ? WINDOW_WARM_SOFT : WINDOW_WARM}
        toneMapped={false}
      />
    </mesh>
  );
}

function TrussBay({
  length,
  position,
  rotation,
}: Readonly<{
  length: number;
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
}>) {
  const half = length * 0.5;
  const rail = 0.028;

  return (
    <group position={position} rotation={rotation}>
      {(
        [
          [0, rail, rail],
          [0, rail, -rail],
          [0, -rail, rail],
          [0, -rail, -rail],
        ] as const
      ).map((offset) => (
        <mesh key={`${offset[1]}-${offset[2]}`} position={offset}>
          <boxGeometry args={[length, 0.012, 0.012]} />
          <Metal color={TITANIUM_LIGHT} roughness={0.36} />
        </mesh>
      ))}
      {[-half + 0.08, 0, half - 0.08].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.012, rail * 2, 0.012]} />
            <Metal color={GRAPHITE_SOFT} roughness={0.48} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.012, rail * 2, 0.012]} />
            <Metal color={GRAPHITE_SOFT} roughness={0.48} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SolarWing({
  position,
  side,
}: Readonly<{
  position: readonly [number, number, number];
  side: 1 | -1;
}>) {
  return (
    <group position={position}>
      <mesh position={[side * 0.22, 0, 0]}>
        <boxGeometry args={[0.44, 0.04, 0.05]} />
        <Metal color={TITANIUM} roughness={0.36} />
      </mesh>
      {[0.5, 0.96, 1.42].map((x, index) => (
        <group key={x} position={[side * x, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 0.014, 0.72]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? SOLAR_FACE : SOLAR_CELL}
              emissive="#101828"
              emissiveIntensity={0.16}
              metalness={0.58}
              roughness={0.55}
              side={DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.009, 0]}>
            <boxGeometry args={[0.37, 0.002, 0.68]} />
            <meshStandardMaterial
              color="#3a4e6a"
              metalness={0.72}
              roughness={0.32}
              side={DoubleSide}
            />
          </mesh>
          {[-0.18, 0, 0.18].map((z) => (
            <mesh key={z} position={[0, 0.01, z]}>
              <boxGeometry args={[0.37, 0.0015, 0.01]} />
              <Metal color={GRAPHITE} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function CommDish({
  position,
  rotation,
  size = 0.16,
}: Readonly<{
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  size?: number;
}>) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[Math.PI / 2.15, 0, 0]}>
        <cylinderGeometry args={[size, size * 0.92, 0.018, 28, 1, true]} />
        <Metal color={TITANIUM_LIGHT} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 2.15, 0, 0]}>
        <circleGeometry args={[size * 0.88, 28]} />
        <meshStandardMaterial
          color="#1a2028"
          metalness={0.9}
          roughness={0.28}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.05, 0.02]}>
        <cylinderGeometry args={[0.006, 0.006, 0.08, 6]} />
        <Metal color={TITANIUM} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.09, 0.03]}>
        <sphereGeometry args={[0.012, 8, 6]} />
        <Metal color={TITANIUM_LIGHT} roughness={0.3} />
      </mesh>
    </group>
  );
}

function DockingPort({
  position,
  rotation,
}: Readonly<{
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
}>) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[0.09, 0.1, 0.08, 20]} />
        <Metal color={GRAPHITE_SOFT} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.02, 20]} />
        <Metal color={TITANIUM_LIGHT} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <torusGeometry args={[0.075, 0.008, 8, 24]} />
        <Metal color={TITANIUM} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.01, 16]} />
        <meshBasicMaterial color="#050608" toneMapped={false} />
      </mesh>
    </group>
  );
}

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
  const cabinLight = useRef<PointLight>(null);
  const beacon = useRef<Mesh>(null);
  const pulsePhase = useRef(0);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  const emphasis = isEmphasized ? 1 : 0;
  const hoverLift = isHovered ? 0.06 : 0;

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) return;

    const safeDelta = Math.min(delta, 0.075);

    if (station.current !== null) {
      station.current.rotation.y += safeDelta * 0.0032;
    }

    const pulse =
      briefingPulse > 0.05
        ? (0.5 + 0.5 * Math.sin(pulsePhase.current)) * briefingPulse
        : 0;

    if (briefingPulse > 0.05) {
      pulsePhase.current += safeDelta * (1.1 + briefingPulse * 1.2);
    }

    if (root.current !== null) {
      root.current.scale.setScalar(
        definition.scale *
          (1 + emphasis * 0.025 + hoverLift * 0.01 + pulse * 0.015),
      );
    }

    if (rimLight.current !== null) {
      rimLight.current.intensity = 2.4 + emphasis * 0.45 + pulse * 0.35;
    }

    if (cabinLight.current !== null) {
      cabinLight.current.intensity = 1.35 + emphasis * 0.25 + pulse * 0.3;
    }

    if (beacon.current !== null) {
      const material = beacon.current.material;
      if (!Array.isArray(material) && "opacity" in material) {
        material.opacity = 0.45 + pulse * 0.35 + emphasis * 0.1;
      }
    }
  });

  return (
    <group
      position={definition.position}
      ref={root}
      rotation={definition.orientation}
      scale={definition.scale * (1 + emphasis * 0.025 + hoverLift * 0.01)}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`planet:${definition.id}`}
        enabled={isInteractive && isVisible}
      />

      <pointLight
        color="#d7e0ec"
        decay={2}
        distance={12}
        intensity={2.4 + emphasis * 0.45}
        position={[-2.4, 2.2, 3.2]}
        ref={rimLight}
      />
      <pointLight
        color="#f0d4a0"
        decay={2}
        distance={5.5}
        intensity={1.35}
        position={[0.2, 0.1, 0.7]}
        ref={cabinLight}
      />
      <pointLight
        color="#a8b8cc"
        decay={2}
        distance={9}
        intensity={1.1}
        position={[2.6, -1.2, -1.8]}
      />

      <group ref={station}>
        {/* Central command module — spine along X */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.92, 28]} />
          <Metal color={TITANIUM} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.228, 0.228, 0.1, 28]} />
          <Metal color={GRAPHITE_SOFT} roughness={0.46} />
        </mesh>

        {/* Forward habitation module */}
        <mesh position={[0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.52, 26]} />
          <Metal color={TITANIUM} roughness={0.39} />
        </mesh>
        <mesh position={[0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.208, 0.208, 0.06, 26]} />
          <Metal color={GRAPHITE} roughness={0.46} />
        </mesh>

        {/* Aft service module */}
        <mesh position={[-0.64, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.2, 0.48, 26]} />
          <Metal color={GRAPHITE_SOFT} roughness={0.42} />
        </mesh>

        {/* Observation gallery — flat panoramic bay, not a dome */}
        <group position={[0.1, 0.04, 0.3]}>
          <mesh>
            <boxGeometry args={[0.55, 0.3, 0.2]} />
            <Metal color={TITANIUM} roughness={0.36} />
          </mesh>
          <mesh position={[0, 0.02, 0.11]}>
            <boxGeometry args={[0.48, 0.2, 0.014]} />
            <Metal color={GRAPHITE} roughness={0.46} />
          </mesh>
          {(
            [
              [-0.15, 0.05, 0.12],
              [0, 0.05, 0.12],
              [0.15, 0.05, 0.12],
              [-0.15, -0.05, 0.12],
              [0, -0.05, 0.12],
              [0.15, -0.05, 0.12],
            ] as const
          ).map((pos) => (
            <WindowPane
              args={[0.12, 0.075, 0.008]}
              key={`${pos[0]}-${pos[1]}`}
              position={pos}
            />
          ))}
          <mesh position={[0, 0.01, 0.13]}>
            <planeGeometry args={[0.46, 0.18]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={WINDOW_WARM}
              depthWrite={false}
              opacity={0.16 + emphasis * 0.06}
              side={DoubleSide}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>

        {/* Module window bands */}
        {(
          [
            [0.68, 0.08, 0.19],
            [0.68, -0.06, 0.19],
            [0.68, 0.08, -0.19],
            [-0.5, 0.07, 0.17],
            [-0.5, -0.05, 0.17],
            [0.16, 0.2, 0.1],
            [-0.16, 0.2, -0.1],
          ] as const
        ).map((pos, index) => (
          <WindowPane
            args={[0.11, 0.055, 0.007]}
            key={`band-${index}`}
            position={pos}
            soft={index % 2 === 1}
          />
        ))}

        {/* Connecting adapters */}
        <mesh position={[0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.1, 18]} />
          <Metal color={GRAPHITE} roughness={0.44} />
        </mesh>
        <mesh position={[-0.36, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.13, 0.13, 0.1, 18]} />
          <Metal color={GRAPHITE} roughness={0.44} />
        </mesh>

        {/* Main cross truss */}
        <TrussBay length={2.05} position={[0, 0, 0]} />
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.055, 2.05, 0.055]} />
          <Metal color={TITANIUM_LIGHT} roughness={0.34} />
        </mesh>

        {/* Vertical utility mast */}
        <mesh position={[-0.16, 0.36, -0.1]}>
          <cylinderGeometry args={[0.02, 0.024, 0.62, 10]} />
          <Metal color={TITANIUM_LIGHT} roughness={0.3} />
        </mesh>
        <mesh position={[-0.16, 0.68, -0.1]}>
          <boxGeometry args={[0.08, 0.04, 0.08]} />
          <Metal color={GRAPHITE_SOFT} roughness={0.36} />
        </mesh>
        <mesh position={[-0.16, 0.76, -0.1]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshBasicMaterial color={BEACON} toneMapped={false} />
        </mesh>
        <mesh position={[-0.16, 0.76, -0.1]} ref={beacon}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={BEACON}
            depthWrite={false}
            opacity={0.45}
            toneMapped={false}
            transparent
          />
        </mesh>

        {/* Subtle whip antennas */}
        <mesh position={[0.28, 0.26, -0.16]} rotation={[0.35, 0.2, 0.15]}>
          <cylinderGeometry args={[0.005, 0.005, 0.4, 6]} />
          <Metal color={TITANIUM_LIGHT} roughness={0.28} />
        </mesh>
        <mesh position={[-0.7, 0.16, 0.12]} rotation={[-0.4, 0, 0.25]}>
          <cylinderGeometry args={[0.0045, 0.0045, 0.34, 6]} />
          <Metal color={TITANIUM_LIGHT} roughness={0.28} />
        </mesh>

        <CommDish
          position={[0.45, 0.28, -0.24]}
          rotation={[-0.55, 0.4, 0.1]}
          size={0.18}
        />
        <CommDish
          position={[-0.55, -0.24, -0.2]}
          rotation={[0.85, -0.35, 0.2]}
          size={0.14}
        />

        <DockingPort position={[1.0, 0, 0]} rotation={[0, 0, -Math.PI / 2]} />
        <DockingPort position={[-0.94, 0, 0]} rotation={[0, 0, Math.PI / 2]} />

        {/* Radiator panel */}
        <mesh position={[0.06, -0.36, -0.06]} rotation={[0.15, 0.4, 0.05]}>
          <boxGeometry args={[0.72, 0.014, 0.3]} />
          <meshStandardMaterial
            color="#2a323c"
            emissive="#0c1016"
            emissiveIntensity={0.14}
            metalness={0.88}
            roughness={0.44}
            side={DoubleSide}
          />
        </mesh>

        <SolarWing position={[1.05, 0, 0]} side={1} />
        <SolarWing position={[-1.05, 0, 0]} side={-1} />

        <mesh position={[0.92, 0, 0]}>
          <boxGeometry args={[0.1, 0.08, 0.08]} />
          <Metal color={GRAPHITE} roughness={0.42} />
        </mesh>
        <mesh position={[-0.92, 0, 0]}>
          <boxGeometry args={[0.1, 0.08, 0.08]} />
          <Metal color={GRAPHITE} roughness={0.42} />
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
          <boxGeometry args={[4.4, 1.8, 2]} />
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
