"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  PointsMaterial,
  Vector3,
} from "three";

import {
  subscribeToEvidenceComet,
  type EvidenceCometTarget,
} from "@/lib/living-universe";

import { personalGrowthGalaxyDefinition } from "./galaxies/personal-growth/personal-growth-galaxy-definition";
import { universityGalaxyDefinition } from "./galaxies/university-galaxy-definition";

const cometDurationSeconds = 1.15;
const pointCount = 6;

const targetPositions = {
  "personal-growth": personalGrowthGalaxyDefinition.position,
  university: universityGalaxyDefinition.position,
} as const satisfies Record<
  EvidenceCometTarget,
  readonly [number, number, number]
>;

const targetColors = {
  "personal-growth": "#9ad8c8",
  university: "#9ec8ef",
} as const satisfies Record<EvidenceCometTarget, string>;

type EvidenceCometProps = Readonly<{
  isVisible: boolean;
  motionEnabled: boolean;
}>;

export function EvidenceComet({
  isVisible,
  motionEnabled,
}: EvidenceCometProps) {
  const [activeTarget, setActiveTarget] = useState<EvidenceCometTarget | null>(
    null,
  );
  const pointsRef = useRef<Points>(null);
  const progress = useRef(1);
  const color = useRef(new Color("#9ec8ef"));
  const start = useRef(new Vector3(0, 0.15, 6.2));
  const mid = useRef(new Vector3());
  const point = useRef(new Vector3());
  const destination = useRef(new Vector3());
  const geometry = useMemo(() => {
    const next = new BufferGeometry();
    next.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(pointCount * 3), 3),
    );
    next.setAttribute(
      "color",
      new BufferAttribute(new Float32Array(pointCount * 3), 3),
    );
    return next;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(
    () =>
      subscribeToEvidenceComet((detail) => {
        if (!isVisible) {
          return;
        }

        progress.current = 0;
        color.current.set(targetColors[detail.target]);
        const colors = geometry.getAttribute("color") as BufferAttribute;
        for (let index = 0; index < pointCount; index += 1) {
          colors.setXYZ(
            index,
            color.current.r,
            color.current.g,
            color.current.b,
          );
        }
        colors.needsUpdate = true;
        setActiveTarget(detail.target);
      }),
    [geometry, isVisible],
  );

  useFrame((_, delta) => {
    if (activeTarget === null || progress.current >= 1) {
      return;
    }

    const step = motionEnabled ? Math.min(delta, 0.075) : 1;
    progress.current = Math.min(
      1,
      progress.current + step / cometDurationSeconds,
    );

    destination.current.fromArray(targetPositions[activeTarget]);
    mid.current.copy(start.current).lerp(destination.current, 0.48);
    mid.current.y += 0.85;

    const positions = geometry.getAttribute("position") as BufferAttribute;
    for (let index = 0; index < pointCount; index += 1) {
      const sample = Math.max(0, progress.current - index * 0.045);
      point.current
        .copy(start.current)
        .lerp(mid.current, sample)
        .lerp(destination.current, sample * sample);
      positions.setXYZ(
        index,
        point.current.x,
        point.current.y,
        point.current.z,
      );
    }
    positions.needsUpdate = true;

    const material = pointsRef.current?.material;
    if (material instanceof PointsMaterial) {
      material.opacity = 0.78 * (1 - progress.current * 0.35);
    }

    if (progress.current >= 1) {
      setActiveTarget(null);
    }
  });

  if (activeTarget === null || !isVisible) {
    return null;
  }

  return (
    <points ref={pointsRef}>
      <primitive attach="geometry" object={geometry} />
      <pointsMaterial
        blending={AdditiveBlending}
        depthWrite={false}
        opacity={0.78}
        size={0.09}
        sizeAttenuation
        toneMapped={false}
        transparent
        vertexColors
      />
    </points>
  );
}
