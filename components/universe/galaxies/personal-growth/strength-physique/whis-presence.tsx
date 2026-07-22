"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, type Group } from "three";

const whisTexturePath = "/assets/characters/whis.png";

type WhisPresenceProps = Readonly<{
  motionEnabled: boolean;
}>;

export function WhisPresence({ motionEnabled }: WhisPresenceProps) {
  const group = useRef<Group>(null);
  const texture = useTexture(whisTexturePath);

  useFrame(({ clock }) => {
    if (!motionEnabled || group.current === null) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    group.current.position.y = 1.43 + Math.sin(elapsed * 0.34) * 0.018;
    group.current.rotation.z = Math.sin(elapsed * 0.22) * 0.0018;
  });

  return (
    <group ref={group} position={[1.35, 1.43, -0.28]}>
      <mesh position={[0, 0.05, -0.035]} scale={[1.18, 1.1, 1]}>
        <circleGeometry args={[1.2, 72]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#8ebed0"
          depthWrite={false}
          opacity={0.025}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh renderOrder={3}>
        <planeGeometry args={[1.9, 2.85]} />
        <meshBasicMaterial
          alphaTest={0.008}
          depthWrite={false}
          map={texture}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}

useTexture.preload(whisTexturePath);
