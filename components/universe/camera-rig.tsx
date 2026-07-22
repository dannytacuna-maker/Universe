"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";

import type { NavigationLevel } from "@/store/navigation-store";

import { getCameraPose } from "./universe-camera-poses";

const CAMERA_ZOOM_LIMITS = {
  galaxy: [0.72, 1.42],
  planet: [0.88, 1.16],
  system: [0.68, 1.48],
  universe: [0.78, 1.35],
} as const satisfies Record<
  NavigationLevel,
  readonly [minimum: number, maximum: number]
>;

const CAMERA_ZOOM_STEP = 0.08;
const WHEEL_ZOOM_SENSITIVITY = 0.00055;

type CameraRigProps = Readonly<{
  motionEnabled: boolean;
  navigationLevel: NavigationLevel;
  onArrive: () => void;
  resetToken: number;
  selectedGalaxyId: string | null;
  selectedPlanetId: string | null;
  selectedSystemId: string | null;
}>;

function getResponsiveFov(
  baseFov: number,
  navigationLevel: NavigationLevel,
  aspect: number,
) {
  if (aspect >= 1 || navigationLevel === "universe") {
    return baseFov;
  }

  const portraitAdjustment =
    (1 - aspect) * (navigationLevel === "galaxy" ? 34 : 20);
  const maximumFov = navigationLevel === "galaxy" ? 66 : 50;

  return Math.min(baseFov + portraitAdjustment, maximumFov);
}

export function CameraRig({
  motionEnabled,
  navigationLevel,
  onArrive,
  resetToken,
  selectedGalaxyId,
  selectedPlanetId,
  selectedSystemId,
}: CameraRigProps) {
  const getThreeState = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  const viewportSize = useThree((state) => state.size);
  const elapsedTime = useRef(0);
  const currentLookTarget = useRef(new Vector3(0, 0, 0));
  const destinationPosition = useRef(new Vector3());
  const destinationLookTarget = useRef(new Vector3());
  const ambientOffset = useRef(new Vector3());
  const transitionStartPosition = useRef(new Vector3(0, 0, 8));
  const transitionStartLook = useRef(new Vector3(0, 0, 0));
  const transitionStartFov = useRef(48);
  const transitionProgress = useRef(1);
  const hasReportedArrival = useRef(true);
  const currentZoom = useRef(1);
  const targetZoom = useRef(1);
  const zoomVector = useRef(new Vector3());
  const pose = getCameraPose(
    navigationLevel,
    selectedGalaxyId,
    selectedSystemId,
    selectedPlanetId,
  );
  const viewportAspect = viewportSize.width / viewportSize.height;
  const responsiveFov = getResponsiveFov(
    pose.fov,
    navigationLevel,
    viewportAspect,
  );
  const planetPortraitOffset =
    navigationLevel === "planet" && viewportAspect < 1
      ? MathUtils.clamp((1 - viewportAspect) * 1.4, 0, 0.72)
      : 0;
  const targetPosition = useMemo(
    () =>
      new Vector3(...pose.position).setX(
        pose.position[0] + planetPortraitOffset,
      ),
    [planetPortraitOffset, pose.position],
  );
  const targetLook = useMemo(
    () =>
      new Vector3(...pose.lookTarget).setX(
        pose.lookTarget[0] + planetPortraitOffset,
      ),
    [planetPortraitOffset, pose.lookTarget],
  );

  useEffect(() => {
    if (!motionEnabled) {
      return;
    }

    const camera = getThreeState().camera;

    transitionStartPosition.current.copy(camera.position);
    transitionStartLook.current.copy(currentLookTarget.current);
    transitionStartFov.current =
      camera instanceof PerspectiveCamera ? camera.fov : responsiveFov;
    transitionProgress.current = 0;
    hasReportedArrival.current = false;
    currentZoom.current = 1;
    targetZoom.current = 1;
    elapsedTime.current = 0;
    invalidate();
  }, [
    getThreeState,
    invalidate,
    motionEnabled,
    navigationLevel,
    onArrive,
    responsiveFov,
    resetToken,
    selectedGalaxyId,
    selectedPlanetId,
    selectedSystemId,
    targetLook,
    targetPosition,
  ]);

  useEffect(() => {
    if (motionEnabled) {
      return;
    }

    const camera = getThreeState().camera;

    elapsedTime.current = 0;
    currentZoom.current = 1;
    targetZoom.current = 1;
    camera.position.copy(targetPosition);
    currentLookTarget.current.copy(targetLook);
    camera.lookAt(targetLook);

    if (camera instanceof PerspectiveCamera) {
      camera.fov = responsiveFov;
      camera.updateProjectionMatrix();
    }

    camera.updateMatrixWorld();
    invalidate();
    onArrive();
  }, [
    getThreeState,
    invalidate,
    motionEnabled,
    onArrive,
    responsiveFov,
    targetLook,
    targetPosition,
  ]);

  useEffect(() => {
    const [minimumZoom, maximumZoom] = CAMERA_ZOOM_LIMITS[navigationLevel];

    const setZoom = (nextZoom: number) => {
      if (transitionProgress.current < 1) {
        return;
      }

      targetZoom.current = MathUtils.clamp(nextZoom, minimumZoom, maximumZoom);
      invalidate();
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        return;
      }

      const deltaScale =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? window.innerHeight
            : 1;
      const normalizedDelta = MathUtils.clamp(
        event.deltaY * deltaScale,
        -120,
        120,
      );

      setZoom(targetZoom.current + normalizedDelta * WHEEL_ZOOM_SENSITIVITY);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLSelectElement ||
          target instanceof HTMLTextAreaElement)
      ) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        setZoom(targetZoom.current - CAMERA_ZOOM_STEP);
      } else if (event.key === "-" || event.key === "_") {
        setZoom(targetZoom.current + CAMERA_ZOOM_STEP);
      } else if (event.key === "0") {
        setZoom(1);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [invalidate, navigationLevel]);

  useFrame(({ camera }, delta) => {
    const safeDelta = Math.min(delta, 0.075);

    if (!motionEnabled) {
      if (currentZoom.current === targetZoom.current) {
        return;
      }

      currentZoom.current = targetZoom.current;
      zoomVector.current.copy(targetPosition).sub(targetLook);
      camera.position
        .copy(targetLook)
        .addScaledVector(zoomVector.current, currentZoom.current);
      currentLookTarget.current.copy(targetLook);
      camera.lookAt(targetLook);
      camera.updateMatrixWorld();
      return;
    }

    if (transitionProgress.current < 1) {
      const duration =
        navigationLevel === "galaxy"
          ? 3.45
          : navigationLevel === "planet"
            ? 4.25
            : navigationLevel === "system"
              ? 3.15
              : 3.25;
      const progress = Math.min(
        1,
        transitionProgress.current + safeDelta / duration,
      );
      const easedProgress = progress * progress * (3 - 2 * progress);
      const travelArc = Math.sin(progress * Math.PI);
      const horizontalDirection = Math.sign(
        targetPosition.x - transitionStartPosition.current.x,
      );
      const arcHeight =
        navigationLevel === "galaxy"
          ? 0.34
          : navigationLevel === "planet"
            ? 0.28
            : 0.18;

      transitionProgress.current = progress;
      destinationPosition.current
        .lerpVectors(
          transitionStartPosition.current,
          targetPosition,
          easedProgress,
        )
        .add(
          ambientOffset.current.set(
            horizontalDirection * travelArc * 0.08,
            travelArc * arcHeight,
            -travelArc * 0.08,
          ),
        );
      destinationLookTarget.current.lerpVectors(
        transitionStartLook.current,
        targetLook,
        easedProgress,
      );

      camera.position.copy(destinationPosition.current);
      currentLookTarget.current.copy(destinationLookTarget.current);
      camera.lookAt(currentLookTarget.current);

      if (camera instanceof PerspectiveCamera) {
        camera.fov =
          transitionStartFov.current +
          (responsiveFov - transitionStartFov.current) * easedProgress -
          travelArc * 1.15;
        camera.updateProjectionMatrix();
      }

      camera.updateMatrixWorld();

      if (progress === 1 && !hasReportedArrival.current) {
        hasReportedArrival.current = true;
        onArrive();
      }

      return;
    }

    elapsedTime.current += safeDelta;
    const time = elapsedTime.current;
    const positionDamping = 1 - Math.exp(-safeDelta * 1.65);
    const lookDamping = 1 - Math.exp(-safeDelta * 2.05);
    const zoomDamping = 1 - Math.exp(-safeDelta * 5.5);

    currentZoom.current +=
      (targetZoom.current - currentZoom.current) * zoomDamping;
    zoomVector.current.copy(targetPosition).sub(targetLook);

    destinationPosition.current
      .copy(targetLook)
      .addScaledVector(zoomVector.current, currentZoom.current)
      .addScaledVector(
        ambientOffset.current.set(
          Math.sin(time * 0.105) * 0.075,
          Math.cos(time * 0.083) * 0.045,
          Math.sin(time * 0.061) * 0.028,
        ),
        pose.ambientScale,
      );

    destinationLookTarget.current
      .copy(targetLook)
      .add(
        ambientOffset.current
          .set(
            Math.sin(time * 0.071) * 0.035,
            Math.cos(time * 0.059) * 0.022,
            0,
          )
          .multiplyScalar(pose.ambientScale),
      );

    camera.position.lerp(destinationPosition.current, positionDamping);
    currentLookTarget.current.lerp(destinationLookTarget.current, lookDamping);
    camera.lookAt(currentLookTarget.current);

    if (camera instanceof PerspectiveCamera) {
      const nextFov =
        camera.fov + (responsiveFov - camera.fov) * positionDamping;

      if (Math.abs(nextFov - camera.fov) > 0.0001) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    }

    camera.updateMatrixWorld();
  });

  return null;
}
