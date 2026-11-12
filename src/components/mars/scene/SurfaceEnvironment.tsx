import { useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { useSurfaceStore } from "@/lib/surface-store";
import { DeployedSurfaceRover } from "./DeployedSurfaceRover";
import { SurfaceCamera } from "./SurfaceCamera";
import { SurfaceRocks } from "./SurfaceRocks";
import { SurfaceSky } from "./SurfaceSky";
import { SurfaceTerrain } from "./SurfaceTerrain";

/**
 * Consolidated Mars Surface Operations Environment.
 * Mounts the high-resolution 200m x 200m terrain mesh, procedural rock fields,
 * parameterized atmospheric sky dome, and the configured surface rover within
 * the shared WebGL Canvas.
 */
export function SurfaceEnvironment() {
  const { state } = useSurfaceStore();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.visible = state.isActive;
    }
  });

  if (!state.isActive) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <SurfaceCamera />
      <SurfaceSky />
      <SurfaceTerrain />
      <SurfaceRocks />
      <Suspense fallback={null}>
        <DeployedSurfaceRover />
      </Suspense>
    </group>
  );
}
