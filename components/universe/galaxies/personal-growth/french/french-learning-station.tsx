"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, type Group } from "three";

import { SpatialLabelAnchor } from "../../../spatial-label-anchor";

import { frenchStationDefinition } from "./french-planets";

type FrenchLearningStationProps = Readonly<{
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function FrenchLearningStation({
  isEmphasized,
  isHovered,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
}: FrenchLearningStationProps) {
  const station = useRef<Group>(null);
  const signalRing = useRef<Group>(null);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) return;
    const safeDelta = Math.min(delta, 0.075);

    if (station.current !== null) {
      station.current.rotation.y += safeDelta * 0.014;
    }

    if (signalRing.current !== null) {
      signalRing.current.rotation.z -= safeDelta * 0.009;
    }
  });

  const emphasis = isEmphasized ? 1 : 0;

  return (
    <group
      position={frenchStationDefinition.position}
      scale={isEmphasized ? 1.045 : 1}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`planet:${frenchStationDefinition.id}`}
        enabled={isInteractive && isVisible}
      />

      <group ref={station} rotation={[0.16, -0.22, -0.08]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.035, 0.13, 18]} />
          <meshBasicMaterial color="#c9dceb" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.072, 0.011, 10, 48]} />
          <meshBasicMaterial color="#7baeda" />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.031, 18, 12]} />
          <meshBasicMaterial color="#e8f5ff" />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.105, -0.005, 0]}>
            <mesh>
              <boxGeometry args={[0.13, 0.007, 0.065]} />
              <meshBasicMaterial color="#27497a" />
            </mesh>
            {[0.02, 0.06, 0.1].map((offset) => (
              <mesh
                key={offset}
                position={[
                  side < 0 ? 0.065 - offset : offset - 0.065,
                  0.004,
                  0,
                ]}
              >
                <boxGeometry args={[0.003, 0.002, 0.06]} />
                <meshBasicMaterial color="#8ec9ff" />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      <group ref={signalRing} rotation={[Math.PI / 2.15, 0.1, 0]}>
        <mesh>
          <ringGeometry args={[0.145, 0.147, 96]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#8ec9ff"
            depthWrite={false}
            opacity={0.12 + emphasis * 0.11}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>

      <mesh scale={1 + emphasis * 0.08}>
        <sphereGeometry args={[0.19, 12, 8]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#6aaee8"
          depthWrite={false}
          opacity={0.025 + emphasis * 0.025}
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
          <sphereGeometry args={[0.24, 12, 8]} />
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
