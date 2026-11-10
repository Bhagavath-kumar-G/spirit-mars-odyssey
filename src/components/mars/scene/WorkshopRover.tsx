import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useBuilder } from "@/lib/builder-store";
import { SubsystemCategory } from "@/lib/rover-engineering";
import { useRoverParts } from "./rover-parts";

const HIGHLIGHT_COLOR = new THREE.Color("#38bdf8"); // NASA engineering cyan
const REST_COLOR = new THREE.Color("#000000");

// Subsystem category to GLB node key mapping
const SUBSYSTEM_NODES: Record<SubsystemCategory, string[]> = {
  mobility: [
    "wheel_RF",
    "wheel_LF",
    "wheel_RM",
    "wheel_RL",
    "wheel_LM",
    "wheel_LL",
    "suspension",
  ],
  power: ["solar"],
  science: ["instruments", "arm", "mast", "pancam", "navcam"],
  telecom: ["hga"],
};

export function WorkshopRover() {
  const { state } = useBuilder();
  const { root, nodes } = useRoverParts();
  const groupRef = useRef<THREE.Group>(null);

  // Keep a map of materials for high-performance non-reallocating highlight updates
  const nodeMaterials = useMemo(() => {
    const map = new Map<string, THREE.MeshStandardMaterial[]>();
    for (const [nodeName, obj] of Object.entries(nodes)) {
      const mats: THREE.MeshStandardMaterial[] = [];
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mats.push(...(mesh.material as THREE.MeshStandardMaterial[]));
          } else if (mesh.material) {
            mats.push(mesh.material as THREE.MeshStandardMaterial);
          }
        }
      });
      map.set(nodeName, mats);
    }
    return map;
  }, [nodes]);

  // Dispose workshop-owned cloned materials on component unmount to prevent WebGL memory leaks
  useEffect(() => {
    return () => {
      for (const mats of nodeMaterials.values()) {
        for (const mat of mats) {
          if (mat.isMeshStandardMaterial) {
            mat.emissive.copy(REST_COLOR);
            mat.emissiveIntensity = 0.0;
            mat.dispose();
          }
        }
      }
    };
  }, [nodeMaterials]);

  // Update subsystem highlight state when active category changes
  useEffect(() => {
    const activeNodes = new Set(SUBSYSTEM_NODES[state.activeCategory] ?? []);

    for (const [nodeName, mats] of nodeMaterials.entries()) {
      const isActive = activeNodes.has(nodeName);
      for (const mat of mats) {
        if (!mat.isMeshStandardMaterial) continue;
        if (isActive) {
          mat.emissive.copy(HIGHLIGHT_COLOR);
          mat.emissiveIntensity = 0.42;
        } else {
          mat.emissive.copy(REST_COLOR);
          mat.emissiveIntensity = 0.0;
        }
      }
    }

    return () => {
      // Revert highlight on category switch
      for (const mats of nodeMaterials.values()) {
        for (const mat of mats) {
          if (mat.isMeshStandardMaterial) {
            mat.emissive.copy(REST_COLOR);
            mat.emissiveIntensity = 0.0;
          }
        }
      }
    };
  }, [state.activeCategory, nodeMaterials]);

  // Subtle pulsing glow on active subsystem
  useFrame(({ clock }) => {
    const pulse = 0.35 + 0.12 * Math.sin(clock.elapsedTime * 3.5);
    const activeNodes = SUBSYSTEM_NODES[state.activeCategory] ?? [];
    for (const nodeName of activeNodes) {
      const mats = nodeMaterials.get(nodeName);
      if (mats) {
        for (const mat of mats) {
          if (mat.isMeshStandardMaterial) {
            mat.emissiveIntensity = pulse;
          }
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={root} />
    </group>
  );
}
