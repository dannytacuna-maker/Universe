"use client";

import { useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";

import type { GalaxyDefinition } from "./galaxy-definition";

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uArmCount;
  uniform vec3 uCore;
  uniform float uFlocculent;
  uniform float uOpacity;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform float uTwist;

  varying vec2 vUv;

  void main() {
    vec2 point = (vUv - 0.5) * 2.0;
    float radius = length(point);
    float angle = atan(point.y, point.x);
    float envelope = 1.0 - smoothstep(0.18, 1.04, radius);
    float spiralPhase = angle * uArmCount - radius * uTwist * 6.2831853;
    float coherentArm = pow(0.5 + 0.5 * cos(spiralPhase), 6.8);
    float brokenArm = pow(0.5 + 0.5 * cos(spiralPhase), 3.4);
    float segmentation = 0.44 + 0.56 * pow(0.5 + 0.5 * sin(radius * 34.0 + angle * 2.0), 2.0);
    float arm = mix(coherentArm, brokenArm * segmentation, uFlocculent);
    float interarm = 0.5 + 0.5 * cos(spiralPhase + 1.35);
    float outerFade = smoothstep(0.02, 0.24, radius);
    float core = exp(-radius * radius * 19.0);
    float haze = envelope * outerFade * (0.105 + arm * 0.42 + interarm * 0.026);
    vec3 armColor = mix(uPrimary, uSecondary, 0.28 + arm * 0.52);
    vec3 color = mix(armColor, uCore, core * 0.84);
    float alpha = (haze * 0.52 + core * 0.24) * uOpacity;

    if (alpha < 0.001) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

type GalaxyLuminousVeilProps = Readonly<{
  definition: GalaxyDefinition;
  emphasis: number;
  presence: number;
}>;

function tupleToColor(tuple: readonly [number, number, number]) {
  return new Color(tuple[0], tuple[1], tuple[2]);
}

export function GalaxyLuminousVeil({
  definition,
  emphasis,
  presence,
}: GalaxyLuminousVeilProps) {
  const uniforms = useMemo(
    () => ({
      uArmCount: { value: definition.particleDistribution.armCount },
      uCore: { value: tupleToColor(definition.palette.core) },
      uFlocculent: {
        value: definition.morphology === "flocculent" ? 1 : 0,
      },
      uOpacity: { value: presence * (0.82 + emphasis * 0.14) },
      uPrimary: { value: tupleToColor(definition.palette.primary) },
      uSecondary: { value: tupleToColor(definition.palette.secondary) },
      uTwist: { value: definition.particleDistribution.twist },
    }),
    [definition, emphasis, presence],
  );
  const diameter = definition.particleDistribution.radius * 2.14;

  return (
    <mesh position={[0, 0, -0.018]} renderOrder={-1}>
      <planeGeometry args={[diameter, diameter, 1, 1]} />
      <shaderMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={fragmentShader}
        side={DoubleSide}
        toneMapped={false}
        transparent
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </mesh>
  );
}
