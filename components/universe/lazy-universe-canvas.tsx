"use client";

import dynamic from "next/dynamic";

export const LazyUniverseCanvas = dynamic(
  () =>
    import("./universe-scene-canvas").then(
      (module) => module.UniverseSceneCanvas,
    ),
  {
    loading: () => null,
    ssr: false,
  },
);
