"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, type Group } from "three";

import {
  createGaussianRandom,
  createSeededRandom,
} from "../../procedural-random";
import { forgeGalaxyDefinition } from "./forge-galaxy-definition";

type ForgeInteriorFieldProps = Readonly<{
  isVisible: boolean;
  motionEnabled: boolean;
  presence: number;
}>;

function createInteriorField() {
  const particleCount = 2_100;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(908_441);
  const deepCrimson = new Color("#6b1410");
  const ember = new Color("#d94a32");
  const whiteHeat = new Color("#ffe8dc");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const progress = Math.pow(random(), 0.72);
    const armOrigin = (index % 3) * ((Math.PI * 2) / 3);
    const angle =
      armOrigin +
      progress * Math.PI * 2.05 +
      createGaussianRandom(random) * (0.12 + progress * 0.2);
    const radius = 0.35 + progress * 3.05;
    const verticalWave = Math.sin(angle * 1.5) * 0.12 * progress;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius;
    positions[offset + 2] =
      verticalWave + createGaussianRandom(random) * (0.16 + progress * 0.5);

    color
      .copy(random() < 0.22 ? ember : deepCrimson)
      .lerp(whiteHeat, 0.1 + Math.pow(random(), 2.2) * 0.55);
    const brightness = 0.36 + Math.pow(random(), 2.4) * 0.52;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

export function ForgeInteriorField({
  isVisible,
  motionEnabled,
  presence,
}: ForgeInteriorFieldProps) {
  const group = useRef<Group>(null);
  const field = useMemo(() => createInteriorField(), []);

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible || group.current === null) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);
    group.current.rotation.z -= safeDelta * 0.0012;
    group.current.rotation.x += safeDelta * 0.00022;
  });

  return (
    <group
      position={forgeGalaxyDefinition.position}
      rotation={forgeGalaxyDefinition.orientation}
      scale={1.24}
      visible={isVisible}
    >
      <group ref={group}>
        <Points colors={field.colors} positions={field.positions}>
          <PointMaterial
            blending={AdditiveBlending}
            depthWrite={false}
            opacity={0.28 * presence}
            size={0.018}
            sizeAttenuation
            toneMapped={false}
            transparent
            vertexColors
          />
        </Points>
      </group>
    </group>
  );
}
