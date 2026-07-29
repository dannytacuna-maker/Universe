"use client";

import { useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide } from "three";

const crystallineVertexShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vNormalDirection;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vLocalPosition = position;
    vNormalDirection = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const crystallineFragmentShader = /* glsl */ `
  uniform vec3 uAperture;
  uniform vec3 uCore;
  uniform vec3 uSignal;
  uniform float uOpacity;

  varying vec3 vLocalPosition;
  varying vec3 vNormalDirection;
  varying vec3 vViewDirection;

  void main() {
    float facing = max(dot(vNormalDirection, vViewDirection), 0.0);
    float fresnel = pow(1.0 - facing, 2.4);
    float facet = sin(vLocalPosition.x * 38.0) * sin(vLocalPosition.y * 41.0);
    facet += sin((vLocalPosition.x + vLocalPosition.z) * 29.0) * 0.42;
    float lattice = 0.82 + facet * 0.09;
    vec3 interior = mix(uSignal, uCore, 0.35 + facing * 0.48) * lattice;
    vec3 edge = mix(uAperture, uCore, 0.18 + fresnel * 0.72);
    vec3 color = mix(interior, edge, fresnel * 0.78);
    float alpha = (0.42 + fresnel * 0.52) * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

const dataVeilVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const dataVeilFragmentShader = /* glsl */ `
  uniform vec3 uAperture;
  uniform vec3 uSignal;
  uniform float uOpacity;

  varying vec2 vUv;

  float hexGrid(vec2 point, float scale) {
    vec2 grid = point * scale;
    vec2 hex = vec2(grid.x + grid.y * 0.5, grid.y * 0.8660254);
    vec2 cell = fract(hex) - 0.5;
    return 1.0 - smoothstep(0.38, 0.46, length(cell));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    float radius = length(uv);
    float envelope = 1.0 - smoothstep(0.08, 1.05, radius);
    float sweep = 0.5 + 0.5 * cos(atan(uv.y, uv.x) * 6.0 - radius * 9.5);
    float grid =
      hexGrid(uv, 7.5) * 0.55 +
      hexGrid(uv + vec2(0.08, 0.04), 12.0) * 0.28;
    float radial = smoothstep(0.02, 0.22, radius) * (1.0 - smoothstep(0.62, 0.98, radius));
    float haze = envelope * radial * (0.08 + grid * 0.34 + sweep * 0.06);
    vec3 color = mix(uSignal, uAperture, grid * 0.42 + sweep * 0.12);
    float alpha = haze * uOpacity;

    if (alpha < 0.002) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

type ObservatoryCrystallineCoreProps = Readonly<{
  apertureColor: string;
  coreColor: string;
  opacity: number;
  radius: number;
  signalColor: string;
}>;

export function ObservatoryCrystallineCore({
  apertureColor,
  coreColor,
  opacity,
  radius,
  signalColor,
}: ObservatoryCrystallineCoreProps) {
  const uniforms = useMemo(
    () => ({
      uAperture: { value: new Color(apertureColor) },
      uCore: { value: new Color(coreColor) },
      uOpacity: { value: opacity },
      uSignal: { value: new Color(signalColor) },
    }),
    [apertureColor, coreColor, opacity, signalColor],
  );

  return (
    <mesh>
      <icosahedronGeometry args={[radius, 1]} />
      <shaderMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={crystallineFragmentShader}
        toneMapped={false}
        transparent
        uniforms={uniforms}
        vertexShader={crystallineVertexShader}
      />
    </mesh>
  );
}

type ObservatoryDataVeilProps = Readonly<{
  apertureColor: string;
  opacity: number;
  signalColor: string;
}>;

export function ObservatoryDataVeil({
  apertureColor,
  opacity,
  signalColor,
}: ObservatoryDataVeilProps) {
  const uniforms = useMemo(
    () => ({
      uAperture: { value: new Color(apertureColor) },
      uOpacity: { value: opacity },
      uSignal: { value: new Color(signalColor) },
    }),
    [apertureColor, opacity, signalColor],
  );

  return (
    <mesh rotation={[-Math.PI / 2.35, 0.18, 0]}>
      <circleGeometry args={[1.28, 96]} />
      <shaderMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        fragmentShader={dataVeilFragmentShader}
        side={DoubleSide}
        toneMapped={false}
        transparent
        uniforms={uniforms}
        vertexShader={dataVeilVertexShader}
      />
    </mesh>
  );
}
