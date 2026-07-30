"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
} from "three";

import { SpatialLabelAnchor } from "../spatial-label-anchor";
import {
  globalObservatoryDefinition,
  type ObservatoryDefinition,
} from "./observatory-definition";

const TITANIUM = "#1a1f26";
const TITANIUM_MID = "#262d36";
const GRAPHITE = "#0c0f13";
const GOLD_ACCENT = "#8a7348";
const WINDOW_WARM = "#f0c888";
const WINDOW_CORE = "#ffd9a0";
const SOLAR = "#1c2634";
const SOLAR_LIT = "#2a384c";
const NAV_WHITE = "#eef4fb";
const NAV_RED = "#ff4a4a";

function Metal({
  color = TITANIUM,
  roughness = 0.4,
  metalness = 0.94,
}: Readonly<{
  color?: string;
  metalness?: number;
  roughness?: number;
}>) {
  return (
    <meshStandardMaterial
      color={color}
      emissive="#06080c"
      emissiveIntensity={0.08}
      metalness={metalness}
      roughness={roughness}
    />
  );
}

function NavLed({
  color,
  position,
  size = 0.012,
}: Readonly<{
  color: string;
  position: readonly [number, number, number];
  size?: number;
}>) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 8, 6]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function SolarPanel({
  position,
  rotation,
}: Readonly<{
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
}>) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.42, 0.01, 0.26]} />
        <meshStandardMaterial
          color={SOLAR}
          emissive="#0a1018"
          emissiveIntensity={0.12}
          metalness={0.55}
          roughness={0.55}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.006, 0]}>
        <boxGeometry args={[0.39, 0.002, 0.23]} />
        <meshStandardMaterial
          color={SOLAR_LIT}
          metalness={0.65}
          roughness={0.35}
          side={DoubleSide}
        />
      </mesh>
      {[-0.1, 0, 0.1].map((z) => (
        <mesh key={z} position={[0, 0.007, z]}>
          <boxGeometry args={[0.39, 0.001, 0.008]} />
          <Metal color={GRAPHITE} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[-0.24, 0, 0]}>
        <boxGeometry args={[0.06, 0.02, 0.04]} />
        <Metal color={TITANIUM_MID} roughness={0.36} />
      </mesh>
    </group>
  );
}

function CommDish({
  position,
  rotation,
  size = 0.09,
}: Readonly<{
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
  size?: number;
}>) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[Math.PI / 2.2, 0, 0]}>
        <cylinderGeometry args={[size, size * 0.9, 0.014, 24, 1, true]} />
        <Metal color={TITANIUM_MID} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
        <circleGeometry args={[size * 0.86, 24]} />
        <meshStandardMaterial
          color="#151a20"
          metalness={0.9}
          roughness={0.25}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.04, 0.015]}>
        <cylinderGeometry args={[0.004, 0.004, 0.06, 6]} />
        <Metal color={GOLD_ACCENT} roughness={0.35} />
      </mesh>
    </group>
  );
}

const RING_WINDOWS = Array.from({ length: 24 }, (_, index) => {
  const angle = (index / 24) * Math.PI * 2;
  return {
    angle,
    position: [Math.cos(angle) * 0.23, 0, Math.sin(angle) * 0.23] as const,
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
  const rimLight = useRef<PointLight>(null);
  const cabinLight = useRef<PointLight>(null);
  const ringGlow = useRef<Mesh>(null);
  const redBeacon = useRef<MeshBasicMaterial>(null);
  const pulsePhase = useRef(0);
  const blinkPhase = useRef(0);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  const emphasis = isEmphasized ? 1 : 0;
  const hoverLift = isHovered ? 0.06 : 0;

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) return;

    const safeDelta = Math.min(delta, 0.075);

    if (station.current !== null) {
      station.current.rotation.y += safeDelta * 0.003;
    }

    blinkPhase.current += safeDelta;
    const blink = blinkPhase.current % 2.4 < 0.35 ? 1 : 0.15;
    if (redBeacon.current !== null) {
      redBeacon.current.opacity = blink;
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
          (1 + emphasis * 0.03 + hoverLift * 0.012 + pulse * 0.018),
      );
    }

    if (rimLight.current !== null) {
      rimLight.current.intensity = 0.85 + emphasis * 0.2 + pulse * 0.15;
    }

    if (cabinLight.current !== null) {
      cabinLight.current.intensity = 1.8 + emphasis * 0.35 + pulse * 0.4;
    }

    if (ringGlow.current !== null) {
      const material = ringGlow.current.material;
      if (!Array.isArray(material) && "opacity" in material) {
        material.opacity = 0.22 + emphasis * 0.06 + pulse * 0.08;
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

      {/* Cool rim catch — restrained, yacht-like */}
      <pointLight
        color="#c8d2de"
        decay={2}
        distance={5.5}
        intensity={0.85 + emphasis * 0.2}
        position={[-1.4, 1.5, 1.8]}
        ref={rimLight}
      />
      {/* Warm cabin spill from observation ring — primary readability */}
      <pointLight
        color="#f0c070"
        decay={2}
        distance={3.4}
        intensity={1.8}
        position={[0, 0.02, 0.15]}
        ref={cabinLight}
      />

      <group ref={station}>
        {/* Lower service tier */}
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.22, 28]} />
          <Metal color={GRAPHITE} roughness={0.46} />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.195, 0.195, 0.04, 28]} />
          <Metal color={TITANIUM_MID} roughness={0.36} />
        </mesh>

        {/* Mid habitat stack */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.28, 32]} />
          <Metal color={TITANIUM} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.185, 0.185, 0.08, 28]} />
          <Metal color={TITANIUM_MID} roughness={0.34} />
        </mesh>

        {/* Upper command tier */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.22, 28]} />
          <Metal color={TITANIUM} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.44, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.1, 24]} />
          <Metal color={GRAPHITE} roughness={0.44} />
        </mesh>

        {/* Panoramic observation ring — luxury yacht warm glow */}
        <group position={[0, 0.02, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.23, 0.055, 14, 48]} />
            <Metal color={TITANIUM_MID} roughness={0.32} />
          </mesh>

          {/* Glass channel */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.23, 0.038, 12, 48]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={WINDOW_CORE}
              depthWrite={false}
              opacity={0.55 + emphasis * 0.12}
              toneMapped={false}
              transparent
            />
          </mesh>

          {RING_WINDOWS.map((window) => (
            <mesh
              key={window.angle}
              position={window.position}
              rotation={[0, -window.angle + Math.PI / 2, 0]}
            >
              <boxGeometry args={[0.008, 0.07, 0.048]} />
              <meshBasicMaterial color={WINDOW_WARM} toneMapped={false} />
            </mesh>
          ))}

          {/* Soft exterior spill so the ring reads at distance */}
          <mesh ref={ringGlow} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.23, 0.09, 10, 48]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={WINDOW_WARM}
              depthWrite={false}
              opacity={0.22}
              side={DoubleSide}
              toneMapped={false}
              transparent
            />
          </mesh>

          {/* Warm interior core */}
          <mesh>
            <torusGeometry args={[0.2, 0.02, 8, 32]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={WINDOW_CORE}
              depthWrite={false}
              opacity={0.35}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>

        {/* Gold accent collar */}
        <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.205, 0.006, 8, 40]} />
          <meshStandardMaterial
            color={GOLD_ACCENT}
            emissive={GOLD_ACCENT}
            emissiveIntensity={0.15}
            metalness={0.95}
            roughness={0.28}
          />
        </mesh>

        {/* Communications mast */}
        <group position={[0.02, 0.52, -0.02]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.018, 0.42, 10]} />
            <Metal color={TITANIUM_MID} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.05, 0.025, 0.05]} />
            <Metal color={GRAPHITE} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <sphereGeometry args={[0.014, 8, 6]} />
            <meshBasicMaterial
              ref={redBeacon}
              color={NAV_RED}
              opacity={0.9}
              toneMapped={false}
              transparent
            />
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <sphereGeometry args={[0.032, 8, 6]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={NAV_RED}
              depthWrite={false}
              opacity={0.2}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>

        <CommDish
          position={[0.12, 0.4, -0.12]}
          rotation={[-0.6, 0.5, 0.1]}
          size={0.085}
        />
        <CommDish
          position={[-0.14, 0.22, -0.14]}
          rotation={[0.5, -0.7, 0.2]}
          size={0.07}
        />

        {/* Whip antennas */}
        <mesh position={[0.1, 0.48, 0.08]} rotation={[0.25, 0.15, 0.2]}>
          <cylinderGeometry args={[0.003, 0.003, 0.22, 5]} />
          <Metal color={TITANIUM_MID} roughness={0.28} />
        </mesh>
        <mesh position={[-0.08, 0.36, 0.1]} rotation={[-0.3, 0, -0.2]}>
          <cylinderGeometry args={[0.0025, 0.0025, 0.18, 5]} />
          <Metal color={TITANIUM_MID} roughness={0.28} />
        </mesh>

        {/* Docking ports */}
        <group position={[0.22, -0.08, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.055, 0.06, 0.05, 18]} />
            <Metal color={GRAPHITE} roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <torusGeometry args={[0.045, 0.006, 8, 20]} />
            <Metal color={TITANIUM_MID} roughness={0.32} />
          </mesh>
          <mesh position={[0, 0.032, 0]}>
            <circleGeometry args={[0.032, 16]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color="#9ec8e8"
              depthWrite={false}
              opacity={0.35}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>
        <group position={[-0.22, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.055, 0.045, 18]} />
            <Metal color={GRAPHITE} roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.028, 0]}>
            <circleGeometry args={[0.028, 16]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color="#9ec8e8"
              depthWrite={false}
              opacity={0.28}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>

        {/* Four compact solar arrays — Starlink/ISS cross */}
        <SolarPanel position={[0.48, 0.02, 0]} />
        <SolarPanel position={[-0.48, 0.02, 0]} rotation={[0, Math.PI, 0]} />
        <SolarPanel
          position={[0, 0.02, 0.48]}
          rotation={[0, Math.PI / 2, 0]}
        />
        <SolarPanel
          position={[0, 0.02, -0.48]}
          rotation={[0, -Math.PI / 2, 0]}
        />

        {/* Boom mounts */}
        {(
          [
            [0.28, 0.02, 0],
            [-0.28, 0.02, 0],
            [0, 0.02, 0.28],
            [0, 0.02, -0.28],
          ] as const
        ).map((pos) => (
          <mesh key={`${pos[0]}-${pos[2]}`} position={pos}>
            <boxGeometry args={[0.08, 0.03, 0.03]} />
            <Metal color={TITANIUM_MID} roughness={0.36} />
          </mesh>
        ))}

        {/* White navigation LEDs */}
        <NavLed color={NAV_WHITE} position={[0.2, 0.36, 0.12]} size={0.01} />
        <NavLed color={NAV_WHITE} position={[-0.18, 0.28, 0.14]} size={0.01} />
        <NavLed color={NAV_WHITE} position={[0.16, -0.3, 0.14]} size={0.009} />
        <NavLed color={NAV_WHITE} position={[-0.16, -0.26, -0.14]} size={0.009} />
        <NavLed color={NAV_WHITE} position={[0.42, 0.05, 0.12]} size={0.008} />
        <NavLed color={NAV_WHITE} position={[-0.42, 0.05, -0.12]} size={0.008} />

        {/* Micro thruster nozzles */}
        {(
          [
            [0.12, -0.36, 0.1],
            [-0.12, -0.36, -0.1],
            [0.08, -0.36, -0.12],
          ] as const
        ).map((pos) => (
          <mesh key={`${pos[0]}-${pos[2]}`} position={pos}>
            <cylinderGeometry args={[0.012, 0.016, 0.02, 8]} />
            <Metal color={GRAPHITE} roughness={0.48} />
          </mesh>
        ))}
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
          <sphereGeometry args={[0.85, 16, 12]} />
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
