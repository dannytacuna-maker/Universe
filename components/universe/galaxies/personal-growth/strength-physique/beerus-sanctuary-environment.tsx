"use client";

import { PointMaterial, Points, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  SRGBColorSpace,
} from "three";

import { createSeededRandom } from "../../../procedural-random";

const sanctuaryTexturePath = "/assets/environments/beerus-sanctuary.webp";

type BeerusSanctuaryEnvironmentProps = Readonly<{
  motionEnabled: boolean;
}>;

function createAtmosphericMotes() {
  const count = 84;
  const positions = new Float32Array(count * 3);
  const random = createSeededRandom(987_214);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;

    positions[offset] = (random() - 0.5) * 9.5;
    positions[offset + 1] = 0.35 + random() * 5.4;
    positions[offset + 2] = -4.6 + random() * 4.1;
  }

  return positions;
}

export function BeerusSanctuaryEnvironment({
  motionEnabled,
}: BeerusSanctuaryEnvironmentProps) {
  const atmosphere = useRef<Group>(null);
  const elapsedTime = useRef(0);
  const texture = useTexture(sanctuaryTexturePath, (loadedTexture) => {
    loadedTexture.anisotropy = 8;
    loadedTexture.colorSpace = SRGBColorSpace;
  });
  const motes = useMemo(() => createAtmosphericMotes(), []);

  useFrame((_, delta) => {
    if (!motionEnabled || atmosphere.current === null) {
      return;
    }

    elapsedTime.current += Math.min(delta, 0.075);
    atmosphere.current.position.y =
      Math.sin(elapsedTime.current * 0.12) * 0.035;
    atmosphere.current.rotation.z =
      Math.sin(elapsedTime.current * 0.07) * 0.002;
  });

  return (
    <group>
      <mesh position={[0, 1.1, -5.2]}>
        <planeGeometry args={[19.6, 11.025]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      <mesh position={[0, 1.1, -5.12]} renderOrder={1}>
        <planeGeometry args={[19.6, 11.025]} />
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

      <group ref={atmosphere}>
        <Points positions={motes}>
          <PointMaterial
            blending={AdditiveBlending}
            color="#edc9ff"
            depthWrite={false}
            opacity={0.28}
            size={0.018}
            sizeAttenuation
            toneMapped={false}
            transparent
          />
        </Points>
      </group>

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
