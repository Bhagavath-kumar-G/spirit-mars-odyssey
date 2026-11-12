import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { inspectionStore, useInspection } from "@/lib/inspection-store";
import { useRoverParts } from "./rover-parts";
import { smoothstep } from "./terrain-math";
import { smoothed, world } from "./world";

/** Center position of the technical exploded rover experience in world space. */
export const EXPLODED_POS = new THREE.Vector3(0, -0.3, 26);

export type ExplodedPartDef = {
  name: string;
  label: string;
  category: string;
  description: string;
  spec: string;
  offset: [number, number, number];
};

export const EXPLODED_PARTS: Record<string, ExplodedPartDef> = {
  chassis: {
    name: "chassis",
    label: "Warm Electronics Box",
    category: "Avionics Core",
    description: "Insulated central housing with aerogel blanket protecting radiation-hardened RAD6000 CPU and Li-ion batteries.",
    spec: "Aerogel Blanket · 128MB DRAM · RAD6000 20MHz",
    offset: [0, 0, 0],
  },
  solar: {
    name: "solar",
    label: "Solar Array Wings",
    category: "Power Subsystem",
    description: "Triple-junction Gallium Arsenide solar panels generating up to 900 watt-hours per Martian sol.",
    spec: "1.3 m² Area · Triple-Junction GaAs · 140W Peak",
    offset: [0, 0.85, -0.2],
  },
  hga: {
    name: "hga",
    label: "High-Gain Antenna",
    category: "Telecommunications",
    description: "Steerable parabolic X-band dish for direct-to-Earth telemetry and command relays.",
    spec: "0.28m Steerable Dish · X-band · Deep Space Network",
    offset: [0.45, 0.95, -0.25],
  },
  mast: {
    name: "mast",
    label: "Camera Mast Assembly",
    category: "Remote Sensing",
    description: "Periscopic 1.5-meter mast elevating stereo panoramic and hazard cameras to human eye level.",
    spec: "1.5m Elevation · 360° Azimuth · Beryllium Tube",
    offset: [0, 0.8, 0.1],
  },
  pancam: {
    name: "pancam",
    label: "Panoramic Camera (Pancam)",
    category: "Science Imaging",
    description: "Dual multi-spectral cameras with 8-position filter wheels capturing 3D Martian color panoramas.",
    spec: "1024×1024 CCD · 16 Filters · Stereo Vision",
    offset: [-0.3, 1.25, 0.18],
  },
  navcam: {
    name: "navcam",
    label: "Navigation Camera (Navcam)",
    category: "Autonomous Drive",
    description: "Stereo wide-angle cameras mapping ground topography and detecting terrain hazards autonomously.",
    spec: "45° Field of View · Hazard Detection · Autonomous Guidance",
    offset: [0.25, 1.25, 0.18],
  },
  arm: {
    name: "arm",
    label: "Instrument Deployment Arm",
    category: "Surface Contact",
    description: "5-degree-of-freedom titanium robotic arm placing scientific sensors directly on Martian rocks.",
    spec: "5-DOF · Shoulder/Elbow/Wrist · 1.0m Reach",
    offset: [-0.15, -0.25, 0.75],
  },
  instruments: {
    name: "instruments",
    label: "Science Sensor Turret",
    category: "Analytical Payload",
    description: "End-effector turret housing Microscopic Imager, APXS, Mössbauer spectrometer, and Rock Abrasion Tool.",
    spec: "Rock Abrasion Tool · Mössbauer · Microscopic Imager",
    offset: [0.2, -0.25, 1.35],
  },
  suspension: {
    name: "suspension",
    label: "Rocker-Bogie Suspension",
    category: "Mobility Linkage",
    description: "Differential titanium linkage allowing each side to climb obstacles larger than wheel diameter.",
    spec: "Passive Articulation · Titanium Linkage · Differential Pivot",
    offset: [0, -0.55, 0],
  },
  wheel_LF: {
    name: "wheel_LF",
    label: "Left-Front Drive Wheel",
    category: "Locomotion",
    description: "Independent brushless DC drive actuator with steering motor and spiral cleat aluminum tread.",
    spec: "26cm Cleated Aluminum · Brushless DC · Steerable",
    offset: [-0.7, -0.2, 0.35],
  },
  wheel_RF: {
    name: "wheel_RF",
    label: "Right-Front Drive Wheel",
    category: "Locomotion",
    description: "Steerable motorized wheel. Failed on Sol 779 (March 2006); dragged backwards to reveal subsurface silica.",
    spec: "26cm Cleated Aluminum · Sol 779 Historical Landmark",
    offset: [0.7, -0.2, 0.35],
  },
  wheel_LM: {
    name: "wheel_LM",
    label: "Left-Middle Drive Wheel",
    category: "Locomotion",
    description: "Fixed-direction aluminum drive wheel providing center pivot traction across loose soil.",
    spec: "Center Pivot Traction · Planetary Gearbox",
    offset: [-0.85, -0.2, 0],
  },
  wheel_RM: {
    name: "wheel_RM",
    label: "Right-Middle Drive Wheel",
    category: "Locomotion",
    description: "Fixed-direction motorized wheel providing continuous drive torque during uneven terrain traversal.",
    spec: "Planetary Reduction Gearbox · 5 cm/s Max Speed",
    offset: [0.85, -0.2, 0],
  },
  wheel_LL: {
    name: "wheel_LL",
    label: "Left-Rear Drive Wheel",
    category: "Locomotion",
    description: "Steerable rear aluminum wheel enabling 360° turn-in-place maneuverability.",
    spec: "Independent Steering · 360° Zero-Radius Turning",
    offset: [-0.7, -0.2, -0.35],
  },
  wheel_RL: {
    name: "wheel_RL",
    label: "Right-Rear Drive Wheel",
    category: "Locomotion",
    description: "Steerable rear aluminum wheel paired with suspension bogie for rear slope stability.",
    spec: "Independent Steering · 45° Pitch Stability",
    offset: [0.7, -0.2, -0.35],
  },
};

/** Hotspot markers displayed in the exploded configuration */
const HOTSPOT_TARGETS = [
  { id: "chassis", label: "01 · WEB Chassis", pos: [0, 0.58, -0.1] },
  { id: "solar", label: "02 · Solar Array", pos: [-0.3, 1.55, -0.3] },
  { id: "hga", label: "03 · High-Gain Antenna", pos: [0.95, 1.95, -0.45] },
  { id: "mast", label: "04 · Camera Mast", pos: [-0.07, 1.95, 0.45] },
  { id: "pancam", label: "05 · Pancam Stereo", pos: [-0.35, 2.8, 0.55] },
  { id: "arm", label: "06 · Robotic Arm", pos: [-0.15, 0.15, 1.1] },
  { id: "instruments", label: "07 · Science Turret", pos: [0.35, 0.15, 1.8] },
  { id: "suspension", label: "08 · Rocker-Bogie", pos: [0, -0.22, -0.02] },
  { id: "wheel_RF", label: "09 · Sol 779 Wheel", pos: [1.2, -0.07, 0.95] },
] as const;

/** Technical Blueprint Laboratory Grid */
function TechnicalGrid({ opacity }: { opacity: number }) {
  const gridRef = useRef<THREE.Group>(null);
  return (
    <group ref={gridRef} position={[0, -0.68, 0]} rotation-x={-Math.PI / 2}>
      <polarGridHelper args={[4.2, 8, 6, 64, "#ff8a4c", "#5a3a2a"]} />
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[0.4, 4.2, 64]} />
        <meshBasicMaterial
          color="#120c0a"
          transparent
          opacity={0.75 * opacity}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Individual 3D Clickable Hotspot Marker */
function HotspotMarker({
  target,
  active,
  onClick,
  onHover,
}: {
  target: (typeof HOTSPOT_TARGETS)[number];
  active: boolean;
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const beaconRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 3.5;
    const pulse = 0.5 + 0.5 * Math.sin(t);
    if (ringRef.current) {
      ringRef.current.opacity = active ? 0.9 : 0.35 + 0.35 * pulse;
    }
  });

  return (
    <group
      position={target.pos as [number, number, number]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(target.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(target.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
      }}
    >
      <mesh>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial
          ref={beaconRef}
          color={active ? "#ffb07a" : "#ff8a4c"}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <ringGeometry args={[0.05, 0.075, 32]} />
        <meshBasicMaterial
          ref={ringRef}
          color="#ff8a4c"
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

interface MaterialSnapshot {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  depthTest: boolean;
  alphaTest: number;
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
}

const CATEGORY_TO_NODES: Record<string, string[]> = {
  chassis: ["chassis"],
  solar: ["solar"],
  hga: ["hga"],
  mast: ["mast", "navcam"],
  pancam: ["pancam"],
  arm: ["arm"],
  instruments: ["instruments"],
  suspension: ["suspension", "wheel_LF", "wheel_LM", "wheel_LL", "wheel_RM", "wheel_RL"],
  wheel_RF: ["wheel_RF"],
};

export function ExplodedRover({
  onSelectPart,
}: {
  onSelectPart?: ((partId: string | null) => void) | undefined;
}) {
  const { root, nodes, home } = useRoverParts();
  const group = useRef<THREE.Group>(null);
  const targetObj = useMemo(() => new THREE.Object3D(), []);
  const [explosionProgress, setExplosionProgress] = useState(0);

  const inspection = useInspection();
  const materialSnapshots = useRef<Map<THREE.Material, MaterialSnapshot>>(new Map());
  const wasInspecting = useRef(false);

  // Capture pristine baseline materials on mount / root change
  useEffect(() => {
    const snapshots = materialSnapshots.current;
    snapshots.clear();
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (!snapshots.has(m) && (m as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            const sm = m as THREE.MeshStandardMaterial;
            snapshots.set(sm, {
              opacity: sm.opacity,
              transparent: sm.transparent,
              depthWrite: sm.depthWrite,
              depthTest: sm.depthTest,
              alphaTest: sm.alphaTest,
              color: sm.color.clone(),
              emissive: sm.emissive.clone(),
              emissiveIntensity: sm.emissiveIntensity,
              roughness: sm.roughness,
              metalness: sm.metalness,
            });
          }
        });
      }
    });

    return () => {
      // Restore all materials strictly on unmount
      snapshots.forEach((snap, mat) => {
        const sm = mat as THREE.MeshStandardMaterial;
        sm.opacity = snap.opacity;
        sm.transparent = snap.transparent;
        sm.depthWrite = snap.depthWrite;
        sm.depthTest = snap.depthTest;
        sm.alphaTest = snap.alphaTest;
        sm.color.copy(snap.color);
        sm.emissive.copy(snap.emissive);
        sm.emissiveIntensity = snap.emissiveIntensity;
        sm.roughness = snap.roughness;
        sm.metalness = snap.metalness;
        sm.needsUpdate = true;
      });
      snapshots.clear();
    };
  }, [root]);

  const handleSelect = useCallback(
    (id: string) => {
      const current = inspectionStore.get().inspectedPartId;
      if (current === id) {
        inspectionStore.close();
        onSelectPart?.(null);
      } else {
        inspectionStore.setInspected(id);
        onSelectPart?.(id);
      }
    },
    [onSelectPart],
  );

  const handleHover = useCallback(
    (id: string | null) => {
      inspectionStore.setHovered(id);
    },
    [],
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;

    const p = smoothed.exploded;
    // Visible during space mode while in the opening exploded landing sequence
    g.visible = world.mode === "space" && p < 0.999;
    if (!g.visible) return;

    // Progress mapping:
    // 0.0 .. 0.15: Fully assembled, subtle level showcase
    // 0.15 .. 0.8: Controlled outward separation
    // 0.8 .. 1.0: Fully exploded configuration with active inspection
    const t = smoothstep(0.12, 0.8, p);
    setExplosionProgress(t);

    // Apply exact outward displacement to each node
    Object.keys(EXPLODED_PARTS).forEach((name) => {
      const node = nodes[name];
      const base = home[name];
      const def = EXPLODED_PARTS[name];
      if (!node || !base || !def) return;

      const [ox, oy, oz] = def.offset;
      node.position.set(base.x + ox * t, base.y + oy * t, base.z + oz * t);
    });

    // Material Ghosting & Highlighting Engine
    const isInspecting = inspection.isInspecting && inspection.inspectedPartId !== null;
    if (isInspecting) {
      wasInspecting.current = true;
      const targetCategory = inspection.inspectedPartId!;
      const activeNodes = CATEGORY_TO_NODES[targetCategory] || [targetCategory];

      Object.keys(nodes).forEach((nodeName) => {
        const node = nodes[nodeName];
        if (!node) return;
        const isActive = activeNodes.includes(nodeName);

        node.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const sm = m as THREE.MeshStandardMaterial;
              if (!sm.isMeshStandardMaterial) return;
              const snap = materialSnapshots.current.get(sm);
              if (!snap) return;

              if (isActive) {
                sm.transparent = false;
                sm.opacity = 1.0;
                sm.depthWrite = true;
                if (targetCategory === "wheel_RF") {
                  const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4.0);
                  sm.emissive.set("#ff4500");
                  sm.emissiveIntensity = 0.55 + 0.4 * pulse;
                } else {
                  sm.emissive.set("#ff8a4c");
                  sm.emissiveIntensity = 0.35;
                }
              } else {
                sm.transparent = true;
                sm.opacity = 0.22;
                sm.depthWrite = false;
                sm.emissive.setRGB(0, 0, 0);
                sm.emissiveIntensity = 0;
              }
            });
          }
        });
      });
    } else if (wasInspecting.current) {
      // Restore all materials cleanly from baseline snapshots
      wasInspecting.current = false;
      materialSnapshots.current.forEach((snap, mat) => {
        const sm = mat as THREE.MeshStandardMaterial;
        sm.opacity = snap.opacity;
        sm.transparent = snap.transparent;
        sm.depthWrite = snap.depthWrite;
        sm.depthTest = snap.depthTest;
        sm.alphaTest = snap.alphaTest;
        sm.color.copy(snap.color);
        sm.emissive.copy(snap.emissive);
        sm.emissiveIntensity = snap.emissiveIntensity;
        sm.roughness = snap.roughness;
        sm.metalness = snap.metalness;
        sm.needsUpdate = true;
      });
    }

    // Gentle studio rotation as the rover explodes
    root.rotation.y = t * 0.45;
  });

  const showHotspots = explosionProgress > 0.72;

  return (
    <group ref={group} position={EXPLODED_POS}>
      <primitive object={root} />
      <primitive object={targetObj} position={[0, 0.45, 0]} />

      {/* Technical Blueprint Laboratory Grid */}
      <TechnicalGrid opacity={1} />

      {/* Background click dismiss plane */}
      <mesh
        position={[0, -0.69, 0]}
        rotation-x={-Math.PI / 2}
        onClick={(e) => {
          e.stopPropagation();
          if (inspectionStore.get().isInspecting) {
            inspectionStore.close();
          }
        }}
      >
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Studio Teardown Lighting */}
      <directionalLight
        position={[4, 5, 4]}
        target={targetObj}
        intensity={2.8}
        color="#fff5ea"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2.2}
        shadow-camera-right={2.2}
        shadow-camera-top={2.2}
        shadow-camera-bottom={-2.2}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-bias={-0.0005}
      />
      <pointLight position={[-3, 2, -2]} intensity={8} distance={10} decay={2} color="#ff9050" />
      <pointLight position={[3, 1, -2]} intensity={6} distance={10} decay={2} color="#7fa8ff" />
      <pointLight position={[0, 3.5, 3]} intensity={4} distance={9} decay={2} color="#ffffff" />

      {/* Interactive 3D Component Hotspots */}
      {showHotspots && (
        <group>
          {HOTSPOT_TARGETS.map((hs) => (
            <HotspotMarker
              key={hs.id}
              target={hs}
              active={inspection.inspectedPartId === hs.id || inspection.hoveredPartId === hs.id}
              onClick={handleSelect}
              onHover={handleHover}
            />
          ))}
        </group>
      )}
    </group>
  );
}

