"use client";

type BeerusPlanetTreeProps = Readonly<{
  position: readonly [number, number, number];
}>;

export function BeerusPlanetTree({ position }: BeerusPlanetTreeProps) {
  return (
    <group position={position} rotation={[0, 0, -0.08]}>
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 2.7, 10]} />
        <meshStandardMaterial
          color="#5c3c59"
          emissive="#26172a"
          emissiveIntensity={0.25}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[-0.58, 2.55, 0.08]} scale={[1.18, 0.88, 1]}>
        <sphereGeometry args={[0.92, 18, 12]} />
        <meshStandardMaterial
          color="#7b5485"
          emissive="#2b1832"
          emissiveIntensity={0.38}
          roughness={0.86}
        />
      </mesh>
      <mesh position={[0.54, 2.68, -0.12]} scale={[1.08, 0.95, 1]}>
        <sphereGeometry args={[1.02, 18, 12]} />
        <meshStandardMaterial
          color="#846091"
          emissive="#2c1935"
          emissiveIntensity={0.4}
          roughness={0.86}
        />
      </mesh>
      <mesh position={[0.06, 3.34, 0]} scale={[1.16, 0.74, 1]}>
        <sphereGeometry args={[1.12, 18, 12]} />
        <meshStandardMaterial
          color="#8b6698"
          emissive="#311b3a"
          emissiveIntensity={0.42}
          roughness={0.84}
        />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.58, 0.66, 48]} />
        <meshBasicMaterial
          color="#bda97b"
          opacity={0.28}
          toneMapped={false}
          transparent
        />
      </mesh>
    </group>
  );
}
