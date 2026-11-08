import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import spiritRoverPartsModel from "@/assets/models/spirit-rover-parts.glb.asset.json";
import { prepareRoverMesh } from "./rover-materials";

/** NASA/JPL MER model split into named parts, each node pivoted at its own centre. */
export const ROVER_PARTS_URL = spiritRoverPartsModel.url;

export type RoverParts = {
  root: THREE.Group;
  nodes: Record<string, THREE.Object3D>;
  home: Record<string, THREE.Vector3>;
};

/** Loads the part model and returns a private clone (never mutate the cached scene). */
export function useRoverParts(): RoverParts {
  const { scene } = useGLTF(ROVER_PARTS_URL);
  return useMemo(() => {
    const root = new THREE.Group();
    const nodes: Record<string, THREE.Object3D> = {};
    const home: Record<string, THREE.Vector3> = {};
    for (const child of scene.children) {
      const c = child.clone(true);
      c.traverse(prepareRoverMesh);
      root.add(c);
      nodes[c.name] = c;
      home[c.name] = c.position.clone();
    }
    return { root, nodes, home };
  }, [scene]);
}

export function preloadRoverParts() {
  useGLTF.preload(ROVER_PARTS_URL);
}
