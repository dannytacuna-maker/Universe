"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";

import {
  createGaussianRandom,
  createSeededRandom,
} from "../../../procedural-random";

type ReadingSystemFieldProps = Readonly<{
  activity: number;
  emphasis: number;
}>;

const readingOrbits = [
  { color: "#a98cbd", radius: 0.2, rotation: [0.12, 0.08, -0.2] },
  { color: "#c5aa76", radius: 0.32, rotation: [-0.16, 0.12, 0.17] },
  { color: "#7f96b4", radius: 0.45, rotation: [0.24, -0.1, 0.06] },
] as const;

function createReadingField() {
  const particleCount = 620;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(805_721);
  const antiqueGold = new Color("#c9ad76");
  const libraryViolet = new Color("#907ba7");
  const paperWhite = new Color("#efe8d8");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const lane = index % readingOrbits.length;
    const angle = random() * Math.PI * 2;
    const radius = 0.2 + lane * 0.125 + createGaussianRandom(random) * 0.013;
    const pageWave = Math.sin(angle * 2 + lane * 1.4) * 0.018;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius * (0.48 + lane * 0.04);
    positions[offset + 2] =
      pageWave + createGaussianRandom(random) * (0.008 + lane * 0.004);

    color
      .copy(lane === 1 ? antiqueGold : libraryViolet)
      .lerp(paperWhite, 0.18 + Math.pow(random(), 2.3) * 0.58);
    const brightness = 0.38 + Math.pow(random(), 2.1) * 0.58;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

export function ReadingSystemField({
  activity,
  emphasis,
}: ReadingSystemFieldProps) {
  const field = useMemo(() => createReadingField(), []);

  return (
    <group>
      {readingOrbits.map((orbit, index) => (
        <mesh key={orbit.radius} rotation={orbit.rotation} scale={[1, 0.52, 1]}>
          <ringGeometry args={[orbit.radius - 0.0013, orbit.radius, 112]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={orbit.color}
            depthWrite={false}
            opacity={
              (0.068 + activity * 0.018 + emphasis * 0.045) * (1 - index * 0.11)
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
          opacity={0.31 + activity * 0.075 + emphasis * 0.1}
          size={0.0104 + activity * 0.0012}
          sizeAttenuation
          toneMapped={false}
          transparent
          vertexColors
        />
      </Points>
    </group>
  );
}
