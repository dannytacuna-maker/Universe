"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, PointsMaterial } from "three";

import { createGaussianRandom, createSeededRandom } from "./procedural-random";

type StarLayerConfiguration = Readonly<{
  colorFloor: number;
  count: number;
  densityBias: number;
  innerRadius: number;
  opacity: number;
  outerRadius: number;
  rotation: readonly [number, number, number];
  seed: number;
  size: number;
}>;

type StarLayerData = Readonly<{
  colors: Float32Array;
  positions: Float32Array;
}>;

type ProceduralStarfieldProps = Readonly<{
  motionEnabled: boolean;
  presence: number;
}>;

const starLayers: readonly StarLayerConfiguration[] = [
  {
    colorFloor: 0.48,
    count: 420,
    densityBias: 0.05,
    innerRadius: 13,
    opacity: 0.9,
    outerRadius: 34,
    rotation: [0.08, 0.16, -0.04],
    seed: 104729,
    size: 0.045,
  },
  {
    colorFloor: 0.34,
    count: 900,
    densityBias: 0.08,
    innerRadius: 31,
    opacity: 0.72,
    outerRadius: 76,
    rotation: [-0.14, 0.05, 0.11],
    seed: 130363,
    size: 0.065,
  },
  {
    colorFloor: 0.24,
    count: 1600,
    densityBias: 0.11,
    innerRadius: 68,
    opacity: 0.55,
    outerRadius: 148,
    rotation: [0.03, -0.12, 0.07],
    seed: 155921,
    size: 0.1,
  },
  {
    colorFloor: 0.7,
    count: 148,
    densityBias: 0.03,
    innerRadius: 19,
    opacity: 0.92,
    outerRadius: 104,
    rotation: [-0.06, -0.08, -0.03],
    seed: 196613,
    size: 0.105,
  },
];

const densityAnchors = [
  [-0.62, 0.18, -0.76],
  [0.48, -0.38, -0.79],
  [0.08, 0.72, -0.68],
] as const;

function createStarDirection(random: () => number, densityBias: number) {
  if (random() < densityBias) {
    const anchorIndex = Math.min(
      Math.floor(random() * densityAnchors.length),
      densityAnchors.length - 1,
    );
    const anchor = densityAnchors[anchorIndex] ?? densityAnchors[0];
    const spread = 0.26 + random() * 0.2;
    const x = anchor[0] + createGaussianRandom(random) * spread;
    const y = anchor[1] + createGaussianRandom(random) * spread;
    const z = anchor[2] + createGaussianRandom(random) * spread;
    const length = Math.sqrt(x * x + y * y + z * z);

    return { x: x / length, y: y / length, z: z / length };
  }

  const y = random() * 2 - 1;
  const azimuth = random() * Math.PI * 2;
  const horizontalRadius = Math.sqrt(1 - y * y);

  return {
    x: Math.cos(azimuth) * horizontalRadius,
    y,
    z: Math.sin(azimuth) * horizontalRadius,
  };
}

function writeStarColor(
  colors: Float32Array,
  offset: number,
  random: () => number,
  brightness: number,
) {
  const temperature = random();

  if (temperature < 0.07) {
    colors[offset] = brightness;
    colors[offset + 1] = brightness * 0.78;
    colors[offset + 2] = brightness * 0.62;
    return;
  }

  if (temperature < 0.34) {
    colors[offset] = brightness * 0.66;
    colors[offset + 1] = brightness * 0.82;
    colors[offset + 2] = brightness;
    return;
  }

  if (temperature < 0.58) {
    colors[offset] = brightness * 0.82;
    colors[offset + 1] = brightness * 0.91;
    colors[offset + 2] = brightness;
    return;
  }

  colors[offset] = brightness * 0.94;
  colors[offset + 1] = brightness * 0.96;
  colors[offset + 2] = brightness;
}

function createStarLayer(configuration: StarLayerConfiguration): StarLayerData {
  const random = createSeededRandom(configuration.seed);
  const positions = new Float32Array(configuration.count * 3);
  const colors = new Float32Array(configuration.count * 3);
  const innerRadiusCubed = configuration.innerRadius ** 3;
  const outerRadiusCubed = configuration.outerRadius ** 3;

  for (let index = 0; index < configuration.count; index += 1) {
    const offset = index * 3;
    const direction = createStarDirection(random, configuration.densityBias);
    const radius = Math.cbrt(
      innerRadiusCubed + random() * (outerRadiusCubed - innerRadiusCubed),
    );

    positions[offset] = direction.x * radius;
    positions[offset + 1] = direction.y * radius;
    positions[offset + 2] = direction.z * radius;

    const brightness =
      configuration.colorFloor +
      Math.pow(random(), 3.4) * (1 - configuration.colorFloor) * 0.82;

    writeStarColor(colors, offset, random, brightness);
  }

  return { colors, positions };
}

function StarLayer({
  configuration,
  motionEnabled,
  presence,
}: {
  configuration: StarLayerConfiguration;
  motionEnabled: boolean;
  presence: number;
}) {
  const data = useMemo(() => createStarLayer(configuration), [configuration]);
  const material = useRef<PointsMaterial>(null);
  const layer = useRef<Group>(null);
  const sizeScale = 0.15 + presence * 0.85;
  const targetOpacity = configuration.opacity * presence;
  const targetSize = configuration.size * sizeScale;
  const parallaxRate = 0.0018 + configuration.innerRadius * 0.000012;

  useFrame((_, delta) => {
    if (!motionEnabled) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);

    if (layer.current !== null) {
      layer.current.rotation.y += safeDelta * parallaxRate;
      layer.current.rotation.x += safeDelta * parallaxRate * 0.28;
    }

    if (material.current === null) {
      return;
    }

    const damping = 1 - Math.exp(-safeDelta * 1.35);
    material.current.opacity +=
      (targetOpacity - material.current.opacity) * damping;
    material.current.size += (targetSize - material.current.size) * damping;
  });

  return (
    <group ref={layer} rotation={configuration.rotation}>
      <Points colors={data.colors} positions={data.positions}>
        <PointMaterial
          depthWrite={false}
          fog
          opacity={motionEnabled ? configuration.opacity : targetOpacity}
          ref={material}
          size={motionEnabled ? configuration.size : targetSize}
          sizeAttenuation
          toneMapped={false}
          transparent
          vertexColors
        />
      </Points>
    </group>
  );
}

export function ProceduralStarfield({
  motionEnabled,
  presence,
}: ProceduralStarfieldProps) {
  return (
    <group>
      {starLayers.map((configuration) => (
        <StarLayer
          configuration={configuration}
          key={configuration.seed}
          motionEnabled={motionEnabled}
          presence={presence}
        />
      ))}
    </group>
  );
}
