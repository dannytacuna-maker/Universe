"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  BackSide,
  DoubleSide,
  type Group,
  type Mesh,
} from "three";

import { beerusPlanetDefinition } from "./beerus-planet-definition";

type BeerusPlanetProps = Readonly<{
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function BeerusPlanet({
  isEmphasized,
  isHovered,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
}: BeerusPlanetProps) {
  const planet = useRef<Mesh>(null);
  const cloudShell = useRef<Group>(null);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);

    if (planet.current !== null) {
      planet.current.rotation.y += safeDelta * 0.035;
    }

    if (cloudShell.current !== null) {
      cloudShell.current.rotation.y -= safeDelta * 0.018;
      cloudShell.current.rotation.z += safeDelta * 0.004;
    }
  });

  const emphasis = isEmphasized ? 1 : 0;

  return (
    <group
      position={beerusPlanetDefinition.position}
      scale={isEmphasized ? 1.045 : 1}
      visible={isVisible}
    >
      <mesh ref={planet} rotation={[0.18, 0, -0.08]}>
        <sphereGeometry args={[0.14, 40, 26]} />
        <meshStandardMaterial
          color="#67517d"
          emissive="#23152f"
          emissiveIntensity={0.54 + emphasis * 0.12}
          metalness={0.05}
          roughness={0.82}
        />
      </mesh>

      <group ref={cloudShell} rotation={[0.2, 0.2, -0.08]}>
        <mesh scale={1.018}>
          <sphereGeometry args={[0.14, 36, 24]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#d6c7ec"
            depthWrite={false}
            opacity={0.075 + emphasis * 0.045}
            side={DoubleSide}
            toneMapped={false}
            transparent
            wireframe
          />
        </mesh>
      </group>

      <mesh scale={1.13}>
        <sphereGeometry args={[0.14, 32, 20]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#b997dd"
          depthWrite={false}
          opacity={0.08 + emphasis * 0.06}
          side={BackSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      <mesh rotation={[Math.PI / 2.4, 0.18, 0.08]}>
        <ringGeometry args={[0.205, 0.207, 96]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#c7ad79"
          depthWrite={false}
          opacity={0.16 + emphasis * 0.1}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      <mesh position={[0.19, 0.055, 0.025]}>
        <sphereGeometry args={[0.015, 16, 10]} />
        <meshBasicMaterial color="#d7c9a5" toneMapped={false} />
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
          <sphereGeometry args={[0.25, 16, 12]} />
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
