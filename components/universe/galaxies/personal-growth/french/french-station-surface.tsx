"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, type Group } from "three";

import { createSeededRandom } from "../../../procedural-random";

import { frenchStationDefinition } from "./french-station-definition";

function createWindowStars() {
  const count = 110;
  const positions = new Float32Array(count * 3);
  const random = createSeededRandom(frenchStationDefinition.seed);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (random() - 0.5) * 12;
    positions[offset + 1] = -0.4 + random() * 6.6;
    positions[offset + 2] = -5.5 + random() * 1.3;
  }

  return positions;
}

type FrenchStationSurfaceProps = Readonly<{
  isVisible: boolean;
  motionEnabled: boolean;
}>;

export function FrenchStationSurface({
  isVisible,
  motionEnabled,
}: FrenchStationSurfaceProps) {
  const starFrame = useRef<Group>(null);
  const stars = useMemo(() => createWindowStars(), []);

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible || starFrame.current === null) return;
    starFrame.current.rotation.y += Math.min(delta, 0.075) * 0.0012;
  });

  return (
    <group position={frenchStationDefinition.landingOrigin} visible={isVisible}>
      <mesh position={[0, 1.3, -5.5]}>
        <planeGeometry args={[20, 11.25]} />
        <meshBasicMaterial color="#010613" />
      </mesh>

      <group ref={starFrame}>
        <Points positions={stars}>
          <PointMaterial
            blending={AdditiveBlending}
            color="#d9eeff"
            depthWrite={false}
            opacity={0.65}
            size={0.019}
            sizeAttenuation
            toneMapped={false}
            transparent
          />
        </Points>
      </group>

      <mesh position={[3.6, 1.6, -5.05]}>
        <sphereGeometry args={[0.58, 40, 28]} />
        <meshBasicMaterial color="#183a67" />
      </mesh>
      <mesh position={[3.45, 1.78, -4.68]} scale={1.03}>
        <sphereGeometry args={[0.58, 36, 24]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#75bff4"
          depthWrite={false}
          opacity={0.12}
          toneMapped={false}
          transparent
        />
      </mesh>

      <group position={[0, 0.75, -4.15]}>
        <mesh>
          <torusGeometry args={[4.45, 0.055, 12, 96, Math.PI]} />
          <meshBasicMaterial color="#26364b" />
        </mesh>
        <mesh position={[0, -0.03, 0]} scale={[1, 0.48, 1]}>
          <ringGeometry args={[4.25, 4.28, 96, 1, 0, Math.PI]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#87c6f3"
            depthWrite={false}
            opacity={0.13}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>

      {[-4.5, 4.5].map((x) => (
        <mesh key={x} position={[x, 0.15, -3.7]}>
          <boxGeometry args={[0.14, 4.7, 0.16]} />
          <meshBasicMaterial color="#182536" />
        </mesh>
      ))}

      <mesh position={[0, -1.04, -1.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshBasicMaterial color="#07101c" />
      </mesh>

      {[-2.8, -1.4, 0, 1.4, 2.8].map((x) => (
        <mesh
          key={x}
          position={[x, -1.02, -2.4]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.008, 5.5]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#6daee0"
            depthWrite={false}
            opacity={0.13}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}

      <mesh position={[0, -0.35, -2.55]} rotation={[-0.16, 0, 0]}>
        <boxGeometry args={[2.7, 0.16, 0.8]} />
        <meshBasicMaterial color="#101f31" />
      </mesh>
      <mesh position={[0, -0.25, -2.11]} rotation={[-0.16, 0, 0]}>
        <planeGeometry args={[2.35, 0.44]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#7fc7f7"
          depthWrite={false}
          opacity={0.11}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}
