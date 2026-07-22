"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  SRGBColorSpace,
} from "three";

import { BeerusSanctuaryAtmosphere } from "./beerus-sanctuary-atmosphere";

const sanctuaryTexturePath = "/assets/environments/beerus-sanctuary.webp";

type BeerusSanctuaryEnvironmentProps = Readonly<{
  motionEnabled: boolean;
}>;

export function BeerusSanctuaryEnvironment({
  motionEnabled,
}: BeerusSanctuaryEnvironmentProps) {
  const environmentPlate = useRef<Group>(null);
  const elapsedTime = useRef(0);
  const texture = useTexture(sanctuaryTexturePath, (loadedTexture) => {
    loadedTexture.anisotropy = 8;
    loadedTexture.colorSpace = SRGBColorSpace;
  });
  useFrame((_, delta) => {
    if (!motionEnabled || environmentPlate.current === null) {
      return;
    }

    elapsedTime.current += Math.min(delta, 0.075);
    environmentPlate.current.position.x =
      Math.sin(elapsedTime.current * 0.09) * 0.045;
    environmentPlate.current.position.y =
      Math.cos(elapsedTime.current * 0.07) * 0.028;
  });

  return (
    <group>
      <group ref={environmentPlate}>
        <mesh position={[0, 1.1, -5.2]}>
          <planeGeometry args={[19.9, 11.2]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>

        <mesh position={[0, 1.1, -5.12]} renderOrder={1}>
          <planeGeometry args={[19.9, 11.2]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#7d4f95"
            depthWrite={false}
            opacity={0.035}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>

      <BeerusSanctuaryAtmosphere motionEnabled={motionEnabled} />

      <mesh position={[1.35, 0.035, -0.24]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.52, 48]} />
        <meshBasicMaterial
          color="#170d20"
          depthWrite={false}
          opacity={0.4}
          transparent
        />
      </mesh>
      <mesh position={[1.35, 0.038, -0.24]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.47, 0.485, 64]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#c479e8"
          depthWrite={false}
          opacity={0.25}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

useTexture.preload(sanctuaryTexturePath);
