"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useMemo } from "react";

import { createGaussianRandom, createSeededRandom } from "./procedural-random";

type FormationKind = "cluster" | "elliptical";

type FormationDefinition = Readonly<{
  color: readonly [number, number, number];
  count: number;
  kind: FormationKind;
  opacity: number;
  position: readonly [number, number, number];
  radius: number;
  rotation: readonly [number, number, number];
  seed: number;
  size: number;
}>;

type FormationData = Readonly<{
  colors: Float32Array;
  positions: Float32Array;
}>;

const formations: readonly FormationDefinition[] = [
  {
    color: [0.48, 0.62, 0.82],
    count: 100,
    kind: "elliptical",
    opacity: 0.075,
    position: [17, 8, -72],
    radius: 2.6,
    rotation: [0.38, -0.22, 0.18],
    seed: 1_618_033,
    size: 0.11,
  },
  {
    color: [0.46, 0.5, 0.62],
    count: 94,
    kind: "elliptical",
    opacity: 0.055,
    position: [-24, -11, -90],
    radius: 3.4,
    rotation: [0.28, 0.26, -0.44],
    seed: 2_414_213,
    size: 0.15,
  },
  {
    color: [0.48, 0.42, 0.58],
    count: 54,
    kind: "cluster",
    opacity: 0.04,
    position: [-14, -6, -108],
    radius: 1.8,
    rotation: [0.12, -0.18, 0.2],
    seed: 1_414_213,
    size: 0.12,
  },
  {
    color: [0.52, 0.65, 0.8],
    count: 60,
    kind: "cluster",
    opacity: 0.07,
    position: [10, -14, -118],
    radius: 2.4,
    rotation: [0, 0, 0],
    seed: 1_732_050,
    size: 0.14,
  },
];

function writeFormationPosition(
  positions: Float32Array,
  offset: number,
  definition: FormationDefinition,
  random: () => number,
) {
  const scale = definition.kind === "elliptical" ? 0.42 : 0.3;
  const verticalScale = definition.kind === "elliptical" ? 0.56 : 0.82;

  positions[offset] =
    Math.tanh(createGaussianRandom(random) * 0.62) * definition.radius * scale;
  positions[offset + 1] =
    Math.tanh(createGaussianRandom(random) * 0.62) *
    definition.radius *
    scale *
    verticalScale;
  positions[offset + 2] =
    Math.tanh(createGaussianRandom(random) * 0.58) *
    definition.radius *
    scale *
    0.42;
}

function createFormation(definition: FormationDefinition): FormationData {
  const random = createSeededRandom(definition.seed);
  const positions = new Float32Array(definition.count * 3);
  const colors = new Float32Array(definition.count * 3);

  for (let index = 0; index < definition.count; index += 1) {
    const offset = index * 3;
    const brightness = 0.5 + Math.pow(random(), 2.2) * 0.46;

    writeFormationPosition(positions, offset, definition, random);
    colors[offset] = definition.color[0] * brightness;
    colors[offset + 1] = definition.color[1] * brightness;
    colors[offset + 2] = definition.color[2] * brightness;
  }

  return { colors, positions };
}

function Formation({ definition }: { definition: FormationDefinition }) {
  const data = useMemo(() => createFormation(definition), [definition]);

  return (
    <Points
      colors={data.colors}
      position={definition.position}
      positions={data.positions}
      rotation={definition.rotation}
    >
      <PointMaterial
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

export function DistantCelestialStructures() {
  return (
    <group>
      {formations.map((definition) => (
        <Formation key={definition.seed} definition={definition} />
      ))}
    </group>
  );
}
