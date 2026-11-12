import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { surfaceStore } from "@/lib/surface-store";

/**
 * Interactive Camera Orbit, Pan & Pinch-Zoom Controller for Mars Surface Operations.
 * Direct event integration with the Three.js WebGL canvas context.
 */
export function SurfaceCamera() {
  const { gl } = useThree();
  const isDragging = useRef(false);
  const dragButton = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);

  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return;

    const onPointerDown = (e: PointerEvent) => {
      const state = surfaceStore.get();
      if (!state.isActive) return;

      isDragging.current = true;
      dragButton.current = e.button;
      lastPos.current = { x: e.clientX, y: e.clientY };

      try {
        dom.setPointerCapture?.(e.pointerId);
      } catch {
        // Ignored in test/headless environments
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = surfaceStore.get();
      if (!state.isActive || !isDragging.current) return;

      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };

      if (dragButton.current === 0) {
        // Left click / Touch drag: Orbit camera azimuth & elevation
        const dAzimuth = -dx * 0.006;
        const dElevation = dy * 0.005;
        surfaceStore.orbitCamera(dAzimuth, dElevation);
      } else if (dragButton.current === 1 || dragButton.current === 2) {
        // Right click / Middle click: Pan camera target on the ground plane
        const az = state.cameraAzimuth;
        const cosA = Math.cos(az);
        const sinA = Math.sin(az);
        const panX = (-dx * cosA - dy * sinA) * 0.035;
        const panZ = (dx * sinA - dy * cosA) * 0.035;
        surfaceStore.panCameraTarget(panX, panZ);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging.current = false;
      try {
        dom.releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignored
      }
    };

    const onWheel = (e: WheelEvent) => {
      const state = surfaceStore.get();
      if (!state.isActive) return;

      e.preventDefault();
      // Zoom camera smoothly
      const zoomDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) * 0.025, 2.5);
      surfaceStore.zoomCamera(zoomDelta);
    };

    // Touch gesture pinch-to-zoom support for mobile devices
    const onTouchMove = (e: TouchEvent) => {
      const state = surfaceStore.get();
      if (!state.isActive) return;

      if (e.touches.length === 2) {
        const t0 = e.touches[0]!;
        const t1 = e.touches[1]!;
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);

        if (lastTouchDist.current !== null) {
          const delta = (lastTouchDist.current - dist) * 0.05;
          surfaceStore.zoomCamera(delta);
        }
        lastTouchDist.current = dist;
      }
    };

    const onTouchEnd = () => {
      lastTouchDist.current = null;
    };

    const onContextMenu = (e: MouseEvent) => {
      if (surfaceStore.get().isActive) {
        e.preventDefault();
      }
    };

    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("touchmove", onTouchMove, { passive: true });
    dom.addEventListener("touchend", onTouchEnd);
    dom.addEventListener("contextmenu", onContextMenu);

    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("touchmove", onTouchMove);
      dom.removeEventListener("touchend", onTouchEnd);
      dom.removeEventListener("contextmenu", onContextMenu);
    };
  }, [gl]);

  return null;
}

