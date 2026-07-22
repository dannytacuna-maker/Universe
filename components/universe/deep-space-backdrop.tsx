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

    vec3 base = vec3(0.0020, 0.0040, 0.0100);
    vec3 coolVariation = vec3(0.0120, 0.0250, 0.0550) * upperField;
    vec3 deepVariation = vec3(0.0080, 0.0160, 0.0340) * lowerField;
    vec3 planeVariation = vec3(0.0040, 0.0080, 0.0170) * distantPlane;
    vec3 blueCurrentColor = vec3(0.0120, 0.0350, 0.0750) * blueCurrent;
    vec3 violetCurrentColor = vec3(0.0180, 0.0180, 0.0520) * violetCurrent;

    vec3 background =
      base +
      coolVariation +
      deepVariation +
      planeVariation +
      blueCurrentColor +
      violetCurrentColor;

    gl_FragColor = vec4(max(background, vec3(0.0007, 0.0013, 0.0031)), 1.0);
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
