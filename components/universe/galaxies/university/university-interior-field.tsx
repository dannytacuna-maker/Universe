"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, type Group } from "three";

import type { NavigationLevel } from "@/store/navigation-store";

import {
  createGaussianRandom,
  createSeededRandom,
} from "../../procedural-random";
import { universityGalaxyDefinition } from "../university-galaxy-definition";

type InteriorFieldData = Readonly<{
  colors: Float32Array;
  positions: Float32Array;
}>;

type UniversityInteriorFieldProps = Readonly<{
  motionEnabled: boolean;
  navigationLevel: NavigationLevel;
}>;

function createInteriorField(): InteriorFieldData {
  const particleCount = 2_600;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(710_731);
  const coolBlue = new Color("#789fca");
  const coolWhite = new Color("#e2edf6");
  const faintViolet = new Color("#8e86b5");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const progress = Math.pow(random(), 0.68);
    const armOrigin = (index % 4) * (Math.PI / 2);
    const angle =
      armOrigin +
      progress * Math.PI * 2.35 +
      createGaussianRandom(random) * (0.1 + progress * 0.16);
    const radius = 0.45 + progress * 3.15;
    const thickness = 0.12 + progress * 0.4;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius;
    positions[offset + 2] = createGaussianRandom(random) * thickness;

    const temperature = random();
    color
      .copy(temperature < 0.14 ? faintViolet : coolBlue)
      .lerp(coolWhite, 0.18 + Math.pow(random(), 1.8) * 0.58);
    const brightness = 0.48 + Math.pow(random(), 2.5) * 0.48;

    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

function createInteriorVolume(): InteriorFieldData {
  const particleCount = 1_100;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(902_419);
  const deepBlue = new Color("#3d6f9f");
  const coolCyan = new Color("#7bb9d4");
  const quietViolet = new Color("#7974a8");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const progress = Math.pow(random(), 0.76);
    const armOrigin = (index % 4) * (Math.PI / 2);
    const angle =
      armOrigin +
      progress * Math.PI * 2.28 +
      createGaussianRandom(random) * (0.15 + progress * 0.24);
    const radius =
      0.38 +
      progress * 3.3 +
      createGaussianRandom(random) * (0.035 + progress * 0.09);
    const depth = createGaussianRandom(random) * (0.18 + progress * 0.58);

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius;
    positions[offset + 2] =
      depth + Math.sin(angle * 1.7 + progress * 2.4) * 0.08;

    const temperature = random();
    color
      .copy(temperature < 0.18 ? quietViolet : deepBlue)
      .lerp(coolCyan, 0.12 + Math.pow(random(), 2.2) * 0.42);
    const brightness = 0.3 + Math.pow(random(), 2.8) * 0.42;

    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

function createInteriorHighlights(): InteriorFieldData {
  const particleCount = 180;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const random = createSeededRandom(512_927);
  const coolBlue = new Color("#9bbfe0");
  const coolWhite = new Color("#edf6fc");
  const paleViolet = new Color("#b1a9d2");
  const color = new Color();

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    const progress = Math.pow(random(), 0.72);
    const armOrigin = (index % 4) * (Math.PI / 2);
    const angle =
      armOrigin +
      progress * Math.PI * 2.35 +
      createGaussianRandom(random) * (0.08 + progress * 0.12);
    const radius = 0.55 + progress * 3;

    positions[offset] = Math.cos(angle) * radius;
    positions[offset + 1] = Math.sin(angle) * radius;
    positions[offset + 2] =
      createGaussianRandom(random) * (0.1 + progress * 0.32);

    color
      .copy(random() < 0.16 ? paleViolet : coolBlue)
      .lerp(coolWhite, 0.35 + random() * 0.5);
    const brightness = 0.68 + random() * 0.32;

    colors[offset] = color.r * brightness;
    colors[offset + 1] = color.g * brightness;
    colors[offset + 2] = color.b * brightness;
  }

  return { colors, positions };
}

export function UniversityInteriorField({
  motionEnabled,
  navigationLevel,
}: UniversityInteriorFieldProps) {
  const rotatingGroup = useRef<Group>(null);
  const highlightGroup = useRef<Group>(null);
  const volumeGroup = useRef<Group>(null);
  const field = useMemo(() => createInteriorField(), []);
  const highlights = useMemo(() => createInteriorHighlights(), []);
  const volume = useMemo(() => createInteriorVolume(), []);
  const opacity = navigationLevel === "galaxy" ? 0.56 : 0.07;
  const highlightOpacity = navigationLevel === "galaxy" ? 0.68 : 0.1;
  const volumeOpacity = navigationLevel === "galaxy" ? 0.32 : 0.045;
  const isVisible = navigationLevel !== "universe";

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);

    if (rotatingGroup.current !== null) {
      rotatingGroup.current.rotation.z += safeDelta * 0.0015;
    }

    if (highlightGroup.current !== null) {
      highlightGroup.current.rotation.z -= safeDelta * 0.0007;
    }

    if (volumeGroup.current !== null) {
      volumeGroup.current.rotation.x += safeDelta * 0.00022;
      volumeGroup.current.rotation.z += safeDelta * 0.00038;
    }
  });

  return (
    <group
      position={universityGalaxyDefinition.position}
      rotation={universityGalaxyDefinition.orientation}
      scale={1.32}
      visible={isVisible}
    >
      <group ref={rotatingGroup}>
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
      <group ref={highlightGroup}>
        <Points colors={highlights.colors} positions={highlights.positions}>
          <PointMaterial
            blending={AdditiveBlending}
            depthWrite={false}
            opacity={highlightOpacity}
            size={0.021}
            sizeAttenuation
            toneMapped={false}
            transparent
            vertexColors
          />
        </Points>
      </group>
      <group ref={volumeGroup}>
        <Points colors={volume.colors} positions={volume.positions}>
          <PointMaterial
            blending={AdditiveBlending}
            depthWrite={false}
            opacity={volumeOpacity}
            size={0.016}
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
