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
import { DoubleSide, MathUtils, type Group } from "three";

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
const horizontalDragSensitivity = 0.0052;
const verticalDragSensitivity = 0.0016;

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
  const invalidate = useThree((state) => state.invalidate);
  const disc = useRef<Group>(null);
  const isDragging = useRef(false);
  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);
  const previousPointerX = useRef(0);
  const previousPointerY = useRef(0);
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
    [invalidate],
  );

  useFrame((_, delta) => {
    if (
      !enabled ||
      !motionEnabled ||
      isDragging.current ||
      disc.current === null ||
      Math.abs(angularVelocity.current) < 0.0002
    ) {
      return;
    }

    const safeDelta = Math.min(delta, 0.075);

    targetRotation.current += angularVelocity.current * safeDelta;
    angularVelocity.current *= Math.exp(-safeDelta * 2.85);
    disc.current.rotation.z = MathUtils.damp(
      disc.current.rotation.z,
      targetRotation.current,
      13,
      safeDelta,
    );
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
            previousPointerX.current = event.clientX;
            previousPointerY.current = event.clientY;
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

            const deltaX = event.clientX - previousPointerX.current;
            const deltaY = event.clientY - previousPointerY.current;
            const angularDelta =
              deltaX * horizontalDragSensitivity +
              deltaY * verticalDragSensitivity;

            targetRotation.current += angularDelta;
            angularVelocity.current = MathUtils.clamp(
              angularDelta * 15,
              -2.2,
              2.2,
            );
            previousPointerX.current = event.clientX;
            previousPointerY.current = event.clientY;
            disc.current.rotation.z = targetRotation.current;
            invalidate();
          }}
          onPointerUp={finishDrag}
        >
          <planeGeometry args={[5.4, 4.1]} />
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
