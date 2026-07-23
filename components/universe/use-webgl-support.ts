"use client";

import { useEffect, useState } from "react";

export type WebGLSupport = "checking" | "available" | "unavailable";

const contextAttributes: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  failIfMajorPerformanceCaveat: true,
  powerPreference: "high-performance",
  stencil: false,
};

export function useWebGLSupport(): WebGLSupport {
  const [support, setSupport] = useState<WebGLSupport>("checking");

  useEffect(() => {
    const canvas = document.createElement("canvas");
    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;

    try {
      context =
        canvas.getContext("webgl2", contextAttributes) ??
        canvas.getContext("webgl", contextAttributes);
    } catch {
      context = null;
    }

    const nextSupport = context === null ? "unavailable" : "available";
    context?.getExtension("WEBGL_lose_context")?.loseContext();

    const commitSupport = () => setSupport(nextSupport);
    const timeoutId = window.setTimeout(commitSupport, 240);
    const frameId =
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame(commitSupport)
        : null;

    return () => {
      window.clearTimeout(timeoutId);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return support;
}
