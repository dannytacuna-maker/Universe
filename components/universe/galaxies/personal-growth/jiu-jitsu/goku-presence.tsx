"use client";

import { useTexture } from "@react-three/drei";

const gokuTexturePath = "/assets/characters/goku.png";

export function GokuPresence() {
  const texture = useTexture(gokuTexturePath);

  return (
    <group position={[1.55, 0.56, -0.2]}>
      <mesh renderOrder={3}>
        <planeGeometry args={[2.2, 3.3]} />
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

useTexture.preload(gokuTexturePath);
