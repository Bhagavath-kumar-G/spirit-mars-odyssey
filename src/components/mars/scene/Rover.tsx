import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import spiritRoverModel from "@/assets/models/spirit-rover.glb.asset.json";
import { terrainHeight } from "./terrain-math";
import { world } from "./world";

const WHEEL_NAMES = ["wheel_RL", "wheel_RM", "wheel_RF", "wheel_LL", "wheel_LM", "wheel_LF"];
const WHEEL_RADIUS = 0.13; // metres, measured from the NASA model

useGLTF.preload(spiritRoverModel.url);

/** NASA/JPL MER model (real scale, metres). Wheels were split into named nodes so they can roll. */
export function Rover({ onReady }: { onReady?: (() => void) | undefined }) {
  const { scene } = useGLTF(spiritRoverModel.url);
  const model = useMemo(() => {
    const m = scene.clone(true);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // The NASA file marks every material fully metallic, which renders near-black
        // without a studio HDR. Clone and re-balance so the textures read under Mars light.
        const fix = (mat: THREE.Material) => {
          const sm = (mat as THREE.MeshStandardMaterial).clone();
          if (!sm.isMeshStandardMaterial) return mat;
          const name = sm.name.toLowerCase();
          if (name.includes("silver") || name.includes("foil")) {
            sm.metalness = 0.85;
            sm.roughness = 0.35;
          } else if (name.includes("panels")) {
            sm.metalness = 0.35;
            sm.roughness = 0.38;
          } else {
            sm.metalness = 0.2;
            sm.roughness = Math.max(sm.roughness, 0.5);
          }
          sm.envMapIntensity = 1;
          return sm;
        };
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(fix) : fix(mesh.material);
      }
    });
    return m;
  }, [scene]);

  const outer = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Object3D[]>([]);
  const lastX = useRef<number | null>(null);

  useLayoutEffect(() => {
    wheels.current = WHEEL_NAMES.map((n) => model.getObjectByName(n)).filter(
      (o): o is THREE.Object3D => !!o,
    );
  }, [model]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useFrame(() => {
    const g = outer.current;
    if (!g) return;
    const x = world.roverX;
    const hb = terrainHeight(x - 0.6, 0);
    const hf = terrainHeight(x + 0.6, 0);
    const hl = terrainHeight(x, -0.5);
    const hr = terrainHeight(x, 0.5);
    g.position.set(x, (hb + hf + hl + hr) / 4 - world.rest * 0.07, 0);
    g.rotation.z = Math.atan2(hf - hb, 1.2) + world.rest * 0.04;
    g.rotation.x = -Math.atan2(hr - hl, 1.0) + world.rest * 0.07;

    const dx = lastX.current === null ? 0 : x - lastX.current;
    lastX.current = x;
    if (dx !== 0) for (const w of wheels.current) w.rotation.x += dx / WHEEL_RADIUS;
  });

  return (
    <group ref={outer}>
      <primitive object={model} rotation-y={Math.PI / 2} />
    </group>
  );
}
