"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { AdditiveBlending, type Group, type MeshBasicMaterial } from "three";

type CosmicGuardianProps = Readonly<{
  isPortrait: boolean;
  motionEnabled: boolean;
  presence: number;
}>;

const guardianTexturePath = "/universe/super-shenron.png";
const guardianPlaneSize = [34.5, 19.4] as const;
const landscapePosition = [1.2, 2.8, -20] as const;
const portraitPosition = [-3.4, 3, -20] as const;
const inactivityDelayMilliseconds = 15_000;
const activityResetThrottleMilliseconds = 250;
const revealDurationSeconds = 9.8;
const activityEvents = [
  "pointermove",
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
] as const;

function smoothstep(start: number, end: number, value: number) {
  const progress = Math.min(Math.max((value - start) / (end - start), 0), 1);
  return progress * progress * (3 - 2 * progress);
}

export function CosmicGuardian({
  isPortrait,
  motionEnabled,
  presence,
}: CosmicGuardianProps) {
  const guardianGroup = useRef<Group>(null);
  const baseMaterial = useRef<MeshBasicMaterial>(null);
  const glowMaterial = useRef<MeshBasicMaterial>(null);
  const revealStartedAt = useRef<number | null>(null);
  const hasRevealed = useRef(false);
  const guardianTexture = useTexture(guardianTexturePath);

  useEffect(() => {
    let revealTimer: number | null = null;
    let lastActivityHandledAt = 0;

    const concealGuardian = () => {
      revealStartedAt.current = null;

      if (guardianGroup.current !== null) {
        guardianGroup.current.visible = false;
      }

      if (baseMaterial.current !== null) {
        baseMaterial.current.opacity = 0;
      }

      if (glowMaterial.current !== null) {
        glowMaterial.current.opacity = 0;
      }
    };

    const clearRevealTimer = () => {
      if (revealTimer !== null) {
        window.clearTimeout(revealTimer);
        revealTimer = null;
      }
    };

    const scheduleReveal = () => {
      clearRevealTimer();
      concealGuardian();

      if (
        hasRevealed.current ||
        !motionEnabled ||
        presence < 0.9 ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      revealTimer = window.setTimeout(() => {
        hasRevealed.current = true;
        revealStartedAt.current = performance.now() / 1_000;

        if (guardianGroup.current !== null) {
          guardianGroup.current.visible = true;
        }
      }, inactivityDelayMilliseconds);
    };

    const handleActivity = () => {
      if (hasRevealed.current) {
        return;
      }

      const now = performance.now();

      if (now - lastActivityHandledAt < activityResetThrottleMilliseconds) {
        return;
      }

      lastActivityHandledAt = now;
      scheduleReveal();
    };

    const handleVisibilityChange = () => {
      scheduleReveal();
    };

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleReveal();

    return () => {
      clearRevealTimer();
      concealGuardian();

      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, handleActivity);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [motionEnabled, presence]);

  useFrame(() => {
    if (
      !motionEnabled ||
      presence < 0.1 ||
      guardianGroup.current === null ||
      baseMaterial.current === null ||
      glowMaterial.current === null ||
      revealStartedAt.current === null
    ) {
      return;
    }

    const elapsed = performance.now() / 1_000 - revealStartedAt.current;

    if (elapsed >= revealDurationSeconds) {
      revealStartedAt.current = null;
      guardianGroup.current.visible = false;
      baseMaterial.current.opacity = 0;
      glowMaterial.current.opacity = 0;
      return;
    }

    const shimmerArrival = smoothstep(0, 2.2, elapsed);
    const faceArrival = smoothstep(2.2, 5.2, elapsed);
    const departure = 1 - smoothstep(6.2, revealDurationSeconds, elapsed);
    const bodyPresence = Math.min(0.14 + faceArrival * 0.86, 1) * departure;
    const shimmerPresence =
      Math.min(shimmerArrival * 0.22 + faceArrival * 0.78, 1) * departure;

    baseMaterial.current.opacity = 0.1 * presence * bodyPresence;
    glowMaterial.current.opacity = 0.31 * presence * shimmerPresence;

    guardianGroup.current.position.x = Math.sin(elapsed * 0.19) * 0.028;
    guardianGroup.current.position.y = Math.cos(elapsed * 0.15) * 0.035;
    guardianGroup.current.rotation.z =
      -0.018 + Math.sin(elapsed * 0.12) * 0.0018;
  });

  return (
    <group
      position={isPortrait ? portraitPosition : landscapePosition}
      scale={isPortrait ? 0.76 : 1}
      visible={presence > 0.02}
    >
      <group ref={guardianGroup} rotation={[0, 0, -0.018]} visible={false}>
        <mesh renderOrder={-4}>
          <planeGeometry args={guardianPlaneSize} />
          <meshBasicMaterial
            ref={baseMaterial}
            alphaTest={0.002}
            color="#d8b477"
            depthWrite={false}
            map={guardianTexture}
            opacity={0}
            toneMapped={false}
            transparent
          />
        </mesh>

        <mesh position={[0, 0, 0.012]} renderOrder={-3} scale={1.003}>
          <planeGeometry args={guardianPlaneSize} />
          <meshBasicMaterial
            ref={glowMaterial}
            alphaTest={0.003}
            blending={AdditiveBlending}
            color="#fff0c2"
            depthWrite={false}
            map={guardianTexture}
            opacity={0}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>
    </group>
  );
}
