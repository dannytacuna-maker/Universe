"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, type Group } from "three";

import { useCinematicEnvironmentTexture } from "../../../use-cinematic-environment-texture";
import { TimeChamberAtmosphere } from "./time-chamber-atmosphere";

const timeChamberTexturePath = "/assets/environments/time-chamber.webp";
const timeChamberVideoPath = "/assets/environments/time-chamber-cinematic.mp4";

type TimeChamberEnvironmentProps = Readonly<{
  motionEnabled: boolean;
}>;

export function TimeChamberEnvironment({
  motionEnabled,
}: TimeChamberEnvironmentProps) {
  const environmentPlate = useRef<Group>(null);
  const elapsedTime = useRef(0);
  const texture = useCinematicEnvironmentTexture({
    motionEnabled,
    posterPath: timeChamberTexturePath,
    videoPath: timeChamberVideoPath,
  });

  useFrame((_, delta) => {
    if (!motionEnabled || environmentPlate.current === null) {
      return;
    }

    elapsedTime.current += Math.min(delta, 0.075);
    environmentPlate.current.position.x =
      Math.sin(elapsedTime.current * 0.055) * 0.035;
    environmentPlate.current.position.y =
      Math.cos(elapsedTime.current * 0.045) * 0.018;
  });

  return (
    <group>
      <group ref={environmentPlate}>
        <mesh position={[0, 1.1, -5.2]}>
          <planeGeometry args={[19.9, 11.2]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>

        <mesh position={[0, 1.1, -5.12]} renderOrder={1}>
          <planeGeometry args={[19.9, 11.2]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#88ddd4"
            depthWrite={false}
            opacity={0.028}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>

      <TimeChamberAtmosphere motionEnabled={motionEnabled} />

      <mesh
        position={[1.55, -1.055, -0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1, 0.46, 1]}
      >
        <circleGeometry args={[0.48, 48]} />
        <meshBasicMaterial
          color="#16484b"
          depthWrite={false}
          opacity={0.24}
          transparent
        />
      </mesh>
    </group>
  );
}
