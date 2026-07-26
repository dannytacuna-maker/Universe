"use client";

import { useTexture } from "@react-three/drei";

const whisTexturePath = "/assets/characters/whis.png";

export function WhisPresence() {
  const texture = useTexture(whisTexturePath);

  return (
    <group position={[1.35, 1.38, -0.28]}>
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
