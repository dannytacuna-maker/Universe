"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Group, Vector3 } from "three";

type SpatialLabelAnchorProps = Readonly<{
  anchorId: string;
}>;

const projectionBounds = 1.18;
const minimumCoordinateChange = 0.025;

export function SpatialLabelAnchor({ anchorId }: SpatialLabelAnchorProps) {
  const anchor = useRef<Group>(null);
  const element = useRef<HTMLElement | null>(null);
  const worldPosition = useRef(new Vector3());
  const projectedPosition = useRef(new Vector3());
  const lastX = useRef(Number.POSITIVE_INFINITY);
  const lastY = useRef(Number.POSITIVE_INFINITY);
  const lastVisibility = useRef<boolean | null>(null);

  useFrame(({ camera }) => {
    if (anchor.current === null) {
      return;
    }

    if (element.current === null || !element.current.isConnected) {
      element.current = document.querySelector<HTMLElement>(
        `[data-spatial-anchor="${anchorId}"]`,
      );
    }

    const label = element.current;

    if (label === null) {
      return;
    }

    anchor.current.getWorldPosition(worldPosition.current);
    projectedPosition.current.copy(worldPosition.current).project(camera);

    const x = (projectedPosition.current.x * 0.5 + 0.5) * 100;
    const y = (-projectedPosition.current.y * 0.5 + 0.5) * 100;
    const isVisible =
      projectedPosition.current.z >= -1 &&
      projectedPosition.current.z <= 1 &&
      Math.abs(projectedPosition.current.x) <= projectionBounds &&
      Math.abs(projectedPosition.current.y) <= projectionBounds;

    if (Math.abs(x - lastX.current) >= minimumCoordinateChange) {
      label.style.setProperty("--spatial-label-x", `${x.toFixed(3)}%`);
      lastX.current = x;
    }

    if (Math.abs(y - lastY.current) >= minimumCoordinateChange) {
      label.style.setProperty("--spatial-label-y", `${y.toFixed(3)}%`);
      lastY.current = y;
    }

    if (lastVisibility.current !== isVisible) {
      label.dataset.spatialProjected = String(isVisible);
      lastVisibility.current = isVisible;
    }
  });

  return <group ref={anchor} />;
}
