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

const cloudVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cloudFragmentShader = /* glsl */ `
  uniform vec3 uCloudColor;
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
    vec2 slowDrift = vec2(uTime * 0.022, uTime * 0.005);
    float broadCloud = noise(vUv * vec2(4.2, 3.1) + slowDrift);
    float fineCloud = noise(vUv * vec2(8.4, 6.2) - slowDrift * 0.82);
    float cloud = smoothstep(0.43, 0.73, broadCloud * 0.7 + fineCloud * 0.3);
    float skyMask = smoothstep(0.14, 0.4, vUv.y) * (1.0 - smoothstep(0.91, 1.0, vUv.y));
    float edgeMask = smoothstep(0.02, 0.16, vUv.x) * smoothstep(0.02, 0.16, 1.0 - vUv.x);
    float horizon = exp(-pow((vUv.y - 0.32) * 8.0, 2.0));
    float sweepPosition = 0.08 + fract(uTime * 0.018) * 0.84;
    float lightSweep = exp(-pow((vUv.x - sweepPosition) * 7.5, 2.0)) * horizon;
    float breathingLight = 0.78 + sin(uTime * 0.24) * 0.22;
    float alpha = (cloud * skyMask * 0.155 + horizon * 0.045 + lightSweep * 0.04) * edgeMask * breathingLight;
    vec3 color = mix(uHorizonColor, uCloudColor, smoothstep(0.3, 0.72, vUv.y));
    color += uHorizonColor * lightSweep * 0.18;

    gl_FragColor = vec4(color, alpha);
  }
`;

type BeerusSanctuaryAtmosphereProps = Readonly<{
  motionEnabled: boolean;
}>;

type AtmosphericParticles = Readonly<{
  dust: Float32Array;
  petals: Float32Array;
}>;

type SanctuaryCloudMaterial = ShaderMaterial & {
  uniforms: {
    uTime: { value: number };
  };
};

function createAtmosphericParticles(): AtmosphericParticles {
  const dustCount = 72;
  const petalCount = 24;
  const dust = new Float32Array(dustCount * 3);
  const petals = new Float32Array(petalCount * 3);
  const random = createSeededRandom(987_214);

  for (let index = 0; index < dustCount; index += 1) {
    const offset = index * 3;

    dust[offset] = (random() - 0.5) * 9.5;
    dust[offset + 1] = 0.35 + random() * 5.4;
    dust[offset + 2] = -4.6 + random() * 4.1;
  }

  for (let index = 0; index < petalCount; index += 1) {
    const offset = index * 3;

    petals[offset] = -3.7 + random() * 7.4;
    petals[offset + 1] = 0.55 + random() * 3.8;
    petals[offset + 2] = -2.8 + random() * 2.35;
  }

  return { dust, petals };
}

export function BeerusSanctuaryAtmosphere({
  motionEnabled,
}: BeerusSanctuaryAtmosphereProps) {
  const dustGroup = useRef<Group>(null);
  const petalGroup = useRef<Group>(null);
  const cloudMaterial = useRef<SanctuaryCloudMaterial>(null);
  const elapsedTime = useRef(0);
  const particles = useMemo(() => createAtmosphericParticles(), []);
  const cloudUniforms = useMemo(
    () => ({
      uCloudColor: { value: new Color("#ad80c7") },
      uHorizonColor: { value: new Color("#e7a5be") },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!motionEnabled) {
      return;
    }

    elapsedTime.current += Math.min(delta, 0.075);
    if (cloudMaterial.current !== null) {
      cloudMaterial.current.uniforms.uTime.value = elapsedTime.current;
    }

    if (dustGroup.current !== null) {
      dustGroup.current.position.x =
        Math.cos(elapsedTime.current * 0.1) * 0.055;
      dustGroup.current.position.y =
        Math.sin(elapsedTime.current * 0.16) * 0.08;
      dustGroup.current.rotation.z =
        Math.sin(elapsedTime.current * 0.09) * 0.005;
    }

    if (petalGroup.current !== null) {
      petalGroup.current.position.x =
        Math.sin(elapsedTime.current * 0.18) * 0.22;
      petalGroup.current.position.y =
        Math.cos(elapsedTime.current * 0.12) * 0.12;
      petalGroup.current.rotation.z =
        Math.sin(elapsedTime.current * 0.08) * 0.02;
    }
  });

  return (
    <>
      <mesh position={[0, 1.1, -5.08]} renderOrder={1}>
        <planeGeometry args={[19.9, 11.2]} />
        <shaderMaterial
          blending={AdditiveBlending}
          depthWrite={false}
          fragmentShader={cloudFragmentShader}
          ref={cloudMaterial}
          toneMapped={false}
          transparent
          uniforms={cloudUniforms}
          vertexShader={cloudVertexShader}
        />
      </mesh>

      <group ref={dustGroup}>
        <Points positions={particles.dust}>
          <PointMaterial
            blending={AdditiveBlending}
            color="#edc9ff"
            depthWrite={false}
            opacity={0.38}
            size={0.022}
            sizeAttenuation
            toneMapped={false}
            transparent
          />
        </Points>
      </group>

      <group ref={petalGroup}>
        <Points positions={particles.petals}>
          <PointMaterial
            blending={AdditiveBlending}
            color="#d98fca"
            depthWrite={false}
            opacity={0.52}
            size={0.038}
            sizeAttenuation
            toneMapped={false}
            transparent
          />
        </Points>
      </group>
    </>
  );
}
