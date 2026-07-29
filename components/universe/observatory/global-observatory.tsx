"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, DoubleSide, type Group, type Mesh, type PointLight } from "three";

import { StellarGlow } from "../galaxies/university/stellar-glow";
import { SpatialLabelAnchor } from "../spatial-label-anchor";
import {
  globalObservatoryDefinition,
  type ObservatoryDefinition,
} from "./observatory-definition";
import {
  ObservatoryCrystallineCore,
  ObservatoryDataVeil,
} from "./observatory-visuals";

const HEX_MIRROR_COUNT = 6;
const INNER_SENSOR_COUNT = 10;
const OUTER_RELAY_COUNT = 5;

const hexMirrors = Array.from({ length: HEX_MIRROR_COUNT }, (_, index) => {
  const angle = (index / HEX_MIRROR_COUNT) * Math.PI * 2;

  return {
    angle,
    position: [Math.cos(angle) * 0.52, Math.sin(angle) * 0.08, Math.sin(angle) * 0.52] as const,
  };
});

const trussArms = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3] as const;

const innerSensors = Array.from({ length: INNER_SENSOR_COUNT }, (_, index) => {
  const angle = (index / INNER_SENSOR_COUNT) * Math.PI * 2;

  return {
    angle,
    position: [Math.cos(angle) * 0.78, Math.sin(angle) * 0.04, Math.sin(angle) * 0.78] as const,
  };
});

const outerRelays = Array.from({ length: OUTER_RELAY_COUNT }, (_, index) => {
  const angle = (index / OUTER_RELAY_COUNT) * Math.PI * 2 + 0.35;

  return {
    angle,
    position: [Math.cos(angle) * 1.02, Math.sin(angle) * 0.06, Math.sin(angle) * 1.02] as const,
    scale: 0.72 + (index % 2) * 0.14,
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
  const innerOrbit = useRef<Group>(null);
  const outerOrbit = useRef<Group>(null);
  const sweepRing = useRef<Mesh>(null);
  const pulsePhase = useRef(0);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  const emphasis = isEmphasized ? 1 : 0;
  const hoverLift = isHovered ? 0.12 : 0;
  const palette = definition.palette;
  const presence = 0.88 + emphasis * 0.12 + hoverLift;

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) return;

    const safeDelta = Math.min(delta, 0.075);

    if (station.current !== null) {
      station.current.rotation.y += safeDelta * 0.009;
    }

    if (innerOrbit.current !== null) {
      innerOrbit.current.rotation.y += safeDelta * 0.016;
    }

    if (outerOrbit.current !== null) {
      outerOrbit.current.rotation.y -= safeDelta * 0.01;
    }

    if (sweepRing.current !== null) {
      sweepRing.current.rotation.z += safeDelta * 0.022;
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
        (1 + emphasis * 0.045 + hoverLift * 0.015 + pulse * 0.035);
      root.current.scale.setScalar(nextScale);
    }

    if (coreLight.current !== null) {
      coreLight.current.intensity = 4.2 + emphasis * 1.4 + pulse * 1.1;
    }

    if (pulseGlow.current !== null) {
      const material = pulseGlow.current.material;
      if (!Array.isArray(material) && "opacity" in material) {
        material.opacity = 0.018 + pulse * 0.07;
      }
    }
  });

  return (
    <group
      position={definition.position}
      ref={root}
      rotation={definition.orientation}
      scale={definition.scale * (1 + emphasis * 0.045 + hoverLift * 0.015)}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`planet:${definition.id}`}
        enabled={isInteractive && isVisible}
      />

      <pointLight
        color={palette.core}
        decay={2}
        distance={5.8}
        intensity={4.2 + emphasis * 1.4}
        position={[0.4, 0.55, 1.6]}
        ref={coreLight}
      />
      <pointLight
        color={palette.aperture}
        decay={2}
        distance={4.6}
        intensity={1.85 + emphasis * 0.65}
        position={[-1.4, -0.35, 1.2]}
      />
      <pointLight
        color={palette.signal}
        decay={2}
        distance={3.8}
        intensity={1.1}
        position={[0.15, -0.85, -0.6]}
      />

      <StellarGlow
        color={palette.signal}
        opacity={0.022 + emphasis * 0.012}
        radius={1.35}
      />
      <StellarGlow
        color={palette.aperture}
        opacity={0.014 + emphasis * 0.01}
        radius={1.85}
      />
      <StellarGlow
        color={palette.beacon}
        opacity={0.008 + emphasis * 0.006}
        radius={2.45}
      />

      <mesh ref={pulseGlow} scale={2.2}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={palette.beacon}
          depthWrite={false}
          opacity={0.018}
          toneMapped={false}
          transparent
        />
      </mesh>

      <ObservatoryDataVeil
        apertureColor={palette.aperture}
        opacity={0.34 + emphasis * 0.14 + hoverLift * 0.08}
        signalColor={palette.signal}
      />

      <group ref={outerOrbit}>
        <mesh rotation={[Math.PI / 2.45, 0.14, -0.18]}>
          <ringGeometry args={[1.08, 1.084, 160]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={palette.aperture}
            depthWrite={false}
            opacity={0.07 + emphasis * 0.035}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>

        <mesh rotation={[Math.PI / 2.45, 0.14, -0.18]}>
          <ringGeometry args={[0.94, 0.942, 128]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={palette.signal}
            depthWrite={false}
            opacity={0.045 + emphasis * 0.02}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>

        {outerRelays.map((relay) => (
          <group
            key={relay.angle}
            position={relay.position}
            rotation={[0, -relay.angle, 0]}
            scale={relay.scale}
          >
            <mesh>
              <boxGeometry args={[0.11, 0.045, 0.055]} />
              <meshStandardMaterial
                color={palette.metalLight}
                emissive="#152028"
                emissiveIntensity={0.22}
                metalness={0.96}
                roughness={0.24}
              />
            </mesh>
            <mesh position={[-0.11, 0, 0]}>
              <boxGeometry args={[0.095, 0.068, 0.01]} />
              <meshBasicMaterial color="#1a3344" toneMapped={false} />
            </mesh>
            <mesh position={[0.11, 0, 0]}>
              <boxGeometry args={[0.095, 0.068, 0.01]} />
              <meshBasicMaterial color="#1a3344" toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.045, 0]}>
              <octahedronGeometry args={[0.022, 0]} />
              <meshBasicMaterial
                color={palette.beacon}
                opacity={0.72 + emphasis * 0.18}
                toneMapped={false}
                transparent
              />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={innerOrbit}>
        <mesh rotation={[Math.PI / 2.7, 0.08, 0.22]}>
          <ringGeometry args={[0.8, 0.803, 144]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={palette.signal}
            depthWrite={false}
            opacity={0.11 + emphasis * 0.05}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>

        {innerSensors.map((sensor, index) => (
          <group
            key={sensor.angle}
            position={sensor.position}
            rotation={[0, -sensor.angle, 0]}
          >
            <mesh>
              <boxGeometry args={[0.055, 0.055, 0.038]} />
              <meshStandardMaterial
                color={index % 2 === 0 ? palette.metalLight : palette.metalDark}
                emissive="#101820"
                emissiveIntensity={0.24}
                metalness={0.95}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, 0, 0.022]}>
              <circleGeometry args={[0.018, 20]} />
              <meshBasicMaterial
                blending={AdditiveBlending}
                color={index % 3 === 0 ? palette.aperture : palette.core}
                depthWrite={false}
                opacity={0.42 + emphasis * 0.18}
                toneMapped={false}
                transparent
              />
            </mesh>
          </group>
        ))}
      </group>

      <mesh ref={sweepRing} rotation={[Math.PI / 2.15, 0.22, -0.12]}>
        <ringGeometry args={[0.62, 0.624, 120, 1, 0, Math.PI * 1.35]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={palette.aperture}
          depthWrite={false}
          opacity={0.16 + emphasis * 0.08 + hoverLift * 0.04}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      <group ref={station}>
        <mesh position={[0, 0, -0.34]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.62, 48]} />
          <meshStandardMaterial
            color={palette.metalDark}
            emissive="#0a1218"
            emissiveIntensity={0.35}
            metalness={0.97}
            roughness={0.32}
            side={DoubleSide}
          />
        </mesh>

        <mesh position={[0, 0, -0.36]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.58, 0.62, 64]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={palette.aperture}
            depthWrite={false}
            opacity={0.12 + emphasis * 0.06}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>

        {trussArms.map((angle) => (
          <group key={angle} rotation={[0.08, angle, 0.12]}>
            <mesh position={[0.42, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.018, 0.84, 10]} />
              <meshStandardMaterial
                color={palette.metalLight}
                emissive="#121a22"
                emissiveIntensity={0.18}
                metalness={0.96}
                roughness={0.26}
              />
            </mesh>
            <mesh position={[0.84, 0.04, 0]}>
              <boxGeometry args={[0.048, 0.048, 0.048]} />
              <meshStandardMaterial
                color={palette.metalDark}
                metalness={0.95}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.68, 0.022, 12, 96]} />
          <meshStandardMaterial
            color={palette.metalLight}
            emissive="#18242c"
            emissiveIntensity={0.3}
            metalness={0.97}
            roughness={0.22}
          />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.68, 0.006, 8, 96]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={palette.signal}
            depthWrite={false}
            opacity={0.28 + emphasis * 0.12}
            toneMapped={false}
            transparent
          />
        </mesh>

        {hexMirrors.map((mirror, index) => (
          <group
            key={mirror.angle}
            position={mirror.position}
            rotation={[0.42, -mirror.angle, 0]}
          >
            <mesh rotation={[0.18, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.016, 6]} />
              <meshStandardMaterial
                color={index % 2 === 0 ? "#c89245" : "#a87838"}
                emissive={palette.aperture}
                emissiveIntensity={0.08 + emphasis * 0.06}
                metalness={0.98}
                roughness={0.14}
              />
            </mesh>
            <mesh position={[0, 0, 0.01]} rotation={[0.18, 0, 0]}>
              <cylinderGeometry args={[0.118, 0.118, 0.004, 6]} />
              <meshBasicMaterial
                blending={AdditiveBlending}
                color={palette.aperture}
                depthWrite={false}
                opacity={0.18 + emphasis * 0.1}
                toneMapped={false}
                transparent
              />
            </mesh>
          </group>
        ))}

        <ObservatoryCrystallineCore
          apertureColor={palette.aperture}
          coreColor={palette.core}
          opacity={presence}
          radius={0.19}
          signalColor={palette.signal}
        />

        <mesh>
          <sphereGeometry args={[0.22, 28, 20]} />
          <meshStandardMaterial
            color={palette.metalDark}
            emissive="#0c141a"
            emissiveIntensity={0.48}
            metalness={0.94}
            roughness={0.36}
            transparent
            opacity={0.88}
          />
        </mesh>

        <group position={[0.12, 0.48, 0.08]} rotation={[0.08, 0.22, -0.14]}>
          <mesh>
            <cylinderGeometry args={[0.014, 0.022, 0.34, 12]} />
            <meshStandardMaterial
              color={palette.metalLight}
              metalness={0.96}
              roughness={0.24}
            />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <octahedronGeometry args={[0.038, 0]} />
            <meshBasicMaterial color={palette.beacon} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <sphereGeometry args={[0.055, 16, 12]} />
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

        <group position={[-0.28, -0.06, 0.44]}>
          <mesh>
            <circleGeometry args={[0.13, 48]} />
            <meshBasicMaterial color="#020508" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <ringGeometry args={[0.132, 0.148, 64]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={palette.aperture}
              depthWrite={false}
              opacity={0.55 + emphasis * 0.18}
              toneMapped={false}
              transparent
            />
          </mesh>
          <mesh position={[0, 0, 0.003]}>
            <circleGeometry args={[0.088, 40]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={palette.core}
              depthWrite={false}
              opacity={0.1 + emphasis * 0.05}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>
      </group>

      <mesh scale={1.05 + emphasis * 0.06}>
        <sphereGeometry args={[0.72, 22, 14]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={palette.signal}
          depthWrite={false}
          opacity={0.028 + emphasis * 0.016}
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
          <sphereGeometry args={[1.05, 18, 12]} />
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
