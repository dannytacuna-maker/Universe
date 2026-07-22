"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";

import {
  createGaussianRandom,
  createSeededRandom,
} from "../../procedural-random";
import type { CourseMeeting, CourseWeekday } from "./course-system-definition";

type OrbitalFieldData = Readonly<{
  colors: Float32Array;
  positions: Float32Array;
}>;

type LogisticsOrbitalFieldProps = Readonly<{
  opacity: number;
  schedule: readonly CourseMeeting[];
  seed: number;
}>;

type OrbitalGuide = Readonly<{
  color: string;
  id: string;
  markerPosition: readonly [number, number, number];
  planePosition: readonly [number, number, number];
  radius: number;
  verticalScale: number;
}>;

const weekdayAngles: Record<CourseWeekday, number> = {
  friday: Math.PI * 0.16,
  monday: Math.PI * 1.14,
  thursday: Math.PI * 0.38,
  tuesday: Math.PI * 1.68,
  wednesday: Math.PI * 0.62,
};

const sessionColors = ["#7db8e8", "#8c8fd0"] as const;

function createOrbitalGuides(
  schedule: readonly CourseMeeting[],
): readonly OrbitalGuide[] {
  return schedule.map((meeting, index) => {
    const radius = 0.29 + index * 0.17;
    const verticalScale = 0.43 + index * 0.07;
    const angle = weekdayAngles[meeting.day];

    return {
      color: sessionColors[index] ?? sessionColors[0],
      id: `${meeting.day}-${meeting.room}`,
      markerPosition: [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * verticalScale,
        0.006 + index * 0.004,
      ],
      planePosition: [0, 0, -0.004 + index * 0.006],
      radius,
      verticalScale,
    };
  });
}

function createOrbitalField(seed: number): OrbitalFieldData {
  const particleCount = 1_080;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(seed);
  const coolWhite = new Color("#d8edff");
  const coolBlue = new Color("#689ed2");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const layer = index % 4;
    const angle = random() * Math.PI * 2;
    const radius = 0.2 + layer * 0.095 + createGaussianRandom(random) * 0.018;
    const offset = index * 3;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius * (0.38 + layer * 0.045);
    positions[offset + 2] =
      createGaussianRandom(random) * (0.008 + layer * 0.004);

    color.copy(coolBlue).lerp(coolWhite, 0.25 + random() * 0.55);
    const brightness = 0.42 + Math.pow(random(), 2.4) * 0.58;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

export function LogisticsOrbitalField({
  opacity,
  schedule,
  seed,
}: LogisticsOrbitalFieldProps) {
  const field = useMemo(() => createOrbitalField(seed), [seed]);
  const orbitalGuides = useMemo(
    () => createOrbitalGuides(schedule),
    [schedule],
  );

  return (
    <group>
      {orbitalGuides.map((guide) => (
        <group key={guide.id}>
          <mesh
            position={guide.planePosition}
            scale={[1, guide.verticalScale, 1]}
          >
            <ringGeometry args={[guide.radius - 0.0015, guide.radius, 128]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={guide.color}
              depthWrite={false}
              opacity={opacity * 0.3}
              side={DoubleSide}
              toneMapped={false}
              transparent
            />
          </mesh>
          <mesh position={guide.markerPosition}>
            <sphereGeometry args={[0.008, 12, 8]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={guide.color}
              depthWrite={false}
              opacity={opacity * 0.9}
              toneMapped={false}
              transparent
            />
          </mesh>
        </group>
      ))}
      <Points colors={field.colors} positions={field.positions}>
        <PointMaterial
          blending={AdditiveBlending}
          depthWrite={false}
          opacity={opacity}
          size={0.012}
          sizeAttenuation
          toneMapped={false}
          transparent
          vertexColors
        />
      </Points>
    </group>
  );
}
