"use client";

import { useCursor } from "@react-three/drei";
import { type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DoubleSide, MathUtils, type Group, Vector3 } from "three";

type SolarSystemDiscProps = PropsWithChildren<
  Readonly<{
    center: readonly [number, number, number];
    enabled: boolean;
    initialRotation?: number;
    motionEnabled: boolean;
  }>
>;

type SolarSystemInteractionContextValue = Readonly<{
  shouldSuppressActivation: () => boolean;
}>;

const noInteraction = {
  shouldSuppressActivation: () => false,
} satisfies SolarSystemInteractionContextValue;

const SolarSystemInteractionContext =
  createContext<SolarSystemInteractionContextValue>(noInteraction);

const dragThreshold = 5;
const clickSuppressionWindowMs = 260;
const minimumAngularRadiusPx = 32;
const maximumAngularVelocity = 2.6;
const velocitySampleWeight = 0.42;
const releasePauseThresholdMs = 110;
const inertiaDamping = 1.65;
const inertiaStopVelocity = 0.006;

function normalizeAngularDelta(delta: number) {
  return Math.atan2(Math.sin(delta), Math.cos(delta));
}

export function useSolarSystemActivationGuard() {
  return useContext(SolarSystemInteractionContext).shouldSuppressActivation;
}

export function SolarSystemDisc({
  center,
  children,
  enabled,
  initialRotation = 0,
  motionEnabled,
}: SolarSystemDiscProps) {
  const getThreeState = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  const disc = useRef<Group>(null);
  const isDragging = useRef(false);
  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);
  const previousPointerAngle = useRef<number | null>(null);
  const previousSampleTime = useRef(0);
  const projectedCenter = useRef(new Vector3());
  const targetRotation = useRef(initialRotation);
  const angularVelocity = useRef(0);
  const dragEndedAt = useRef(Number.NEGATIVE_INFINITY);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const [isPointerOver, setIsPointerOver] = useState(false);
  const inverseCenter = useMemo(
    () => [-center[0], -center[1], -center[2]] as const,
    [center],
  );
  const contextValue = useMemo<SolarSystemInteractionContextValue>(
    () => ({
      shouldSuppressActivation: () =>
        performance.now() - dragEndedAt.current < clickSuppressionWindowMs,
    }),
    [],
  );

  useCursor(
    enabled && (isPointerOver || isPointerDragging),
    isPointerDragging ? "grabbing" : "grab",
    "auto",
  );

  useEffect(() => {
    targetRotation.current = initialRotation;
    angularVelocity.current = 0;

    if (disc.current !== null) {
      disc.current.rotation.z = initialRotation;
    }

    invalidate();
  }, [enabled, initialRotation, invalidate]);

  const getPointerAngle = useCallback(
    (clientX: number, clientY: number) => {
      const { camera, gl } = getThreeState();
      const canvasBounds = gl.domElement.getBoundingClientRect();

      projectedCenter.current
        .set(center[0], center[1], center[2])
        .project(camera);

      const centerX =
        canvasBounds.left +
        (projectedCenter.current.x * 0.5 + 0.5) * canvasBounds.width;
      const centerY =
        canvasBounds.top +
        (-projectedCenter.current.y * 0.5 + 0.5) * canvasBounds.height;
      const offsetX = clientX - centerX;
      const offsetY = clientY - centerY;

      if (Math.hypot(offsetX, offsetY) < minimumAngularRadiusPx) {
        return null;
      }

      return Math.atan2(offsetY, offsetX);
    },
    [center, getThreeState],
  );

  const finishDrag = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current) {
        return;
      }

      event.stopPropagation();
      isDragging.current = false;
      setIsPointerDragging(false);

      const travelDistance = Math.hypot(
        event.clientX - pointerStartX.current,
        event.clientY - pointerStartY.current,
      );

      if (travelDistance >= dragThreshold) {
        dragEndedAt.current = performance.now();

        const releasePause = event.timeStamp - previousSampleTime.current;

        if (!motionEnabled) {
          angularVelocity.current = 0;
        } else if (releasePause > releasePauseThresholdMs) {
          angularVelocity.current *= Math.exp(
            -(releasePause - releasePauseThresholdMs) / 85,
          );
        }
      } else {
        angularVelocity.current = 0;
      }

      const pointerTarget = event.nativeEvent.target;

      if (
        pointerTarget instanceof Element &&
        pointerTarget.hasPointerCapture(event.pointerId)
      ) {
        pointerTarget.releasePointerCapture(event.pointerId);
      }
      invalidate();
    },
    [invalidate, motionEnabled],
  );

  useFrame((_, delta) => {
    if (
      !enabled ||
      !motionEnabled ||
      isDragging.current ||
      disc.current === null ||
      Math.abs(angularVelocity.current) < inertiaStopVelocity
    ) {
      if (Math.abs(angularVelocity.current) < inertiaStopVelocity) {
        angularVelocity.current = 0;
      }

      return;
    }

    const safeDelta = Math.min(delta, 0.075);

    targetRotation.current += angularVelocity.current * safeDelta;
    angularVelocity.current *= Math.exp(-safeDelta * inertiaDamping);
    disc.current.rotation.z = targetRotation.current;
  });

  if (!enabled) {
    return children;
  }

  return (
    <SolarSystemInteractionContext.Provider value={contextValue}>
      <group position={center}>
        <group ref={disc} rotation={[0, 0, initialRotation]}>
          <group position={inverseCenter}>{children}</group>
        </group>

        <mesh
          position={[0, 0, -0.46]}
          onPointerCancel={finishDrag}
          onPointerDown={(event) => {
            event.stopPropagation();
            isDragging.current = true;
            pointerStartX.current = event.clientX;
            pointerStartY.current = event.clientY;
            previousPointerAngle.current = getPointerAngle(
              event.clientX,
              event.clientY,
            );
            previousSampleTime.current = event.timeStamp;
            angularVelocity.current = 0;
            setIsPointerDragging(true);
            const pointerTarget = event.nativeEvent.target;

            if (pointerTarget instanceof Element) {
              pointerTarget.setPointerCapture(event.pointerId);
            }
          }}
          onPointerEnter={() => setIsPointerOver(true)}
          onPointerLeave={() => {
            if (!isDragging.current) {
              setIsPointerOver(false);
            }
          }}
          onPointerMove={(event) => {
            if (!isDragging.current || disc.current === null) {
              return;
            }

            event.stopPropagation();

            const nextPointerAngle = getPointerAngle(
              event.clientX,
              event.clientY,
            );
            const previousAngle = previousPointerAngle.current;

            if (nextPointerAngle === null || previousAngle === null) {
              previousPointerAngle.current = nextPointerAngle;
              previousSampleTime.current = event.timeStamp;
              return;
            }

            const angularDelta = normalizeAngularDelta(
              nextPointerAngle - previousAngle,
            );
            const sampleDuration = MathUtils.clamp(
              (event.timeStamp - previousSampleTime.current) / 1000,
              1 / 240,
              0.08,
            );
            const sampledVelocity = MathUtils.clamp(
              angularDelta / sampleDuration,
              -maximumAngularVelocity,
              maximumAngularVelocity,
            );

            targetRotation.current += angularDelta;
            angularVelocity.current = MathUtils.lerp(
              angularVelocity.current,
              sampledVelocity,
              velocitySampleWeight,
            );
            previousPointerAngle.current = nextPointerAngle;
            previousSampleTime.current = event.timeStamp;
            disc.current.rotation.z = targetRotation.current;
            invalidate();
          }}
          onPointerUp={finishDrag}
        >
          <planeGeometry args={[8, 5.6]} />
          <meshBasicMaterial
            colorWrite={false}
            depthWrite={false}
            opacity={0}
            side={DoubleSide}
            transparent
          />
        </mesh>
      </group>
    </SolarSystemInteractionContext.Provider>
  );
}
