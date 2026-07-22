"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, BackSide, Color, type Group } from "three";

import type { PersonalGrowthPlanetDefinition } from "./personal-growth-planet-definition";

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

  void main() {
    float terrain = noise(vLocalPosition * 24.0) * 0.7 + noise(vLocalPosition * 53.0) * 0.3;
    float light = max(dot(vViewNormal, normalize(vec3(-0.55, 0.72, 0.58))), 0.0);
    float rim = pow(1.0 - abs(vViewNormal.z), 2.5);
    vec3 surface = mix(uBase, uAccent, smoothstep(0.28, 0.78, terrain));
    surface *= 0.3 + light * 0.88;
    surface += uAccent * rim * 0.32;

    gl_FragColor = vec4(surface, 1.0);
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

    planet.current.rotation.y += Math.min(delta, 0.075) * 0.024;
  });

  const radius =
    definition.kind === "program"
      ? 0.13
      : definition.kind === "library" || definition.kind === "time-chamber"
        ? 0.14
        : 0.115;
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
      <group ref={planet} rotation={[0.18, -0.22, 0.1]}>
        <mesh>
          <sphereGeometry args={[radius, 42, 30]} />
          <shaderMaterial
            fragmentShader={planetFragmentShader}
            uniforms={uniforms}
            vertexShader={planetVertexShader}
          />
        </mesh>
        {hasOrbit ? (
          <mesh rotation={[Math.PI / 2.45, 0.1, -0.16]}>
            <ringGeometry args={[radius * 1.42, radius * 1.48, 96]} />
            <meshBasicMaterial
              blending={AdditiveBlending}
              color={definition.palette.accent}
              depthWrite={false}
              opacity={0.24 + emphasis * 0.12}
              toneMapped={false}
              transparent
            />
          </mesh>
        ) : null}
      </group>

      <mesh scale={1.12}>
        <sphereGeometry args={[radius, 32, 24]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={definition.palette.atmosphere}
          depthWrite={false}
          opacity={0.1 + emphasis * 0.06}
          side={BackSide}
          toneMapped={false}
          transparent
        />
      </mesh>

      <mesh position={[radius * 1.75, radius * 0.5, 0.025]}>
        <sphereGeometry args={[radius * 0.12, 12, 8]} />
        <meshBasicMaterial
          color={definition.palette.accent}
          toneMapped={false}
        />
      </mesh>

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
          <sphereGeometry args={[0.25, 14, 10]} />
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
