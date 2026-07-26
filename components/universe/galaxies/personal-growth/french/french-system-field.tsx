"use client";

import { AdditiveBlending } from "three";

type FrenchSystemFieldProps = Readonly<{
  activity: number;
  emphasis: number;
}>;

const signalNodes = [
  [-0.31, 0.05, 0.01],
  [-0.12, 0.22, -0.02],
  [0.1, -0.18, 0.02],
  [0.29, 0.09, -0.01],
] as const;

export function FrenchSystemField({
  activity,
  emphasis,
}: FrenchSystemFieldProps) {
  return (
    <group rotation={[Math.PI / 2.35, 0.08, -0.18]}>
      {[0.2, 0.31, 0.43].map((radius, index) => (
        <mesh key={radius} rotation={[0, 0, index * 0.42]}>
          <ringGeometry args={[radius, radius + 0.002, 96]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={index === 1 ? "#8ec9ff" : "#7588d8"}
            depthWrite={false}
            opacity={0.07 + emphasis * 0.035 + activity * 0.025}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}

      {signalNodes.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.006 + activity * 0.002, 10, 8]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={index % 2 === 0 ? "#e9f5ff" : "#8ec9ff"}
            depthWrite={false}
            opacity={0.44 + emphasis * 0.18 + activity * 0.16}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}
