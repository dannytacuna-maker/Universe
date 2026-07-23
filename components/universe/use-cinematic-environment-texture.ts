"use client";

import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import {
  LinearFilter,
  SRGBColorSpace,
  type Texture,
  VideoTexture,
} from "three";

type CinematicEnvironmentTextureOptions = Readonly<{
  motionEnabled: boolean;
  posterPath: string;
  videoPath: string;
}>;

type LoadedVideoTexture = Readonly<{
  texture: VideoTexture;
  token: symbol;
}>;

export function useCinematicEnvironmentTexture({
  motionEnabled,
  posterPath,
  videoPath,
}: CinematicEnvironmentTextureOptions): Texture {
  const invalidate = useThree((state) => state.invalidate);
  const posterTexture = useTexture(posterPath, (loadedTexture) => {
    loadedTexture.anisotropy = 8;
    loadedTexture.colorSpace = SRGBColorSpace;
  });
  const loadToken = useMemo(
    () => (motionEnabled ? Symbol(videoPath) : null),
    [motionEnabled, videoPath],
  );
  const [loadedVideoTexture, setLoadedVideoTexture] =
    useState<LoadedVideoTexture | null>(null);

  useEffect(() => {
    if (loadToken === null) {
      return;
    }

    let isMounted = true;
    const video = document.createElement("video");
    video.autoplay = false;
    video.crossOrigin = "anonymous";
    video.disablePictureInPicture = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoPath;
    video.setAttribute("aria-hidden", "true");

    const videoTexture = new VideoTexture(video);
    videoTexture.colorSpace = SRGBColorSpace;
    videoTexture.generateMipmaps = false;
    videoTexture.magFilter = LinearFilter;
    videoTexture.minFilter = LinearFilter;

    const play = () => {
      if (!document.hidden) {
        void video.play().catch(() => undefined);
      }
    };
    const handleLoadedData = () => {
      if (!isMounted) {
        return;
      }

      setLoadedVideoTexture({ texture: videoTexture, token: loadToken });
      play();
      invalidate();
    };
    const handleError = () => {
      if (!isMounted) {
        return;
      }

      setLoadedVideoTexture((currentTexture) =>
        currentTexture?.token === loadToken ? null : currentTexture,
      );
      invalidate();
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
        return;
      }

      play();
    };

    video.addEventListener("loadeddata", handleLoadedData, { once: true });
    video.addEventListener("error", handleError);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    video.load();

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoTexture.dispose();
    };
  }, [invalidate, loadToken, videoPath]);

  return loadToken !== null && loadedVideoTexture?.token === loadToken
    ? loadedVideoTexture.texture
    : posterTexture;
}
