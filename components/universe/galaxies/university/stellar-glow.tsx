"use client";

import { useMemo } from "react";
import { AdditiveBlending, Color } from "three";

type StellarGlowProps = Readonly<{
  color: string;
  opacity: number;
  radius: number;
}>;

const vertexShader = /* glsl */ `
  varying vec3 vNormalDirection;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormalDirection = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 glowColor;
  uniform float glowOpacity;
  varying vec3 vNormalDirection;
  varying vec3 vViewDirection;

  void main() {
    float facing = max(dot(vNormalDirection, vViewDirection), 0.0);
    float falloff = pow(facing, 4.5);
    gl_FragColor = vec4(glowColor, falloff * glowOpacity);
  }
`;

export function StellarGlow({ color, opacity, radius }: StellarGlowProps) {
  const uniforms = useMemo(
    () => ({
      glowColor: { value: new Color(color) },
      glowOpacity: { value: opacity },
    }),
    [color, opacity],
  );

  return (
    <mesh scale={radius}>
      <sphereGeometry args={[1, 24, 16]} />
      <shaderMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={fragmentShader}
        toneMapped={false}
        transparent
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </mesh>
  );
}
