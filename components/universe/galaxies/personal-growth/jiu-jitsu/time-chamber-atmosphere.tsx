"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  type Group,
  type ShaderMaterial,
} from "three";

import { createSeededRandom } from "../../../procedural-random";

const veilVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const veilFragmentShader = /* glsl */ `
  uniform vec3 uAuroraColor;
  uniform vec3 uHorizonColor;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 value) {
    return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 value) {
    vec2 cell = floor(value);
    vec2 local = fract(value);
    local = local * local * (3.0 - 2.0 * local);

    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
      local.y
    );
  }

  void main() {
    vec2 drift = vec2(uTime * 0.009, -uTime * 0.003);
    float broad = noise(vUv * vec2(3.2, 5.8) + drift);
    float detail = noise(vUv * vec2(7.8, 11.5) - drift * 0.55);
    float aurora = smoothstep(0.47, 0.72, broad * 0.76 + detail * 0.24);
    float skyMask = smoothstep(0.37, 0.58, vUv.y);
    float horizon = exp(-pow((vUv.y - 0.29) * 9.0, 2.0));
    float edgeMask = smoothstep(0.02, 0.14, vUv.x) * smoothstep(0.02, 0.14, 1.0 - vUv.x);
    float breath = 0.88 + sin(uTime * 0.16) * 0.12;
    float alpha = (aurora * skyMask * 0.07 + horizon * 0.055) * edgeMask * breath;
    vec3 color = mix(uHorizonColor, uAuroraColor, smoothstep(0.36, 0.82, vUv.y));

    gl_FragColor = vec4(color, alpha);
  }
`;

type TimeChamberAtmosphereProps = Readonly<{
  motionEnabled: boolean;
}>;

type TimeChamberVeilMaterial = ShaderMaterial & {
  uniforms: {
    uTime: { value: number };
  };
};

function createChamberMotes() {
  const count = 58;
  const positions = new Float32Array(count * 3);
  const random = createSeededRandom(732_401);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (random() - 0.5) * 9.8;
    positions[offset + 1] = 0.28 + random() * 5.1;
    positions[offset + 2] = -4.4 + random() * 4;
  }

  return positions;
}

export function TimeChamberAtmosphere({
  motionEnabled,
}: TimeChamberAtmosphereProps) {
  const veilMaterial = useRef<TimeChamberVeilMaterial>(null);
  const motesGroup = useRef<Group>(null);
  const elapsedTime = useRef(0);
  const motes = useMemo(() => createChamberMotes(), []);
  const uniforms = useMemo(
    () => ({
      uAuroraColor: { value: new Color("#62d5ca") },
      uHorizonColor: { value: new Color("#d7fff7") },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!motionEnabled) {
      return;
    }

    elapsedTime.current += Math.min(delta, 0.075);

    if (veilMaterial.current !== null) {
      veilMaterial.current.uniforms.uTime.value = elapsedTime.current;
    }

    if (motesGroup.current !== null) {
      motesGroup.current.position.x =
        Math.sin(elapsedTime.current * 0.08) * 0.08;
      motesGroup.current.position.y =
        Math.cos(elapsedTime.current * 0.11) * 0.05;
    }
  });

  return (
    <>
      <mesh position={[0, 1.1, -5.08]} renderOrder={1}>
        <planeGeometry args={[19.9, 11.2]} />
        <shaderMaterial
          blending={AdditiveBlending}
          depthWrite={false}
          fragmentShader={veilFragmentShader}
          ref={veilMaterial}
          toneMapped={false}
          transparent
          uniforms={uniforms}
          vertexShader={veilVertexShader}
        />
      </mesh>

      <group ref={motesGroup}>
        <Points positions={motes}>
          <PointMaterial
            blending={AdditiveBlending}
            color="#d8fff9"
            depthWrite={false}
            opacity={0.3}
            size={0.018}
            sizeAttenuation
            toneMapped={false}
            transparent
          />
        </Points>
      </group>
    </>
  );
}
