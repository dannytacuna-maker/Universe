"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import type { ReactNode } from "react";

type UniverseCanvasProps = Readonly<{
  children: ReactNode;
  className?: string;
  camera?: CanvasProps["camera"];
}>;

export function UniverseCanvas({
  camera,
  children,
  className,
}: UniverseCanvasProps) {
  return (
    <Canvas
      aria-hidden="true"
      camera={camera}
      className={className}
      dpr={[1, 1.35]}
      fallback={null}
      frameloop="demand"
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      {children}
    </Canvas>
  );
}
