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
} as const satisfies Record<EvidenceCometTarget, readonly [number, number, number]>;

const targetColors = {
  "personal-growth": "#9ad8c8",
  university: "#9ec8ef",
} as const satisfies Record<EvidenceCometTarget, string>;

type EvidenceCometProps = Readonly<{
  isVisible: boolean;
  motionEnabled: boolean;
}>;

export function EvidenceComet({ isVisible, motionEnabled }: EvidenceCometProps) {
  const [activeTarget, setActiveTarget] = useState<EvidenceCometTarget | null>(
    null,
  );
  const pointsRef = useRef<Points>(null);
  const progress = useRef(1);
  const positions = useMemo(() => new Float32Array(pointCount * 3), []);
  const colors = useMemo(() => new Float32Array(pointCount * 3), []);
  const color = useMemo(() => new Color("#9ec8ef"), []);
  const start = useMemo(() => new Vector3(0, 0.15, 6.2), []);
  const mid = useMemo(() => new Vector3(), []);
  const point = useMemo(() => new Vector3(), []);
  const destination = useMemo(() => new Vector3(), []);

  const pointsObject = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    const material = new PointsMaterial({
      blending: AdditiveBlending,
      depthWrite: false,
      opacity: 0.78,
      size: 0.09,
      sizeAttenuation: true,
      toneMapped: false,
      transparent: true,
      vertexColors: true,
    });
    return new Points(geometry, material);
  }, [colors, positions]);

  useEffect(() => {
    return () => {
      pointsObject.geometry.dispose();
      if (Array.isArray(pointsObject.material)) {
        pointsObject.material.forEach((material) => material.dispose());
      } else {
        pointsObject.material.dispose();
      }
    };
  }, [pointsObject]);

  useEffect(
    () =>
      subscribeToEvidenceComet((detail) => {
        if (!isVisible) {
          return;
        }

        progress.current = 0;
        color.set(targetColors[detail.target]);
        for (let index = 0; index < pointCount; index += 1) {
          colors[index * 3] = color.r;
          colors[index * 3 + 1] = color.g;
          colors[index * 3 + 2] = color.b;
        }
        const colorAttribute = pointsObject.geometry.getAttribute("color");
        colorAttribute.needsUpdate = true;
        setActiveTarget(detail.target);
      }),
    [color, colors, isVisible, pointsObject],
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

    destination.fromArray(targetPositions[activeTarget]);
    mid.copy(start).lerp(destination, 0.48);
    mid.y += 0.85;

    for (let index = 0; index < pointCount; index += 1) {
      const sample = Math.max(0, progress.current - index * 0.045);
      point.copy(start).lerp(mid, sample).lerp(destination, sample * sample);
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;
    }

    const positionAttribute = pointsObject.geometry.getAttribute("position");
    positionAttribute.needsUpdate = true;

    const material = pointsObject.material as PointsMaterial;
    material.opacity = 0.78 * (1 - progress.current * 0.35);

    if (progress.current >= 1) {
      setActiveTarget(null);
    }
  });

  if (activeTarget === null || !isVisible) {
    return null;
  }

  return <primitive object={pointsObject} ref={pointsRef} />;
}
