"use client";

import { BackSide, DoubleSide } from "three";

import { beerusPlanetDefinition } from "./beerus-planet-definition";
import { BeerusPlanetTree } from "./beerus-planet-tree";
import { WhisPresence } from "./whis-presence";

type BeerusPlanetSurfaceProps = Readonly<{
  isVisible: boolean;
  motionEnabled: boolean;
}>;

export function BeerusPlanetSurface({
  isVisible,
  motionEnabled,
}: BeerusPlanetSurfaceProps) {
  return (
    <group position={beerusPlanetDefinition.landingOrigin} visible={isVisible}>
      <ambientLight color="#b9a8d2" intensity={0.72} />
      <directionalLight color="#e8d8b5" intensity={1.65} position={[4, 7, 5]} />
      <pointLight color="#8068aa" intensity={7} position={[-4, 2, -3]} />

      <mesh>
        <sphereGeometry args={[13, 40, 24]} />
        <meshBasicMaterial
          color="#0d0718"
          opacity={0.92}
          side={BackSide}
          transparent
        />
      </mesh>

      <mesh position={[0, -10, 0]}>
        <sphereGeometry args={[10, 64, 36]} />
        <meshStandardMaterial
          color="#33243e"
          emissive="#120b18"
          emissiveIntensity={0.38}
          metalness={0.02}
          roughness={0.96}
        />
      </mesh>

      <mesh position={[0, 0.012, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.65, 64]} />
        <meshStandardMaterial
          color="#5e4b69"
          emissive="#211629"
          emissiveIntensity={0.42}
          roughness={0.88}
        />
      </mesh>
      <mesh position={[0, 0.025, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.18, 1.22, 96]} />
        <meshBasicMaterial
          color="#c1aa79"
          opacity={0.4}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>
      <mesh position={[0, 0.028, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.58, 0.6, 80]} />
        <meshBasicMaterial
          color="#8ec4d1"
          opacity={0.26}
          side={DoubleSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      <BeerusPlanetTree position={[-3.65, 0, -4.25]} />
      <BeerusPlanetTree position={[4.8, -0.1, -5.8]} />

      <mesh position={[-1.3, 0.26, -1.9]} rotation={[0.18, 0.35, 0.08]}>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color="#685474"
          emissive="#24172c"
          emissiveIntensity={0.3}
          roughness={0.92}
        />
      </mesh>
      <mesh position={[3.1, 0.5, -3.2]} rotation={[-0.12, 0.2, -0.18]}>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#725b7d"
          emissive="#281a30"
          emissiveIntensity={0.32}
          roughness={0.92}
        />
      </mesh>

      <mesh position={[-4.2, 5.5, -8]} rotation={[0.2, 0.15, 0]}>
        <torusGeometry args={[1.8, 0.012, 8, 96]} />
        <meshBasicMaterial
          color="#9d82bb"
          opacity={0.13}
          toneMapped={false}
          transparent
        />
      </mesh>

      <WhisPresence motionEnabled={motionEnabled} />
    </group>
  );
}
