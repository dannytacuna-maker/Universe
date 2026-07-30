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

const TITANIUM = "#1c222a";
const TITANIUM_LIGHT = "#2c343f";
const GRAPHITE = "#0d1014";
const GRAPHITE_SOFT = "#14181e";
const WINDOW_WARM = "#d8b57a";
const WINDOW_WARM_SOFT = "#c49a5c";
const SOLAR_FACE = "#1a2433";
const SOLAR_CELL = "#243044";
const BEACON = "#f3f6fa";

function Metal({
  color = TITANIUM,
  roughness = 0.42,
  metalness = 0.94,
  emissive = "#05070a",
  emissiveIntensity = 0.12,
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
      <mesh position={[side * 0.18, 0, 0]}>
        <boxGeometry args={[0.36, 0.03, 0.04]} />
        <Metal color={TITANIUM} roughness={0.4} />
      </mesh>
      {[0.42, 0.78, 1.14].map((x, index) => (
        <group key={x} position={[side * x, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.32, 0.012, 0.58]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? SOLAR_FACE : SOLAR_CELL}
              emissive="#0a121c"
              emissiveIntensity={0.08}
              metalness={0.55}
              roughness={0.62}
              side={DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.008, 0]}>
            <boxGeometry args={[0.3, 0.002, 0.56]} />
            <meshStandardMaterial
              color="#2a3a52"
              metalness={0.7}
              roughness={0.35}
              side={DoubleSide}
            />
          </mesh>
          {/* cell seams */}
          {[-0.14, 0, 0.14].map((z) => (
            <mesh key={z} position={[0, 0.009, z]}>
              <boxGeometry args={[0.3, 0.0015, 0.008]} />
              <Metal color={GRAPHITE} roughness={0.55} />
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
      rimLight.current.intensity = 1.05 + emphasis * 0.28 + pulse * 0.25;
    }

    if (cabinLight.current !== null) {
      cabinLight.current.intensity = 0.55 + emphasis * 0.12 + pulse * 0.2;
    }

    if (beacon.current !== null) {
      const material = beacon.current.material;
      if (!Array.isArray(material) && "opacity" in material) {
        material.opacity = 0.28 + pulse * 0.32 + emphasis * 0.08;
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
        color="#c5d0de"
        decay={2}
        distance={7.2}
        intensity={1.05 + emphasis * 0.28}
        position={[-2.1, 1.8, 2.4]}
        ref={rimLight}
      />
      <pointLight
        color="#e8c898"
        decay={2}
        distance={3.2}
        intensity={0.55}
        position={[0.15, 0.05, 0.55]}
        ref={cabinLight}
      />

      <group ref={station}>
        {/* Central command module — spine along X */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.72, 28]} />
          <Metal color={TITANIUM} roughness={0.44} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.165, 0.165, 0.08, 28]} />
          <Metal color={GRAPHITE_SOFT} roughness={0.5} />
        </mesh>

        {/* Forward habitation module */}
        <mesh position={[0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.145, 0.145, 0.42, 26]} />
          <Metal color={TITANIUM} roughness={0.43} />
        </mesh>
        <mesh position={[0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 26]} />
          <Metal color={GRAPHITE} roughness={0.5} />
        </mesh>

        {/* Aft service module */}
        <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.135, 0.15, 0.38, 26]} />
          <Metal color={GRAPHITE_SOFT} roughness={0.46} />
        </mesh>

        {/* Observation gallery — flat panoramic bay, not a dome */}
        <group position={[0.08, 0.02, 0.22]}>
          <mesh>
            <boxGeometry args={[0.42, 0.22, 0.16]} />
            <Metal color={TITANIUM} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.02, 0.085]}>
            <boxGeometry args={[0.36, 0.14, 0.012]} />
            <Metal color={GRAPHITE} roughness={0.5} />
          </mesh>
          {(
            [
              [-0.12, 0.03, 0.092],
              [0, 0.03, 0.092],
              [0.12, 0.03, 0.092],
              [-0.12, -0.04, 0.092],
              [0, -0.04, 0.092],
              [0.12, -0.04, 0.092],
            ] as const
          ).map((pos) => (
            <WindowPane
              args={[0.09, 0.055, 0.006]}
              key={`${pos[0]}-${pos[1]}`}
              position={pos}
            />
          ))}
          {/* soft cabin spill */}
          <mesh position={[0, 0.01, 0.1]}>
            <planeGeometry args={[0.34, 0.13]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={WINDOW_WARM}
              depthWrite={false}
              opacity={0.08 + emphasis * 0.04}
              side={DoubleSide}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>

        {/* Module window bands */}
        {(
          [
            [0.52, 0.06, 0.14],
            [0.52, -0.05, 0.14],
            [0.52, 0.06, -0.14],
            [-0.38, 0.05, 0.13],
            [-0.38, -0.04, 0.13],
            [0.12, 0.14, 0.08],
            [-0.12, 0.14, -0.08],
          ] as const
        ).map((pos, index) => (
          <WindowPane
            args={[0.08, 0.04, 0.005]}
            key={`band-${index}`}
            position={pos}
            soft={index % 2 === 1}
          />
        ))}

        {/* Connecting adapters */}
        <mesh position={[0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 18]} />
          <Metal color={GRAPHITE} roughness={0.48} />
        </mesh>
        <mesh position={[-0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 18]} />
          <Metal color={GRAPHITE} roughness={0.48} />
        </mesh>

        {/* Main cross truss */}
        <TrussBay length={1.55} position={[0, 0, 0]} />
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.04, 1.55, 0.04]} />
          <Metal color={TITANIUM_LIGHT} roughness={0.38} />
        </mesh>

        {/* Vertical utility mast */}
        <mesh position={[-0.12, 0.28, -0.08]}>
          <cylinderGeometry args={[0.015, 0.018, 0.48, 10]} />
          <Metal color={TITANIUM_LIGHT} roughness={0.34} />
        </mesh>
        <mesh position={[-0.12, 0.52, -0.08]}>
          <boxGeometry args={[0.06, 0.03, 0.06]} />
          <Metal color={GRAPHITE_SOFT} roughness={0.4} />
        </mesh>
        <mesh position={[-0.12, 0.58, -0.08]}>
          <sphereGeometry args={[0.016, 10, 8]} />
          <meshBasicMaterial color={BEACON} toneMapped={false} />
        </mesh>
        <mesh position={[-0.12, 0.58, -0.08]} ref={beacon}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={BEACON}
            depthWrite={false}
            opacity={0.28}
            toneMapped={false}
            transparent
          />
        </mesh>

        {/* Subtle whip antennas */}
        <mesh position={[0.22, 0.2, -0.12]} rotation={[0.35, 0.2, 0.15]}>
          <cylinderGeometry args={[0.004, 0.004, 0.32, 6]} />
          <Metal color={TITANIUM_LIGHT} roughness={0.3} />
        </mesh>
        <mesh position={[-0.55, 0.12, 0.1]} rotation={[-0.4, 0, 0.25]}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.26, 6]} />
          <Metal color={TITANIUM_LIGHT} roughness={0.3} />
        </mesh>

        <CommDish
          position={[0.35, 0.22, -0.18]}
          rotation={[-0.55, 0.4, 0.1]}
          size={0.13}
        />
        <CommDish
          position={[-0.42, -0.18, -0.16]}
          rotation={[0.85, -0.35, 0.2]}
          size={0.1}
        />

        <DockingPort position={[0.78, 0, 0]} rotation={[0, 0, -Math.PI / 2]} />
        <DockingPort position={[-0.74, 0, 0]} rotation={[0, 0, Math.PI / 2]} />

        {/* Radiator panel */}
        <mesh position={[0.05, -0.28, -0.05]} rotation={[0.15, 0.4, 0.05]}>
          <boxGeometry args={[0.55, 0.01, 0.22]} />
          <meshStandardMaterial
            color="#1e242c"
            metalness={0.88}
            roughness={0.48}
            side={DoubleSide}
          />
        </mesh>

        <SolarWing position={[0.82, 0, 0]} side={1} />
        <SolarWing position={[-0.82, 0, 0]} side={-1} />

        {/* Truss-end solar mounts */}
        <mesh position={[0.72, 0, 0]}>
          <boxGeometry args={[0.08, 0.06, 0.06]} />
          <Metal color={GRAPHITE} roughness={0.45} />
        </mesh>
        <mesh position={[-0.72, 0, 0]}>
          <boxGeometry args={[0.08, 0.06, 0.06]} />
          <Metal color={GRAPHITE} roughness={0.45} />
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
          <boxGeometry args={[3.2, 1.4, 1.5]} />
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
