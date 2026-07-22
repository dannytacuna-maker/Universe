"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";

import {
  createGaussianRandom,
  createSeededRandom,
} from "../../../procedural-random";
import { strengthWorkoutDayIds } from "./strength-physique-plan";
import type { StrengthProgress } from "./strength-physique-progress";

type StrengthPhysiqueSystemFieldProps = Readonly<{
  emphasis: number;
  progress: StrengthProgress;
}>;

function createStrengthField() {
  const particleCount = 680;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(412_887);
  const mineralGreen = new Color("#7f9678");
  const coolWhite = new Color("#edf2e9");
  const mutedGold = new Color("#aa9d76");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const lane = index % 6;
    const angle = random() * Math.PI * 2;
    const radius = 0.19 + lane * 0.047 + createGaussianRandom(random) * 0.012;
    const verticalOffset = (lane - 2.5) * 0.014;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] =
      Math.sin(angle) * radius * (0.46 + lane * 0.012) + verticalOffset;
    positions[offset + 2] =
      Math.sin(angle * 2 + lane * 0.8) * 0.022 +
      createGaussianRandom(random) * 0.012;

    color
      .copy(random() < 0.07 ? mutedGold : mineralGreen)
      .lerp(coolWhite, 0.22 + random() * 0.46);
    const brightness = 0.42 + Math.pow(random(), 2.2) * 0.5;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

const sessionMarkers = strengthWorkoutDayIds.map((id, index) => {
  const angle = -Math.PI * 0.72 + (index * (Math.PI * 1.44)) / 5;
  const radius = 0.47;

  return {
    id,
    position: [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.48,
      0.034 + Math.sin(angle * 2) * 0.018,
    ] as const,
  };
});

export function StrengthPhysiqueSystemField({
  emphasis,
  progress,
}: StrengthPhysiqueSystemFieldProps) {
  const field = useMemo(() => createStrengthField(), []);
  const fieldOpacity =
    0.3 + progress.weeklyCompletionRatio * 0.2 + emphasis * 0.07;
  const structureOpacity =
    0.07 + progress.personalRecordCount * 0.018 + emphasis * 0.035;

  return (
    <group rotation={[0.28, -0.08, 0.14]}>
      {[0.22, 0.29, 0.36, 0.43].map((radius, index) => (
        <mesh key={radius} scale={[1, 0.48 + index * 0.01, 1]}>
          <ringGeometry args={[radius - 0.0012, radius, 104]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={index === 3 ? "#a99d7d" : "#849b7c"}
            depthWrite={false}
            opacity={structureOpacity * (1 - index * 0.1)}
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
          size={0.011 + progress.weeklyCompletionRatio * 0.0015}
          sizeAttenuation
          toneMapped={false}
          transparent
          vertexColors
        />
      </Points>

      {sessionMarkers.map(({ id, position }, index) => {
        const isCompleted = index < progress.weeklyCompleted;

        return (
          <mesh key={id} position={position}>
            <sphereGeometry args={[isCompleted ? 0.011 : 0.006, 10, 7]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={isCompleted ? "#eef4e9" : "#758472"}
              depthWrite={false}
              opacity={isCompleted ? 0.82 : 0.24}
              toneMapped={false}
              transparent
            />
          </mesh>
        );
      })}
    </group>
  );
}
