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
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          const sm = mat as THREE.MeshStandardMaterial;
          if (sm.isMeshStandardMaterial) sm.envMapIntensity = 0.9;
        });
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
