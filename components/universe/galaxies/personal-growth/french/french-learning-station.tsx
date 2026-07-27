"use client";

import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, DoubleSide, type Group } from "three";

import { SpatialLabelAnchor } from "../../../spatial-label-anchor";

import { frenchStationDefinition } from "./french-station-definition";

type FrenchLearningStationProps = Readonly<{
  isEmphasized: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  isVisible: boolean;
  motionEnabled: boolean;
  onActivate: () => void;
  onHoverChange: (isHovered: boolean) => void;
}>;

export function FrenchLearningStation({
  isEmphasized,
  isHovered,
  isInteractive,
  isVisible,
  motionEnabled,
  onActivate,
  onHoverChange,
}: FrenchLearningStationProps) {
  const station = useRef<Group>(null);
  const signalRing = useRef<Group>(null);

  useCursor(isHovered && isInteractive, "pointer", "auto");

  useFrame((_, delta) => {
    if (!motionEnabled || !isVisible) return;
    const safeDelta = Math.min(delta, 0.075);

    if (station.current !== null) {
      station.current.rotation.y += safeDelta * 0.014;
    }

    if (signalRing.current !== null) {
      signalRing.current.rotation.z -= safeDelta * 0.009;
    }
  });

  const emphasis = isEmphasized ? 1 : 0;
  const metalEmissive = isEmphasized ? "#1b384d" : "#071019";

  return (
    <group
      position={frenchStationDefinition.position}
      scale={isEmphasized ? 0.58 : 0.55}
      visible={isVisible}
    >
      <SpatialLabelAnchor
        anchorId={`planet:${frenchStationDefinition.id}`}
        enabled={isInteractive && isVisible}
      />

      <ambientLight color="#7592a8" intensity={0.34} />
      <directionalLight color="#d9efff" intensity={1.15} position={[2, 3, 4]} />
      <pointLight
        color="#65bce9"
        intensity={0.55}
        position={[-0.4, 0.25, 0.6]}
      />

      <group ref={station} rotation={[0.24, -0.34, -0.09]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.46, 28]} />
          <meshStandardMaterial
            color="#7f8b93"
            emissive={metalEmissive}
            emissiveIntensity={0.2}
            metalness={0.92}
            roughness={0.28}
          />
        </mesh>

        {[-0.25, 0.25].map((z) => (
          <group key={z} position={[0, 0, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.065, 0.078, 0.055, 24]} />
              <meshStandardMaterial
                color="#a6b0b5"
                metalness={0.94}
                roughness={0.22}
              />
            </mesh>
            <mesh position={[0, 0, z < 0 ? -0.032 : 0.032]}>
              <cylinderGeometry args={[0.038, 0.038, 0.018, 18]} />
              <meshStandardMaterial
                color="#323b43"
                metalness={0.98}
                roughness={0.18}
              />
            </mesh>
          </group>
        ))}

        <mesh>
          <torusGeometry args={[0.18, 0.027, 12, 64]} />
          <meshStandardMaterial
            color="#87959e"
            emissive={metalEmissive}
            emissiveIntensity={0.24}
            metalness={0.95}
            roughness={0.24}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[0.126, 0.006, 8, 56]} />
          <meshStandardMaterial
            color="#303a42"
            metalness={0.96}
            roughness={0.2}
          />
        </mesh>

        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.96, 0.024, 0.025]} />
          <meshStandardMaterial
            color="#59656d"
            metalness={0.96}
            roughness={0.3}
          />
        </mesh>

        {[-1, 1].flatMap((side) =>
          [-1, 1].map((bay) => (
            <group
              key={`${side}:${bay}`}
              position={[side * 0.34, bay * 0.1, 0.05]}
            >
              <mesh>
                <boxGeometry args={[0.3, 0.12, 0.012]} />
                <meshStandardMaterial
                  color="#183a59"
                  emissive={isEmphasized ? "#123653" : "#071728"}
                  emissiveIntensity={0.34}
                  metalness={0.58}
                  roughness={0.34}
                />
              </mesh>
              {[-0.1, 0, 0.1].map((x) => (
                <mesh key={x} position={[x, 0, 0.007]}>
                  <boxGeometry args={[0.004, 0.112, 0.003]} />
                  <meshBasicMaterial color="#7395ad" />
                </mesh>
              ))}
              {[-0.04, 0.04].map((panelY) => (
                <mesh key={panelY} position={[0, panelY, 0.007]}>
                  <boxGeometry args={[0.292, 0.003, 0.003]} />
                  <meshBasicMaterial color="#7395ad" />
                </mesh>
              ))}
            </group>
          )),
        )}

        {[-0.46, 0.46].map((x) => (
          <mesh key={x} position={[x, 0, 0.05]}>
            <octahedronGeometry args={[0.025, 0]} />
            <meshStandardMaterial
              color="#aeb7ba"
              metalness={0.94}
              roughness={0.2}
            />
          </mesh>
        ))}

        <group position={[0.11, 0.17, -0.02]} rotation={[-0.42, 0.18, 0]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.018, 0.14, 12]} />
            <meshStandardMaterial
              color="#8c989f"
              metalness={0.95}
              roughness={0.24}
            />
          </mesh>
          <mesh position={[0, 0.085, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <sphereGeometry
              args={[0.072, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.8]}
            />
            <meshStandardMaterial
              color="#a8b3b8"
              metalness={0.9}
              roughness={0.26}
              side={DoubleSide}
            />
          </mesh>
        </group>

        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.115, 0.08]}>
            <sphereGeometry args={[0.012, 12, 8]} />
            <meshBasicMaterial
              color={x < 0 ? "#e28b62" : "#8bd7ff"}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <group ref={signalRing} rotation={[Math.PI / 2.15, 0.1, 0]}>
        <mesh>
          <ringGeometry args={[0.57, 0.573, 112]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#8ec9ff"
            depthWrite={false}
            opacity={0.055 + emphasis * 0.055}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>

      <mesh scale={1 + emphasis * 0.08}>
        <sphereGeometry args={[0.36, 16, 10]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#6aaee8"
          depthWrite={false}
          opacity={0.018 + emphasis * 0.022}
          toneMapped={false}
          transparent
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
          <sphereGeometry args={[1.16, 16, 10]} />
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
