"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";

import {
  createGaussianRandom,
  createSeededRandom,
} from "../../../procedural-random";
import type { JiuJitsuProgress } from "./jiu-jitsu-progress";

type JiuJitsuSystemFieldProps = Readonly<{
  emphasis: number;
  progress: JiuJitsuProgress;
}>;

function createTrainingField() {
  const particleCount = 920;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(121_019);
  const deepTeal = new Color("#397d78");
  const mineralWhite = new Color("#dce9df");
  const quietViolet = new Color("#7f7897");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const band = index % 3;
    const angle = random() * Math.PI * 2;
    const radius = 0.18 + band * 0.11 + createGaussianRandom(random) * 0.018;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius * (0.42 + band * 0.08);
    positions[offset + 2] =
      createGaussianRandom(random) * (0.018 + band * 0.01);

    color
      .copy(random() < 0.1 ? quietViolet : deepTeal)
      .lerp(mineralWhite, 0.2 + random() * 0.52);
    const brightness = 0.4 + Math.pow(random(), 2.1) * 0.56;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

function createMarkerPositions() {
  const random = createSeededRandom(721_443);

  return Array.from({ length: 24 }, (_, index) => {
    const radius = 0.26 + (index % 3) * 0.115;
    const angle = index * 2.399_963 + random() * 0.15;

    return [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * (0.5 + (index % 3) * 0.04),
      0.012 + (index % 3) * 0.006,
    ] as const;
  });
}

export function JiuJitsuSystemField({
  emphasis,
  progress,
}: JiuJitsuSystemFieldProps) {
  const field = useMemo(() => createTrainingField(), []);
  const markerPositions = useMemo(() => createMarkerPositions(), []);
  const fieldOpacity = 0.34 + progress.depth * 0.28 + emphasis * 0.08;
  const guideOpacity = 0.09 + progress.consistency * 0.15 + emphasis * 0.04;

  return (
    <group rotation={[0.22, 0.05, -0.12]}>
      {[0.26, 0.375, 0.49].map((radius, index) => (
        <mesh key={radius} scale={[1, 0.5 + index * 0.04, 1]}>
          <ringGeometry args={[radius - 0.0015, radius, 112]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={index === 2 ? "#7d7898" : "#6ba59c"}
            depthWrite={false}
            opacity={guideOpacity * (1 - index * 0.14)}
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
          opacity={fieldOpacity}
          size={0.012 + progress.depth * 0.002}
          sizeAttenuation
          toneMapped={false}
          transparent
          vertexColors
        />
      </Points>

      {markerPositions.slice(0, progress.markerCount).map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.007, 10, 7]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#dce9df"
            depthWrite={false}
            opacity={0.68 + progress.recentAttention * 0.18}
            toneMapped={false}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}
