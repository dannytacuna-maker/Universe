"use client";

import { BackSide } from "three";

const vertexShader = /* glsl */ `
  varying vec3 vDirection;

  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vDirection;

  void main() {
    vec3 direction = normalize(vDirection);

    float upperField = pow(
      max(dot(direction, normalize(vec3(-0.58, 0.36, -0.73))), 0.0),
      4.8
    );
    float lowerField = pow(
      max(dot(direction, normalize(vec3(0.61, -0.44, -0.66))), 0.0),
      5.4
    );
    float distantPlane = pow(
      max(1.0 - abs(dot(direction, normalize(vec3(0.24, 0.91, 0.34)))), 0.0),
      12.0
    );

    // Soft diagonal galactic band, inspired by dense milky star haze.
    float galacticPlane = pow(
      max(
        1.0 - abs(
          dot(direction, normalize(vec3(0.42, 0.78, 0.46))) -
          sin(direction.x * 1.9 - direction.z * 1.35) * 0.08
        ),
        0.0
      ),
      9.4
    );
    float galacticCore = pow(
      max(dot(direction, normalize(vec3(-0.52, -0.18, -0.84))), 0.0),
      5.6
    );

    float blueCurrent = pow(
      max(
        1.0 - abs(
          dot(direction, normalize(vec3(-0.18, 0.84, 0.51))) +
          sin(direction.x * 3.2 + direction.z * 1.7) * 0.12
        ),
        0.0
      ),
      18.0
    );
    float violetCurrent = pow(
      max(
        1.0 - abs(
          dot(direction, normalize(vec3(0.76, 0.24, -0.6))) -
          sin(direction.y * 2.7 - direction.z * 2.1) * 0.1
        ),
        0.0
      ),
      22.0
    );

    // Warm amber dust lane and magenta emission pocket.
    float amberDust = pow(
      max(dot(direction, normalize(vec3(-0.68, -0.34, -0.64))), 0.0),
      6.4
    ) * (0.35 + galacticCore * 0.35);
    float magentaBloom = pow(
      max(dot(direction, normalize(vec3(-0.46, -0.22, -0.86))), 0.0),
      28.0
    );
    float copperVeil = pow(
      max(dot(direction, normalize(vec3(-0.34, -0.48, -0.8))), 0.0),
      11.0
    );

    vec3 base = vec3(0.0014, 0.0026, 0.0072);
    vec3 coolVariation = vec3(0.0120, 0.0240, 0.0540) * upperField;
    vec3 deepVariation = vec3(0.0080, 0.0140, 0.0320) * lowerField;
    vec3 planeVariation = vec3(0.0040, 0.0080, 0.0160) * distantPlane;
    vec3 galacticHaze =
      vec3(0.0140, 0.0180, 0.0280) * galacticPlane +
      vec3(0.0160, 0.0160, 0.0200) * galacticCore * 0.35;
    vec3 blueCurrentColor = vec3(0.0120, 0.0340, 0.0720) * blueCurrent;
    vec3 violetCurrentColor = vec3(0.0180, 0.0160, 0.0500) * violetCurrent;
    vec3 amberDustColor = vec3(0.0160, 0.0100, 0.0060) * amberDust;
    vec3 copperDustColor = vec3(0.0100, 0.0060, 0.0040) * copperVeil;
    vec3 magentaNebula = vec3(0.0140, 0.0060, 0.0120) * magentaBloom;

    vec3 background =
      base +
      coolVariation +
      deepVariation +
      planeVariation +
      galacticHaze +
      blueCurrentColor +
      violetCurrentColor +
      amberDustColor +
      copperDustColor +
      magentaNebula;

    gl_FragColor = vec4(max(background, vec3(0.0005, 0.0009, 0.0022)), 1.0);
  }
`;

export function DeepSpaceBackdrop() {
  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[180, 32, 20]} />
      <shaderMaterial
        depthTest={false}
        depthWrite={false}
        fragmentShader={fragmentShader}
        side={BackSide}
        toneMapped={false}
        vertexShader={vertexShader}
      />
    </mesh>
  );
}
