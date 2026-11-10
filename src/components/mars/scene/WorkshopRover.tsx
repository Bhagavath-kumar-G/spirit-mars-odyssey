import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useBuilder } from "@/lib/builder-store";
import { SubsystemCategory } from "@/lib/rover-engineering";
import { useRoverParts } from "./rover-parts";
import {
  CompliantTires,
  CoringDrill,
  ExtendedDish,
  ExtendedSolarWings,
  HeavyWheels,
  MmrtgAssembly,
  PhasedArray,
  SubsurfaceRadar,
} from "./WorkshopComponents";

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

  // Synchronize baseline GLB node visibility with active hardware selections
  useEffect(() => {
    // 1. Mobility Wheels
    const showStandardWheels = state.selected.mobility === "wheels_standard";
    const wheelNodes = ["wheel_RF", "wheel_LF", "wheel_RM", "wheel_RL", "wheel_LM", "wheel_LL"];
    for (const wn of wheelNodes) {
      if (nodes[wn]) nodes[wn].visible = showStandardWheels;
    }

    // 2. Power: Solar Array (hidden when Nuclear MMRTG is installed on aft equipment deck)
    const showSolar = state.selected.power !== "power_mmrtg";
    if (nodes["solar"]) nodes["solar"].visible = showSolar;

    // 3. Science: Athena Instruments Turret (hidden when Coring Drill is mounted at arm wrist)
    const showInstruments = state.selected.science !== "science_coring_drill";
    if (nodes["instruments"]) nodes["instruments"].visible = showInstruments;

    // 4. Telecommunications: High Gain Antenna (hidden when Extended Dish or Phased Array is active)
    const showHga = state.selected.telecom === "telecom_hga_dish";
    if (nodes["hga"]) nodes["hga"].visible = showHga;
  }, [state.selected, nodes]);

  // Restore all baseline GLB nodes on unmount to prevent state bleed into Mars scene
  useEffect(() => {
    return () => {
      for (const obj of Object.values(nodes)) {
        obj.visible = true;
      }
    };
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
      {/* Pristine Master Cloned Rover Graph */}
      <primitive object={root} />

      {/* ------------------------------------------------------------- */}
      {/* MODULAR PROCEDURAL COMPONENT REPLACEMENTS                     */}
      {/* ------------------------------------------------------------- */}
      {/* Mobility Alternatives */}
      {state.selected.mobility === "wheels_heavy" && (
        <HeavyWheels isCategoryActive={state.activeCategory === "mobility"} />
      )}
      {state.selected.mobility === "wheels_compliant" && (
        <CompliantTires isCategoryActive={state.activeCategory === "mobility"} />
      )}

      {/* Power Alternatives */}
      {state.selected.power === "power_solar_extended" && (
        <ExtendedSolarWings isCategoryActive={state.activeCategory === "power"} />
      )}
      {state.selected.power === "power_mmrtg" && (
        <MmrtgAssembly isCategoryActive={state.activeCategory === "power"} />
      )}

      {/* Science Alternatives */}
      {state.selected.science === "science_coring_drill" && (
        <CoringDrill isCategoryActive={state.activeCategory === "science"} />
      )}
      {state.selected.science === "science_subsurface_radar" && (
        <SubsurfaceRadar isCategoryActive={state.activeCategory === "science"} />
      )}

      {/* Telecommunications Alternatives */}
      {state.selected.telecom === "telecom_high_gain_extended" && (
        <ExtendedDish isCategoryActive={state.activeCategory === "telecom"} />
      )}
      {state.selected.telecom === "telecom_phased_array" && (
        <PhasedArray isCategoryActive={state.activeCategory === "telecom"} />
      )}
    </group>
  );
}
