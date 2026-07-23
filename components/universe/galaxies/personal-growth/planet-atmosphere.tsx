"use client";

import { useMemo } from "react";
import { AdditiveBlending, BackSide, Color } from "three";

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
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec3 vNormalDirection;
  varying vec3 vViewDirection;

  void main() {
    float facing = abs(dot(vNormalDirection, vViewDirection));
    float rim = pow(1.0 - facing, 2.35);
    float outer = smoothstep(0.04, 0.95, rim);
    gl_FragColor = vec4(uColor, outer * uOpacity);
  }
`;

type PlanetAtmosphereProps = Readonly<{
  color: string;
  emphasis: number;
  radius: number;
}>;

export function PlanetAtmosphere({
  color,
  emphasis,
  radius,
}: PlanetAtmosphereProps) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uOpacity: { value: 0.28 + emphasis * 0.1 },
    }),
    [color, emphasis],
  );

  return (
    <mesh scale={1.095}>
      <sphereGeometry args={[radius, 40, 28]} />
      <shaderMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={fragmentShader}
        side={BackSide}
        toneMapped={false}
        transparent
        uniforms={uniforms}
        vertexShader={vertexShader}
      />
    </mesh>
  );
}
