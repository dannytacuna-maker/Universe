"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, DoubleSide, type Group, type Mesh } from "three";

import { SpatialLabelAnchor } from "../../../spatial-label-anchor";
import { PlanetAtmosphere } from "../planet-atmosphere";
import { beerusPlanetDefinition } from "./beerus-planet-definition";

const planetVertexShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vViewNormal;

  void main() {
    vLocalPosition = position;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const noiseFunctions = /* glsl */ `
  float hash(vec3 value) {
    return fract(sin(dot(value, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
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
    float amplitude = 0.5;

    for (int octave = 0; octave < 4; octave += 1) {
      result += noise(value) * amplitude;
      value = value * 2.03 + vec3(1.7, 2.9, 0.8);
      amplitude *= 0.5;
    }

    return result;
  }
`;

const planetFragmentShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vViewNormal;

  ${noiseFunctions}

  void main() {
    float terrain = fbm(vLocalPosition * 17.0);
    float detail = fbm(vLocalPosition * 39.0 + vec3(4.3, 1.1, 2.7));
    float light = max(dot(vViewNormal, normalize(vec3(-0.48, 0.62, 0.72))), 0.0);
    float rim = pow(1.0 - abs(vViewNormal.z), 2.4);

    vec3 lowland = vec3(0.105, 0.045, 0.15);
    vec3 highland = vec3(0.43, 0.22, 0.52);
    vec3 bloom = vec3(0.68, 0.39, 0.73);
    vec3 surface = mix(lowland, highland, smoothstep(0.28, 0.72, terrain));
    surface = mix(surface, bloom, smoothstep(0.68, 0.9, detail) * 0.34);
    surface *= 0.32 + light * 0.92;
    surface += vec3(0.37, 0.18, 0.5) * rim * 0.42;

    gl_FragColor = vec4(surface, 1.0);
  }
`;

const cloudFragmentShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vViewNormal;

  ${noiseFunctions}

  void main() {
    float cloud = fbm(vLocalPosition * 31.0 + vec3(8.0, 3.0, 5.0));
    float alpha = smoothstep(0.57, 0.78, cloud) * 0.22;
    float rim = pow(1.0 - abs(vViewNormal.z), 2.0);
    vec3 color = mix(vec3(0.72, 0.63, 0.82), vec3(0.91, 0.78, 0.95), rim);

    gl_FragColor = vec4(color, alpha + rim * 0.025);
  }
`;

const orbitalDebris = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2 + (index % 3) * 0.09;
  const radius = 0.112 + (index % 4) * 0.005;

  return {
    id: index,
    position: [
      Math.cos(angle) * radius,
      Math.sin(angle * 1.7) * 0.028,
      Math.sin(angle) * radius * 0.58,
    ] as const,
    scale: 0.0018 + (index % 3) * 0.0007,
  };
});

type BeerusPlanetProps = Readonly<{
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function BeerusPlanet({
  isEmphasized,
  isHovered,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
}: BeerusPlanetProps) {
  const planet = useRef<Mesh>(null);
  const cloudShell = useRef<Mesh>(null);
  const debris = useRef<Group>(null);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);

    if (planet.current !== null) {
      planet.current.rotation.y += safeDelta * 0.032;
    }

    if (cloudShell.current !== null) {
      cloudShell.current.rotation.y -= safeDelta * 0.019;
      cloudShell.current.rotation.z += safeDelta * 0.003;
    }

    if (debris.current !== null) {
      debris.current.rotation.y += safeDelta * 0.006;
    }
  });

  const emphasis = isEmphasized ? 1 : 0;

  return (
    <group
      position={beerusPlanetDefinition.position}
      scale={isEmphasized ? 1.035 : 1}
      visible={isVisible}
    >
      <SpatialLabelAnchor anchorId={`planet:${beerusPlanetDefinition.id}`} />

      <mesh ref={planet} rotation={[0.12, 0.25, -0.08]}>
        <sphereGeometry args={[0.078, 48, 34]} />
        <shaderMaterial
          fragmentShader={planetFragmentShader}
          vertexShader={planetVertexShader}
        />
      </mesh>

      <mesh ref={cloudShell} rotation={[0.15, -0.2, -0.06]} scale={1.018}>
        <sphereGeometry args={[0.078, 42, 30]} />
        <shaderMaterial
          depthWrite={false}
          fragmentShader={cloudFragmentShader}
          transparent
          vertexShader={planetVertexShader}
        />
      </mesh>

      <PlanetAtmosphere color="#b77bdd" emphasis={emphasis} radius={0.078} />

      <group ref={debris} rotation={[Math.PI / 2.65, 0.08, 0.14]}>
        <mesh>
          <ringGeometry args={[0.112, 0.113, 120]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#c58ce0"
            depthWrite={false}
            opacity={0.12 + emphasis * 0.07}
            side={DoubleSide}
            toneMapped={false}
            transparent
          />
        </mesh>
        {orbitalDebris.map(({ id, position, scale }) => (
          <mesh key={id} position={position} scale={scale}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#b486bf" toneMapped={false} />
          </mesh>
        ))}
      </group>

      <mesh position={[0.116, 0.032, 0.014]}>
        <sphereGeometry args={[0.007, 16, 10]} />
        <meshBasicMaterial color="#e6d2b0" toneMapped={false} />
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
          <sphereGeometry args={[0.19, 16, 12]} />
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
