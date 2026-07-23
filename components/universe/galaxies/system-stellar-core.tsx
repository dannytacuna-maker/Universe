"use client";

import { useMemo } from "react";
import { AdditiveBlending, Color } from "three";

import { StellarGlow } from "./university/stellar-glow";

const vertexShader = /* glsl */ `
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

const fragmentShader = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uHalo;
  uniform float uOpacity;

  varying vec3 vLocalPosition;
  varying vec3 vNormalDirection;
  varying vec3 vViewDirection;

  void main() {
    float facing = max(dot(vNormalDirection, vViewDirection), 0.0);
    float cell = sin(vLocalPosition.x * 91.0) * sin(vLocalPosition.y * 83.0);
    cell += sin((vLocalPosition.x + vLocalPosition.z) * 57.0) * 0.45;
    float granulation = 0.82 + cell * 0.055;
    float limb = 0.54 + pow(facing, 0.72) * 0.68;
    vec3 color = mix(uHalo, uCore, 0.42 + facing * 0.5) * granulation * limb;
    gl_FragColor = vec4(color, uOpacity);
  }
`;

type SystemStellarCoreProps = Readonly<{
  activity?: number;
  coreColor: string;
  emphasis: number;
  haloColor: string;
  radius: number;
}>;

export function SystemStellarCore({
  activity = 0,
  coreColor,
  emphasis,
  haloColor,
  radius,
}: SystemStellarCoreProps) {
  const uniforms = useMemo(
    () => ({
      uCore: { value: new Color(coreColor) },
      uHalo: { value: new Color(haloColor) },
      uOpacity: { value: 0.92 + emphasis * 0.06 },
    }),
    [coreColor, emphasis, haloColor],
  );
  const energy = emphasis * 0.02 + activity * 0.014;

  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 28, 20]} />
        <shaderMaterial
          blending={AdditiveBlending}
          fragmentShader={fragmentShader}
          toneMapped={false}
          transparent
          uniforms={uniforms}
          vertexShader={vertexShader}
        />
      </mesh>
      <StellarGlow
        color={haloColor}
        opacity={0.11 + energy}
        radius={radius * 3.7}
      />
      <StellarGlow
        color={coreColor}
        opacity={0.034 + energy * 0.55}
        radius={radius * 7.1}
      />
    </group>
  );
}
