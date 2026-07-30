"use client";

import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  PointsMaterial,
  Vector3,
  type Group,
  type Mesh,
  type Points as ThreePoints,
  type ShaderMaterial,
} from "three";

import { createGaussianRandom, createSeededRandom } from "./procedural-random";

type LivingAtmosphereProps = Readonly<{
  motionEnabled: boolean;
}>;

const dustCount = 220;
const meteorPointCount = 7;
const meteorIntervalSeconds = 16;
const meteorDurationSeconds = 0.95;

const nebulaDefinitions = [
  {
    color: "#6f8fb8",
    opacity: 0.028,
    phase: 0.4,
    position: [-38, 18, -92] as const,
    rotation: [0.42, -0.28, 0.16] as const,
    scale: [48, 28, 1] as const,
    speed: 0.018,
  },
  {
    color: "#7a6ea0",
    opacity: 0.022,
    phase: 1.7,
    position: [44, -22, -110] as const,
    rotation: [-0.3, 0.36, -0.12] as const,
    scale: [56, 34, 1] as const,
    speed: 0.014,
  },
  {
    color: "#5d8a9c",
    opacity: 0.018,
    phase: 2.9,
    position: [-12, -28, -128] as const,
    rotation: [0.18, 0.12, 0.4] as const,
    scale: [42, 26, 1] as const,
    speed: 0.011,
  },
] as const;

const nebulaVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uBreath;

  varying vec2 vUv;

  void main() {
    vec2 centered = vUv * 2.0 - 1.0;
    float radius = length(centered);
    float soft = smoothstep(1.0, 0.08, radius);
    float filament = exp(-pow(abs(centered.x * 0.72 + centered.y * 0.34), 2.0) * 3.4);
    float glow = soft * (0.55 + filament * 0.45) * (0.92 + uBreath * 0.08);
    gl_FragColor = vec4(uColor, glow * uOpacity);
  }
`;

function createDustField() {
  const random = createSeededRandom(742_019);
  const positions = new Float32Array(dustCount * 3);
  const colors = new Float32Array(dustCount * 3);

  for (let index = 0; index < dustCount; index += 1) {
    const offset = index * 3;
    const radius = 22 + random() * 70;
    const y = random() * 2 - 1;
    const azimuth = random() * Math.PI * 2;
    const horizontal = Math.sqrt(Math.max(0, 1 - y * y));
    positions[offset] = Math.cos(azimuth) * horizontal * radius;
    positions[offset + 1] = y * radius * 0.72;
    positions[offset + 2] = Math.sin(azimuth) * horizontal * radius - 18;

    const brightness = 0.28 + Math.pow(random(), 2.2) * 0.42;
    colors[offset] = brightness * 0.78;
    colors[offset + 1] = brightness * 0.86;
    colors[offset + 2] = brightness;
  }

  return { colors, positions };
}

function createMeteorGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(meteorPointCount * 3), 3),
  );
  geometry.setAttribute(
    "color",
    new BufferAttribute(new Float32Array(meteorPointCount * 3), 3),
  );
  return geometry;
}

function DistantNebula({
  color,
  motionEnabled,
  opacity,
  phase,
  position,
  rotation,
  scale,
  speed,
}: (typeof nebulaDefinitions)[number] & { motionEnabled: boolean }) {
  const mesh = useRef<Mesh>(null);
  const phaseTime = useRef(phase);
  const uniforms = useMemo(
    () => ({
      uBreath: { value: 0 },
      uColor: { value: new Color(color) },
      uOpacity: { value: opacity },
    }),
    [color, opacity],
  );

  useFrame((_, delta) => {
    if (!motionEnabled || mesh.current === null) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);
    phaseTime.current += safeDelta * speed;
    const material = mesh.current.material as ShaderMaterial;
    const breath = material.uniforms.uBreath;
    if (breath !== undefined) {
      breath.value = 0.5 + 0.5 * Math.sin(phaseTime.current);
    }
    mesh.current.rotation.z += safeDelta * speed * 0.015;
  });

  return (
    <mesh
      frustumCulled={false}
      position={position}
      ref={mesh}
      renderOrder={-2}
      rotation={rotation}
      scale={scale}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        depthWrite={false}
        fragmentShader={nebulaFragmentShader}
        side={DoubleSide}
        toneMapped={false}
        transparent
        uniforms={uniforms}
        vertexShader={nebulaVertexShader}
      />
    </mesh>
  );
}

function DriftingDust({ motionEnabled }: LivingAtmosphereProps) {
  const group = useRef<Group>(null);
  const data = useMemo(() => createDustField(), []);

  useFrame((_, delta) => {
    if (!motionEnabled || group.current === null) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);
    group.current.rotation.y += safeDelta * 0.0048;
    group.current.rotation.x += safeDelta * 0.0011;
  });

  return (
    <group ref={group}>
      <Points colors={data.colors} positions={data.positions}>
        <PointMaterial
          blending={AdditiveBlending}
          depthWrite={false}
          fog
          opacity={motionEnabled ? 0.22 : 0.14}
          size={0.038}
          sizeAttenuation
          toneMapped={false}
          transparent
          vertexColors
        />
      </Points>
    </group>
  );
}

function ShootingStar({ motionEnabled }: LivingAtmosphereProps) {
  const pointsRef = useRef<ThreePoints>(null);
  const progress = useRef(1);
  const cooldown = useRef(meteorIntervalSeconds * 0.45);
  const origin = useRef(new Vector3());
  const direction = useRef(new Vector3());
  const sample = useRef(new Vector3());
  const color = useRef(new Color("#c9e4f4"));
  const geometry = useMemo(() => createMeteorGeometry(), []);
  const random = useMemo(() => createSeededRandom(913_777), []);

  useFrame((_, delta) => {
    if (!motionEnabled) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);
    const points = pointsRef.current;
    if (points === null) {
      return;
    }

    if (progress.current >= 1) {
      cooldown.current -= safeDelta;
      points.visible = false;
      if (cooldown.current > 0) {
        return;
      }

      const height = 8 + random() * 10;
      const lateral = createGaussianRandom(random) * 14;
      origin.current.set(lateral, height, -28 - random() * 36);
      direction.current
        .set(-0.55 - random() * 0.35, -0.42 - random() * 0.28, -0.18)
        .normalize();
      color.current.setRGB(0.78 + random() * 0.18, 0.88, 0.96);
      const colors = geometry.getAttribute("color") as BufferAttribute;
      for (let index = 0; index < meteorPointCount; index += 1) {
        const fade = 1 - index / Math.max(meteorPointCount - 1, 1);
        colors.setXYZ(
          index,
          color.current.r * fade,
          color.current.g * fade,
          color.current.b * fade,
        );
      }
      colors.needsUpdate = true;
      progress.current = 0;
      cooldown.current = meteorIntervalSeconds + random() * 10;
      points.visible = true;
    }

    progress.current = Math.min(
      1,
      progress.current + safeDelta / meteorDurationSeconds,
    );

    const positions = geometry.getAttribute("position") as BufferAttribute;
    const travel = 18 + progress.current * 8;
    for (let index = 0; index < meteorPointCount; index += 1) {
      const trail = progress.current - index * 0.04;
      const clamped = Math.max(0, trail);
      sample.current
        .copy(origin.current)
        .addScaledVector(direction.current, clamped * travel);
      positions.setXYZ(
        index,
        sample.current.x,
        sample.current.y,
        sample.current.z,
      );
    }
    positions.needsUpdate = true;

    const material = points.material;
    if (material instanceof PointsMaterial) {
      material.opacity =
        progress.current < 0.18
          ? progress.current / 0.18
          : Math.max(0, 1 - (progress.current - 0.18) / 0.82) * 0.85;
    }

    if (progress.current >= 1) {
      points.visible = false;
    }
  });

  if (!motionEnabled) {
    return null;
  }

  return (
    <points frustumCulled={false} ref={pointsRef} visible={false}>
      <primitive attach="geometry" object={geometry} />
      <pointsMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        opacity={0.8}
        size={0.11}
        sizeAttenuation
        toneMapped={false}
        transparent
        vertexColors
      />
    </points>
  );
}

export function LivingAtmosphere({ motionEnabled }: LivingAtmosphereProps) {
  return (
    <group>
      {nebulaDefinitions.map((nebula) => (
        <DistantNebula
          key={`${nebula.position[0]}-${nebula.position[2]}`}
          motionEnabled={motionEnabled}
          {...nebula}
        />
      ))}
      <DriftingDust motionEnabled={motionEnabled} />
      <ShootingStar motionEnabled={motionEnabled} />
    </group>
  );
}
