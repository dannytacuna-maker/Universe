"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type Group,
  type Mesh,
} from "three";

import { SpatialLabelAnchor } from "../../spatial-label-anchor";
import type { PersonalGrowthPlanetDefinition } from "./personal-growth-planet-definition";
import { PlanetAtmosphere } from "./planet-atmosphere";

const planetVertexShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vViewNormal;

  void main() {
    vLocalPosition = position;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const planetFragmentShader = /* glsl */ `
  uniform vec3 uAccent;
  uniform vec3 uBase;
  uniform float uSeed;

  varying vec3 vLocalPosition;
  varying vec3 vViewNormal;

  float hash(vec3 value) {
    return fract(sin(dot(value, vec3(127.1, 311.7, 74.7)) + uSeed) * 43758.5453);
  }

  float noise(vec3 value) {
    vec3 cell = floor(value);
    vec3 blend = fract(value);
    blend = blend * blend * (3.0 - 2.0 * blend);

    return mix(
      mix(
        mix(hash(cell), hash(cell + vec3(1.0, 0.0, 0.0)), blend.x),
        mix(hash(cell + vec3(0.0, 1.0, 0.0)), hash(cell + vec3(1.0, 1.0, 0.0)), blend.x),
        blend.y
      ),
      mix(
        mix(hash(cell + vec3(0.0, 0.0, 1.0)), hash(cell + vec3(1.0, 0.0, 1.0)), blend.x),
        mix(hash(cell + vec3(0.0, 1.0, 1.0)), hash(cell + vec3(1.0, 1.0, 1.0)), blend.x),
        blend.y
      ),
      blend.z
    );
  }

  float fbm(vec3 value) {
    float result = 0.0;
    float amplitude = 0.52;

    for (int octave = 0; octave < 4; octave += 1) {
      result += noise(value) * amplitude;
      value = value * 2.01 + vec3(1.4, 2.8, 0.9);
      amplitude *= 0.5;
    }

    return result;
  }

  void main() {
    float terrain = fbm(vLocalPosition * 17.0 + vec3(uSeed * 19.0));
    float detail = fbm(vLocalPosition * 43.0 + vec3(7.0, uSeed * 31.0, 2.0));
    float latitude = abs(vLocalPosition.y);
    float climate = smoothstep(0.25, 0.88, latitude);
    float lightDirection = dot(vViewNormal, normalize(vec3(-0.55, 0.72, 0.58)));
    float light = smoothstep(-0.28, 0.74, lightDirection);
    float rim = pow(1.0 - abs(vViewNormal.z), 2.5);
    vec3 surface = mix(uBase, uAccent, smoothstep(0.31, 0.75, terrain));
    surface = mix(surface, uAccent * 1.12, smoothstep(0.69, 0.9, detail) * 0.28);
    surface = mix(surface, surface * 0.64 + uAccent * 0.17, climate * 0.34);
    surface *= 0.12 + light * 1.04;
    surface += uAccent * rim * (0.2 + light * 0.2);

    gl_FragColor = vec4(surface, 1.0);
  }
`;

const cloudFragmentShader = /* glsl */ `
  uniform vec3 uAccent;
  uniform float uSeed;

  varying vec3 vLocalPosition;
  varying vec3 vViewNormal;

  float hash(vec3 value) {
    return fract(sin(dot(value, vec3(127.1, 311.7, 74.7)) + uSeed) * 43758.5453);
  }

  float noise(vec3 value) {
    vec3 cell = floor(value);
    vec3 blend = fract(value);
    blend = blend * blend * (3.0 - 2.0 * blend);

    return mix(
      mix(
        mix(hash(cell), hash(cell + vec3(1.0, 0.0, 0.0)), blend.x),
        mix(hash(cell + vec3(0.0, 1.0, 0.0)), hash(cell + vec3(1.0, 1.0, 0.0)), blend.x),
        blend.y
      ),
      mix(
        mix(hash(cell + vec3(0.0, 0.0, 1.0)), hash(cell + vec3(1.0, 0.0, 1.0)), blend.x),
        mix(hash(cell + vec3(0.0, 1.0, 1.0)), hash(cell + vec3(1.0, 1.0, 1.0)), blend.x),
        blend.y
      ),
      blend.z
    );
  }

  void main() {
    float broad = noise(vLocalPosition * 23.0 + vec3(uSeed * 17.0));
    float detail = noise(vLocalPosition * 57.0 + vec3(4.1, 8.3, 1.7));
    float cloud = broad * 0.72 + detail * 0.28;
    float rim = pow(1.0 - abs(vViewNormal.z), 2.0);
    float alpha = smoothstep(0.58, 0.78, cloud) * 0.24 + rim * 0.018;
    vec3 color = mix(uAccent, vec3(0.92, 0.96, 1.0), 0.62);
    gl_FragColor = vec4(color, alpha);
  }
`;

type PersonalGrowthDestinationPlanetProps = Readonly<{
  definition: PersonalGrowthPlanetDefinition;
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function PersonalGrowthDestinationPlanet({
  definition,
  isEmphasized,
  isHovered,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
}: PersonalGrowthDestinationPlanetProps) {
  const planet = useRef<Group>(null);
  const cloudShell = useRef<Mesh>(null);
  const satelliteOrbit = useRef<Group>(null);
  const uniforms = useMemo(
    () => ({
      uAccent: { value: new Color(definition.palette.accent) },
      uBase: { value: new Color(definition.palette.base) },
      uSeed: { value: definition.seed / 1_000_000 },
    }),
    [definition],
  );

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible || planet.current === null) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);
    planet.current.rotation.y += safeDelta * 0.026;

    if (cloudShell.current !== null) {
      cloudShell.current.rotation.y -= safeDelta * 0.015;
      cloudShell.current.rotation.z += safeDelta * 0.002;
    }

    if (satelliteOrbit.current !== null) {
      satelliteOrbit.current.rotation.z += safeDelta * 0.009;
    }
  });

  const radius =
    definition.kind === "program"
      ? 0.052
      : definition.kind === "library" || definition.kind === "time-chamber"
        ? 0.058
        : 0.046;
  const hasOrbit =
    definition.kind === "library" ||
    definition.kind === "program" ||
    definition.kind === "time-chamber";
  const emphasis = isEmphasized ? 1 : 0;

  return (
    <group
      position={definition.position}
      scale={isEmphasized ? 1.045 : 1}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`planet:${definition.id}`}
        enabled={isInteractive && isVisible}
      />

      <group ref={planet} rotation={[0.18, -0.22, 0.1]}>
        <mesh>
          <sphereGeometry args={[radius, 42, 30]} />
          <shaderMaterial
            fragmentShader={planetFragmentShader}
            uniforms={uniforms}
            vertexShader={planetVertexShader}
          />
        </mesh>
      </group>

      <mesh ref={cloudShell} rotation={[0.21, 0.16, -0.08]} scale={1.018}>
        <sphereGeometry args={[radius, 38, 26]} />
        <shaderMaterial
          depthWrite={false}
          fragmentShader={cloudFragmentShader}
          transparent
          uniforms={uniforms}
          vertexShader={planetVertexShader}
        />
      </mesh>

      <PlanetAtmosphere
        color={definition.palette.atmosphere}
        emphasis={emphasis}
        radius={radius}
      />

      <group ref={satelliteOrbit} rotation={[Math.PI / 2.45, 0.1, -0.16]}>
        {hasOrbit ? (
          <mesh>
            <ringGeometry args={[radius * 1.46, radius * 1.49, 112]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={definition.palette.accent}
              depthWrite={false}
              opacity={0.18 + emphasis * 0.1}
              side={DoubleSide}
              toneMapped={false}
              transparent
            />
          </mesh>
        ) : null}
        <mesh position={[radius * 1.72, radius * 0.18, 0.025]}>
          <sphereGeometry args={[radius * 0.12, 14, 10]} />
          <meshBasicMaterial
            color={definition.palette.accent}
            toneMapped={false}
          />
        </mesh>
      </group>

      {isInteractive ? (
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            onActivate();
          }}
          onPointerOut={(event) => {
            event.stopPropagation();
            onHoverChange(false);
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            onHoverChange(true);
          }}
        >
          <sphereGeometry args={[0.17, 14, 10]} />
          <meshBasicMaterial
            colorWrite={false}
            depthWrite={false}
            opacity={0}
            transparent
          />
        </mesh>
      ) : null}
    </group>
  );
}
