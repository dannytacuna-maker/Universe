"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";

import {
  createGaussianRandom,
  createSeededRandom,
} from "../../procedural-random";

type MappedCourseSystemFieldProps = Readonly<{
  emphasis: number;
  haloColor: string;
  orbitColor: string;
  seed: number;
}>;

function createMappedField(seed: number, haloColor: string) {
  const particleCount = 280;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(seed + 19);
  const halo = new Color(haloColor);
  const white = new Color("#edf6ff");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const lane = index % 3;
    const angle = random() * Math.PI * 2;
    const radius = 0.18 + lane * 0.105 + createGaussianRandom(random) * 0.01;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius * (0.45 + lane * 0.045);
    positions[offset + 2] = createGaussianRandom(random) * 0.009;

    color.copy(halo).lerp(white, 0.18 + random() * 0.44);
    const brightness = 0.32 + Math.pow(random(), 2.4) * 0.54;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

export function MappedCourseSystemField({
  emphasis,
  haloColor,
  orbitColor,
  seed,
}: MappedCourseSystemFieldProps) {
  const field = useMemo(
    () => createMappedField(seed, haloColor),
    [haloColor, seed],
  );
  const inclination = ((seed % 23) - 11) * 0.012;

  return (
    <group rotation={[0.12 + inclination, -0.04, inclination * 0.6]}>
      {[0.2, 0.305, 0.41].map((radius, index) => (
        <mesh key={radius} scale={[1, 0.46 + index * 0.045, 1]}>
          <ringGeometry args={[radius - 0.0012, radius, 96]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={orbitColor}
            depthWrite={false}
            opacity={(0.065 + emphasis * 0.04) * (1 - index * 0.14)}
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
          opacity={0.3 + emphasis * 0.08}
          size={0.01}
          sizeAttenuation
          toneMapped={false}
          transparent
          vertexColors
        />
      </Points>
    </group>
  );
}
