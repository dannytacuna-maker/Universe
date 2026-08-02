"use client";

import { Points, PointMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, BackSide, Color, type Group } from "three";

import { createSeededRandom } from "../../procedural-random";

const backdropVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const backdropFragmentShader = /* glsl */ `
  uniform vec3 uAccent;
  uniform vec3 uBase;
  varying vec2 vUv;

  float hash(vec2 value) {
    return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float horizon = smoothstep(0.02, 0.82, vUv.y);
    float glow = exp(-pow((vUv.y - 0.34) * 4.1, 2.0));
    float stars = step(0.997, hash(floor(vUv * vec2(520.0, 280.0))));
    vec3 color = mix(uBase * 0.25, uBase * 0.72, horizon);
    color += uAccent * glow * 0.11;
    color += vec3(0.7, 0.78, 0.82) * stars * smoothstep(0.42, 0.82, vUv.y) * 0.42;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function createSurfaceMotes(seed: number) {
  const count = 64;
  const positions = new Float32Array(count * 3);
  const random = createSeededRandom(seed);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (random() - 0.5) * 8;
    positions[offset + 1] = 0.4 + random() * 4.7;
    positions[offset + 2] = -4 + random() * 3.5;
  }

  return positions;
}

type PersonalGrowthDestinationSurfaceProps = Readonly<{
  definition: Readonly<{
    kind?: string;
    landingOrigin: readonly [number, number, number];
    palette: Readonly<{
      accent: string;
      atmosphere: string;
      base: string;
    }>;
    seed: number;
  }>;
  isVisible: boolean;
  motionEnabled: boolean;
}>;

export function PersonalGrowthDestinationSurface({
  definition,
  isVisible,
  motionEnabled,
}: PersonalGrowthDestinationSurfaceProps) {
  const atmosphere = useRef<Group>(null);
  const uniforms = useMemo(
    () => ({
      uAccent: { value: new Color(definition.palette.accent) },
      uBase: { value: new Color(definition.palette.base) },
    }),
    [definition],
  );
  const motes = useMemo(
    () => createSurfaceMotes(definition.seed),
    [definition.seed],
  );

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible || atmosphere.current === null) {
      return;
    }

    atmosphere.current.rotation.y += Math.min(delta, 0.075) * 0.002;
  });

  const isTimeChamber = definition.kind === "time-chamber";
  const isLibrary = definition.kind === "library";

  return (
    <group position={definition.landingOrigin} visible={isVisible}>
      <mesh position={[0, 1.1, -5.2]}>
        <planeGeometry args={[19.6, 11.025]} />
        <shaderMaterial
          fragmentShader={backdropFragmentShader}
          uniforms={uniforms}
          vertexShader={backdropVertexShader}
        />
      </mesh>

      <mesh position={[0, -4.35, -1.8]} rotation={[-0.08, 0, 0]}>
        <sphereGeometry args={[4.8, 64, 40]} />
        <meshBasicMaterial color={definition.palette.base} />
      </mesh>
      <mesh position={[0, -4.35, -1.8]} scale={1.025}>
        <sphereGeometry args={[4.8, 48, 30]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={definition.palette.atmosphere}
          depthWrite={false}
          opacity={0.16}
          side={BackSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      {isTimeChamber ? (
        <group position={[0, 0.3, -3.8]}>
          {[-2.7, -1.35, 0, 1.35, 2.7].map((x) => (
            <mesh
              key={x}
              position={[x, 0.45, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <torusGeometry args={[1.3, 0.012, 8, 80]} />
              <meshBasicMaterial
                blending={AdditiveBlending}
                color={definition.palette.accent}
                depthWrite={false}
                opacity={0.14}
                toneMapped={false}
                transparent
              />
            </mesh>
          ))}
        </group>
      ) : null}

      {isLibrary ? (
        <group position={[0, 0.45, -4.15]}>
          {[1.55, 2.35, 3.15].map((radius, index) => (
            <mesh key={radius} rotation={[Math.PI / 2.15, 0, index * 0.38]}>
              <torusGeometry args={[radius, 0.012, 8, 96]} />
              <meshBasicMaterial
                blending={AdditiveBlending}
                color={definition.palette.accent}
                depthWrite={false}
                opacity={0.13 - index * 0.025}
                toneMapped={false}
                transparent
              />
            </mesh>
          ))}
        </group>
      ) : null}

      <group ref={atmosphere}>
        <Points positions={motes}>
          <PointMaterial
            blending={AdditiveBlending}
            color={definition.palette.accent}
            depthWrite={false}
            opacity={isLibrary || isTimeChamber ? 0.34 : 0.26}
            size={isLibrary ? 0.018 : 0.014}
            sizeAttenuation
            toneMapped={false}
            transparent
          />
        </Points>
      </group>
    </group>
  );
}
