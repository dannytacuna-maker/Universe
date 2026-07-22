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

    if (typeof window.requestAnimationFrame !== "function") {
      const timeoutId = window.setTimeout(() => setSupport(nextSupport), 0);

      return () => window.clearTimeout(timeoutId);
    }

    const frameId = window.requestAnimationFrame(() => {
      setSupport(nextSupport);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return support;
}
