"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, type Group } from "three";

import {
  createGaussianRandom,
  createSeededRandom,
} from "../../procedural-random";
import { personalGrowthGalaxyDefinition } from "./personal-growth-galaxy-definition";

type PersonalGrowthInteriorFieldProps = Readonly<{
  isVisible: boolean;
  motionEnabled: boolean;
  presence: number;
}>;

function createInteriorField() {
  const particleCount = 2_200;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(418_207);
  const deepTeal = new Color("#326f72");
  const quietJade = new Color("#8ab2a6");
  const warmWhite = new Color("#e7eee5");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const progress = Math.pow(random(), 0.72);
    const armOrigin = (index % 3) * ((Math.PI * 2) / 3);
    const angle =
      armOrigin +
      progress * Math.PI * 2.05 +
      createGaussianRandom(random) * (0.12 + progress * 0.2);
    const radius = 0.35 + progress * 3.1;
    const verticalWave = Math.sin(angle * 1.5) * 0.12 * progress;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius;
    positions[offset + 2] =
      verticalWave + createGaussianRandom(random) * (0.16 + progress * 0.5);

    color
      .copy(random() < 0.18 ? quietJade : deepTeal)
      .lerp(warmWhite, 0.14 + Math.pow(random(), 2.2) * 0.58);
    const brightness = 0.34 + Math.pow(random(), 2.5) * 0.55;
    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

export function PersonalGrowthInteriorField({
  isVisible,
  motionEnabled,
  presence,
}: PersonalGrowthInteriorFieldProps) {
  const group = useRef<Group>(null);
  const field = useMemo(() => createInteriorField(), []);

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible || group.current === null) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);
    group.current.rotation.z -= safeDelta * 0.0011;
    group.current.rotation.x += safeDelta * 0.0002;
  });

  return (
    <group
      position={personalGrowthGalaxyDefinition.position}
      rotation={personalGrowthGalaxyDefinition.orientation}
      scale={1.27}
      visible={isVisible}
    >
      <group ref={group}>
        <Points colors={field.colors} positions={field.positions}>
          <PointMaterial
            blending={AdditiveBlending}
            depthWrite={false}
            opacity={0.48 * presence}
            size={0.013}
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
