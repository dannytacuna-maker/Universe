"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";

import {
  createGaussianRandom,
  createSeededRandom,
} from "../../procedural-random";

type FirmusSystemFieldProps = Readonly<{
  activity: number;
  emphasis: number;
}>;

const forgeOrbits = [
  { color: "#c94a3c", radius: 0.2, rotation: [0.18, 0.06, -0.14] as const },
  { color: "#e87a3a", radius: 0.33, rotation: [-0.12, 0.16, 0.1] as const },
  { color: "#8f241c", radius: 0.46, rotation: [0.2, -0.08, 0.12] as const },
] as const;

function createFirmusField() {
  const particleCount = 680;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(314_159);
  const ember = new Color("#e85a4f");
  const slag = new Color("#7a2a22");
  const whiteHeat = new Color("#fff1e8");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const lane = index % forgeOrbits.length;
    const angle = random() * Math.PI * 2;
    const radius = 0.19 + lane * 0.13 + createGaussianRandom(random) * 0.014;
    const spark = Math.sin(angle * 2.2 + lane) * 0.016;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius * (0.5 + lane * 0.05);
    positions[offset + 2] =
      spark + createGaussianRandom(random) * (0.008 + lane * 0.005);

    color
      .copy(lane === 1 ? ember : slag)
      .lerp(whiteHeat, 0.12 + Math.pow(random(), 2.1) * 0.62);
    const brightness = 0.4 + Math.pow(random(), 2) * 0.55;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

export function FirmusSystemField({
  activity,
  emphasis,
}: FirmusSystemFieldProps) {
  const field = useMemo(() => createFirmusField(), []);

  return (
    <group>
      {forgeOrbits.map((orbit, index) => (
        <mesh
          key={orbit.radius}
          rotation={[...orbit.rotation]}
          scale={[1, 0.55, 1]}
        >
          <ringGeometry args={[orbit.radius - 0.0014, orbit.radius, 112]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={orbit.color}
            depthWrite={false}
            opacity={
              (0.075 + activity * 0.02 + emphasis * 0.05) * (1 - index * 0.12)
            }
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}

      <Points colors={field.colors} positions={field.positions}>
        <PointMaterial
          blending={AdditiveBlending}
          depthWrite={false}
          opacity={0.34 + activity * 0.08 + emphasis * 0.1}
          size={0.0106 + activity * 0.0014}
          sizeAttenuation
          toneMapped={false}
          transparent
          vertexColors
        />
      </Points>
    </group>
  );
}
