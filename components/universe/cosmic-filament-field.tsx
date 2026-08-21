"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, type Group } from "three";

import { createGaussianRandom, createSeededRandom } from "./procedural-random";

type FilamentDefinition = Readonly<{
  color: string;
  count: number;
  length: number;
  opacity: number;
  phase: number;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  seed: number;
  size: number;
  width: number;
}>;

type FilamentData = Readonly<{
  colors: Float32Array;
  positions: Float32Array;
}>;

const filamentDefinitions: readonly FilamentDefinition[] = [
  {
    color: "#8a6b4e",
    count: 960,
    length: 44,
    opacity: 0.22,
    phase: 0.4,
    position: [-11, -4, -34],
    rotation: [0.18, 0.28, -0.42],
    seed: 880_301,
    size: 0.1,
    width: 1.35,
  },
  {
    color: "#6d91bb",
    count: 820,
    length: 52,
    opacity: 0.18,
    phase: 2.1,
    position: [10, 6, -52],
    rotation: [-0.12, -0.2, 0.28],
    seed: 420_119,
    size: 0.13,
    width: 1.55,
  },
  {
    color: "#8a5574",
    count: 680,
    length: 36,
    opacity: 0.14,
    phase: 3.4,
    position: [-16, -8, -64],
    rotation: [0.26, 0.14, 0.2],
    seed: 511_013,
    size: 0.12,
    width: 1.4,
  },
  {
    color: "#5d829b",
    count: 640,
    length: 62,
    opacity: 0.11,
    phase: 4.3,
    position: [-22, -2, -82],
    rotation: [0.2, 0.16, 0.1],
    seed: 630_719,
    size: 0.17,
    width: 2.05,
  },
];

function createFilament(definition: FilamentDefinition): FilamentData {
  const random = createSeededRandom(definition.seed);
  const positions = new Float32Array(definition.count * 3);
  const colors = new Float32Array(definition.count * 3);
  const baseColor = new Color(definition.color);

  for (let index = 0; index < definition.count; index += 1) {
    const offset = index * 3;
    const progress = index / Math.max(definition.count - 1, 1);
    const longitudinalJitter = createGaussianRandom(random) * 0.18;
    const x = (progress - 0.5) * definition.length + longitudinalJitter;
    const wave = Math.sin(progress * Math.PI * 2.2 + definition.phase);
    const secondaryWave = Math.sin(
      progress * Math.PI * 4.4 + definition.phase * 0.7,
    );

    positions[offset] = x;
    positions[offset + 1] =
      wave * 2.6 +
      secondaryWave * 0.7 +
      createGaussianRandom(random) * definition.width;
    positions[offset + 2] =
      Math.cos(progress * Math.PI * 2 + definition.phase) * 1.6 +
      createGaussianRandom(random) * definition.width * 0.55;

    const brightness = 0.34 + Math.pow(random(), 2.4) * 0.56;
    colors[offset] = baseColor.r * brightness;
    colors[offset + 1] = baseColor.g * brightness;
    colors[offset + 2] = baseColor.b * brightness;
  }

  return { colors, positions };
}

function CosmicFilament({
  definition,
  opacityScale,
  sizeScale,
}: Readonly<{
  definition: FilamentDefinition;
  opacityScale: number;
  sizeScale: number;
}>) {
  const field = useMemo(() => createFilament(definition), [definition]);

  return (
    <Points
      colors={field.colors}
      position={definition.position}
      positions={field.positions}
      rotation={definition.rotation}
    >
      <PointMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        fog
        opacity={definition.opacity * opacityScale}
        size={definition.size * sizeScale}
        sizeAttenuation
        toneMapped={false}
        transparent
        vertexColors
      />
    </Points>
  );
}

export function CosmicFilamentField({
  insightIntensity = 0,
  motionEnabled,
}: Readonly<{ insightIntensity?: number; motionEnabled: boolean }>) {
  const fieldGroup = useRef<Group>(null);
  const boost = Math.min(1, Math.max(0, insightIntensity));
  const opacityScale = 1 + boost * 0.35;
  const sizeScale = 1 + boost * 0.12;

  useFrame((_, delta) => {
    if (!motionEnabled || fieldGroup.current === null) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);
    fieldGroup.current.rotation.y += safeDelta * (0.00045 + boost * 0.00035);
    fieldGroup.current.rotation.z -= safeDelta * (0.00018 + boost * 0.00012);
  });

  return (
    <group ref={fieldGroup} scale={1 + boost * 0.04}>
      {filamentDefinitions.map((definition) => (
        <CosmicFilament
          definition={definition}
          key={definition.seed}
          opacityScale={opacityScale}
          sizeScale={sizeScale}
        />
      ))}
    </group>
  );
}
