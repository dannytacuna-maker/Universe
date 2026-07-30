"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  DoubleSide,
  type Group,
  type MeshBasicMaterial,
  type PointLight,
} from "three";

import { SpatialLabelAnchor } from "../spatial-label-anchor";
import {
  globalObservatoryDefinition,
  type ObservatoryDefinition,
} from "./observatory-definition";

/** Dark titanium — body stays premium; edges carry separate catch materials. */
const BODY = "#171c22";
const BODY_MID = "#232a33";
const GRAPHITE = "#0b0e12";
/** Rim catch — slightly lifted titanium so silhouette separates from void. */
const EDGE = "#5c6774";
const EDGE_EMISSIVE = "#3a4450";
const GOLD = "#9a8052";
/** Observation signature — continuous warm deck, not a bloom blob. */
const DECK_GLASS = "#f2c889";
const DECK_INTERIOR = "#c4893e";
const DECK_DEPTH = "#1a120a";
const SOLAR = "#1a2330";
const SOLAR_FRAME = "#6a7582";
const NAV = "#f2f6fb";
const NAV_RED = "#e04545";

function BodyMetal({
  color = BODY,
  roughness = 0.42,
}: Readonly<{ color?: string; roughness?: number }>) {
  return (
    <meshStandardMaterial
      color={color}
      emissive="#05070a"
      emissiveIntensity={0.06}
      metalness={0.93}
      roughness={roughness}
    />
  );
}

function EdgeCatch({ color = EDGE }: Readonly<{ color?: string }>) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={EDGE_EMISSIVE}
      emissiveIntensity={0.45}
      metalness={0.88}
      roughness={0.32}
    />
  );
}

function NavLed({
  color,
  position,
}: Readonly<{
  color: string;
  position: readonly [number, number, number];
}>) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.018, 0.018, 0.018]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function SolarArray({
  position,
  rotation,
}: Readonly<{
  position: readonly [number, number, number];
  rotation?: readonly [number, number, number];
}>) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.46, 0.012, 0.28]} />
        <meshStandardMaterial
          color={SOLAR}
          emissive="#0c121a"
          emissiveIntensity={0.1}
          metalness={0.5}
          roughness={0.58}
          side={DoubleSide}
        />
      </mesh>
      {/* Thin frame — silhouette line at overview */}
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.47, 0.003, 0.01]} />
        <meshBasicMaterial color={SOLAR_FRAME} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.01, 0.003, 0.29]} />
        <meshBasicMaterial color={SOLAR_FRAME} toneMapped={false} />
      </mesh>
      <mesh position={[-0.12, 0.008, 0]}>
        <boxGeometry args={[0.006, 0.002, 0.27]} />
        <meshBasicMaterial color="#4a5562" toneMapped={false} />
      </mesh>
      <mesh position={[0.12, 0.008, 0]}>
        <boxGeometry args={[0.006, 0.002, 0.27]} />
        <meshBasicMaterial color="#4a5562" toneMapped={false} />
      </mesh>
      <mesh position={[-0.26, 0, 0]}>
        <boxGeometry args={[0.07, 0.024, 0.045]} />
        <BodyMetal color={BODY_MID} roughness={0.36} />
      </mesh>
    </group>
  );
}

const DECK_PANES = Array.from({ length: 32 }, (_, index) => {
  const angle = (index / 32) * Math.PI * 2;
  return {
    angle,
    position: [Math.cos(angle) * 0.255, 0, Math.sin(angle) * 0.255] as const,
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
  const deckLight = useRef<PointLight>(null);
  const redBeacon = useRef<MeshBasicMaterial>(null);
  const pulsePhase = useRef(0);
  const blinkPhase = useRef(0);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  const emphasis = isEmphasized ? 1 : 0;
  const hoverLift = isHovered ? 0.05 : 0;

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) return;

    const safeDelta = Math.min(delta, 0.075);

    if (station.current !== null) {
      station.current.rotation.y += safeDelta * 0.0028;
    }

    blinkPhase.current += safeDelta;
    if (redBeacon.current !== null) {
      redBeacon.current.opacity = blinkPhase.current % 2.6 < 0.4 ? 1 : 0.2;
    }

    const pulse =
      briefingPulse > 0.05
        ? (0.5 + 0.5 * Math.sin(pulsePhase.current)) * briefingPulse
        : 0;

    if (briefingPulse > 0.05) {
      pulsePhase.current += safeDelta * (1.05 + briefingPulse);
    }

    if (root.current !== null) {
      root.current.scale.setScalar(
        definition.scale *
          (1 + emphasis * 0.028 + hoverLift * 0.01 + pulse * 0.015),
      );
    }

    if (rimLight.current !== null) {
      rimLight.current.intensity = 1.15 + emphasis * 0.2 + pulse * 0.12;
    }

    if (deckLight.current !== null) {
      deckLight.current.intensity = 2.2 + emphasis * 0.35 + pulse * 0.35;
    }
  });

  return (
    <group
      position={definition.position}
      ref={root}
      rotation={definition.orientation}
      scale={definition.scale * (1 + emphasis * 0.028 + hoverLift * 0.01)}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`planet:${definition.id}`}
        enabled={isInteractive && isVisible}
      />

      <pointLight
        color="#d0dae6"
        decay={2}
        distance={5.8}
        intensity={1.15}
        position={[-1.5, 1.6, 2]}
        ref={rimLight}
      />
      <pointLight
        color="#f0b860"
        decay={2}
        distance={2.8}
        intensity={2.2}
        position={[0, 0.04, 0.05]}
        ref={deckLight}
      />

      <group ref={station}>
        {/* —— Vertical HQ stack —— */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.2, 28]} />
          <BodyMetal color={GRAPHITE} roughness={0.48} />
        </mesh>
        <mesh position={[0, -0.19, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.195, 0.01, 8, 36]} />
          <EdgeCatch />
        </mesh>

        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.2, 32]} />
          <BodyMetal roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.212, 0.009, 8, 40]} />
          <EdgeCatch />
        </mesh>

        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.17, 0.19, 0.18, 28]} />
          <BodyMetal color={BODY_MID} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.175, 0.008, 8, 36]} />
          <EdgeCatch />
        </mesh>

        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.1, 24]} />
          <BodyMetal color={GRAPHITE} roughness={0.44} />
        </mesh>

        {/* —— Observation deck: continuous warm signature —— */}
        <group position={[0, 0.05, 0]}>
          {/* Dark cabin volume behind glass = interior depth */}
          <mesh>
            <cylinderGeometry args={[0.23, 0.23, 0.11, 40]} />
            <meshStandardMaterial
              color={DECK_DEPTH}
              emissive={DECK_INTERIOR}
              emissiveIntensity={0.55 + emphasis * 0.15}
              metalness={0.2}
              roughness={0.7}
            />
          </mesh>

          {/* Structural deck rails */}
          <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26, 0.012, 10, 48]} />
            <BodyMetal color={BODY_MID} roughness={0.34} />
          </mesh>
          <mesh position={[0, -0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26, 0.012, 10, 48]} />
            <BodyMetal color={BODY_MID} roughness={0.34} />
          </mesh>
          <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.265, 0.004, 8, 48]} />
            <EdgeCatch color="#7a8694" />
          </mesh>

          {/* Continuous glass ribbon — solid panes, not soft fog */}
          {DECK_PANES.map((pane) => (
            <mesh
              key={pane.angle}
              position={pane.position}
              rotation={[0, -pane.angle + Math.PI / 2, 0]}
            >
              <boxGeometry args={[0.014, 0.088, 0.052]} />
              <meshStandardMaterial
                color={DECK_GLASS}
                emissive={DECK_GLASS}
                emissiveIntensity={1.15 + emphasis * 0.25}
                metalness={0.05}
                roughness={0.18}
                toneMapped={false}
              />
            </mesh>
          ))}

          {/* Gold collar — refined accent under the deck */}
          <mesh position={[0, -0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.007, 8, 40]} />
            <meshStandardMaterial
              color={GOLD}
              emissive={GOLD}
              emissiveIntensity={0.35}
              metalness={0.95}
              roughness={0.28}
            />
          </mesh>
        </group>

        {/* —— Communications mast —— */}
        <group position={[0.03, 0.48, -0.03]}>
          <mesh>
            <cylinderGeometry args={[0.014, 0.02, 0.38, 10]} />
            <BodyMetal color={BODY_MID} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.022, 0.004, 6, 16]} />
            <EdgeCatch />
          </mesh>
          <mesh position={[0.06, 0.12, 0]} rotation={[0.2, 0, Math.PI / 2.4]}>
            <cylinderGeometry args={[0.05, 0.05, 0.01, 20]} />
            <BodyMetal color={BODY_MID} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.04, 0.02, 0.04]} />
            <BodyMetal color={GRAPHITE} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
            <meshBasicMaterial
              ref={redBeacon}
              color={NAV_RED}
              opacity={1}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>

        {/* Sensor dish */}
        <group position={[-0.14, 0.34, -0.12]} rotation={[0.55, -0.6, 0.15]}>
          <mesh rotation={[Math.PI / 2.15, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.072, 0.012, 22, 1, true]} />
            <BodyMetal color={BODY_MID} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.008, 0]} rotation={[Math.PI / 2.15, 0, 0]}>
            <circleGeometry args={[0.07, 22]} />
            <meshStandardMaterial
              color="#12161c"
              metalness={0.9}
              roughness={0.24}
              side={DoubleSide}
            />
          </mesh>
        </group>

        {/* Docking modules */}
        <group position={[0.24, -0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.065, 0.07, 18]} />
            <BodyMetal color={GRAPHITE} roughness={0.44} />
          </mesh>
          <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.05, 0.008, 8, 20]} />
            <EdgeCatch />
          </mesh>
          <mesh position={[0, 0.045, 0]}>
            <circleGeometry args={[0.035, 16]} />
            <meshStandardMaterial
              color="#7aa8c8"
              emissive="#5a88a8"
              emissiveIntensity={0.6}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        </group>
        <group position={[-0.22, -0.22, 0.06]} rotation={[0, 0.4, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.055, 0.055, 16]} />
            <BodyMetal color={GRAPHITE} roughness={0.44} />
          </mesh>
          <mesh position={[0, 0.035, 0]}>
            <circleGeometry args={[0.028, 14]} />
            <meshStandardMaterial
              color="#7aa8c8"
              emissive="#5a88a8"
              emissiveIntensity={0.45}
              metalness={0.3}
              roughness={0.4}
            />
          </mesh>
        </group>

        {/* Compact solar cross — four arrays */}
        <SolarArray position={[0.52, 0.05, 0]} />
        <SolarArray position={[-0.52, 0.05, 0]} rotation={[0, Math.PI, 0]} />
        <SolarArray position={[0, 0.05, 0.52]} rotation={[0, Math.PI / 2, 0]} />
        <SolarArray
          position={[0, 0.05, -0.52]}
          rotation={[0, -Math.PI / 2, 0]}
        />

        {(
          [
            [0.3, 0.05, 0],
            [-0.3, 0.05, 0],
            [0, 0.05, 0.3],
            [0, 0.05, -0.3],
          ] as const
        ).map((pos) => (
          <mesh key={`${pos[0]}-${pos[2]}`} position={pos}>
            <boxGeometry args={[0.09, 0.028, 0.028]} />
            <BodyMetal color={BODY_MID} roughness={0.36} />
          </mesh>
        ))}

        {/* Overview-readable nav markers — box LEDs, not neon orbs */}
        <NavLed color={NAV} position={[0.18, 0.3, 0.14]} />
        <NavLed color={NAV} position={[-0.16, 0.26, 0.14]} />
        <NavLed color={NAV} position={[0.14, -0.28, 0.16]} />
        <NavLed color={NAV} position={[-0.14, -0.24, -0.16]} />
        <NavLed color={NAV} position={[0.48, 0.08, 0.12]} />
        <NavLed color={NAV} position={[-0.48, 0.08, -0.12]} />

        {/* Micro thrusters */}
        {(
          [
            [0.1, -0.38, 0.1],
            [-0.1, -0.38, -0.08],
          ] as const
        ).map((pos) => (
          <mesh key={`${pos[0]}-${pos[2]}`} position={pos}>
            <cylinderGeometry args={[0.012, 0.016, 0.018, 8]} />
            <BodyMetal color={GRAPHITE} roughness={0.5} />
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
          <sphereGeometry args={[0.9, 16, 12]} />
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
