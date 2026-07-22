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
    color: "#6d91bb",
    count: 880,
    length: 38,
    opacity: 0.24,
    phase: 0.4,
    position: [-7, 8, -30],
    rotation: [0.12, 0.34, -0.24],
    seed: 880_301,
    size: 0.1,
    width: 1.2,
  },
  {
    color: "#777aa8",
    count: 720,
    length: 48,
    opacity: 0.17,
    phase: 2.1,
    position: [13, -9, -48],
    rotation: [-0.16, -0.24, 0.31],
    seed: 420_119,
    size: 0.14,
    width: 1.65,
  },
  {
    color: "#5d829b",
    count: 620,
    length: 58,
    opacity: 0.12,
    phase: 4.3,
    position: [-19, -3, -76],
    rotation: [0.22, 0.18, 0.12],
    seed: 630_719,
    size: 0.18,
    width: 2.1,
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
}: Readonly<{ definition: FilamentDefinition }>) {
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
        opacity={definition.opacity}
        size={definition.size}
        sizeAttenuation
        toneMapped={false}
        transparent
        vertexColors
      />
    </Points>
  );
}

export function CosmicFilamentField({
  motionEnabled,
}: Readonly<{ motionEnabled: boolean }>) {
  const fieldGroup = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!motionEnabled || fieldGroup.current === null) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);
    fieldGroup.current.rotation.y += safeDelta * 0.00045;
    fieldGroup.current.rotation.z -= safeDelta * 0.00018;
  });

  return (
    <group ref={fieldGroup}>
      {filamentDefinitions.map((definition) => (
        <CosmicFilament definition={definition} key={definition.seed} />
      ))}
    </group>
  );
}
