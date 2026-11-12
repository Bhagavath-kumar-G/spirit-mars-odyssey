import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { makeRockGeometry } from "./rock-geometry";
import { mulberry32, surfaceTerrainHeight } from "./terrain-math";

interface RockInstance {
  x: number;
  z: number;
  s: number;
  ry: number;
  rx: number;
  rz: number;
  tint: number;
}

export interface LandmarkRock {
  name: string;
  classification: string;
  x: number;
  z: number;
  scale: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

export const LANDMARK_ROCKS: readonly LandmarkRock[] = [
  {
    name: "Adirondack",
    classification: "Olivine Basalt (RAT Ground Target)",
    x: 14.5,
    z: -8.2,
    scale: [1.3, 0.75, 1.1],
    rotation: [0.1, 0.6, -0.05],
    color: "#463228",
  },
  {
    name: "Humphrey",
    classification: "Pyroxene Basalt with Mineral Veins",
    x: -18.4,
    z: 12.6,
    scale: [1.6, 1.1, 1.4],
    rotation: [-0.08, 1.8, 0.12],
    color: "#3d271e",
  },
  {
    name: "Mazatzal",
    classification: "Multi-layered Sedimentary Basalt",
    x: 24.2,
    z: 26.8,
    scale: [2.1, 0.9, 1.8],
    rotation: [0.05, 2.5, -0.1],
    color: "#52392d",
  },
  {
    name: "Pot of Gold",
    classification: "Nodular Hematite & Iron Oxide",
    x: 32.0,
    z: -16.5,
    scale: [1.1, 0.8, 1.0],
    rotation: [0.15, 0.9, 0.1],
    color: "#5e3a29",
  },
  {
    name: "Home Plate Outcrop",
    classification: "90% Pure Opaline Silica Hydrothermal Deposit",
    x: 44.5,
    z: -2.8,
    scale: [2.4, 1.3, 2.2],
    rotation: [0.05, 3.8, 0.08],
    color: "#b08560",
  },
  {
    name: "El Dorado Dunes",
    classification: "Dark Basaltic Sand Ripple Field",
    x: -34.0,
    z: -32.5,
    scale: [2.8, 0.6, 2.5],
    rotation: [0.02, 1.2, 0.04],
    color: "#2c1c15",
  },
];

function InstancedRockCluster({
  items,
  geometry,
  colorA,
  colorB,
}: {
  items: RockInstance[];
  geometry: THREE.BufferGeometry;
  colorA: string;
  colorB: string;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const col = new THREE.Color();
    const cA = new THREE.Color(colorA);
    const cB = new THREE.Color(colorB);

    items.forEach((r, i) => {
      const gy = surfaceTerrainHeight(r.x, r.z);
      // Embed rock base slightly below regolith surface to eliminate floating geometry
      p.set(r.x, gy - r.s * 0.18, r.z);
      e.set(r.rx, r.ry, r.rz);
      q.setFromEuler(e);
      sc.set(r.s, r.s * 0.85, r.s * (0.8 + r.tint * 0.4));
      m.compose(p, q, sc);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, col.copy(cA).lerp(cB, r.tint));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items, colorA, colorB]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, items.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial roughness={0.92} metalness={0.03} envMapIntensity={0.35} />
    </instancedMesh>
  );
}

/**
 * Procedurally distributed Martian rock obstacle fields, pebbles, and landmark basalt outcrops.
 * Distributed deterministically across the 200m x 200m basin with clustering around crater rims.
 */
export function SurfaceRocks() {
  const { pebbles, boulders } = useMemo(() => {
    const rng = mulberry32(8492);
    const pebbles: RockInstance[] = [];
    const boulders: RockInstance[] = [];

    // 1. Pebbles scattered across terrain (1,100 instances)
    for (let i = 0; i < 1100; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 3.5 + Math.pow(rng(), 0.75) * 85;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      // Avoid placing heavy clusters right on the starting landing circle
      if (Math.hypot(x, z) < 3.0 && rng() < 0.85) continue;

      const s = 0.05 + Math.pow(rng(), 3) * 0.38;
      pebbles.push({
        x,
        z,
        s,
        ry: rng() * Math.PI * 2,
        rx: (rng() - 0.5) * 0.5,
        rz: (rng() - 0.5) * 0.5,
        tint: rng(),
      });
    }

    // 2. Boulders (120 instances)
    for (let i = 0; i < 120; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 6.0 + Math.pow(rng(), 0.65) * 80;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      // Keep starting 5m perimeter clear for rover deployment
      if (Math.hypot(x, z) < 5.0) continue;

      const s = 0.55 + Math.pow(rng(), 2) * 1.8;
      boulders.push({
        x,
        z,
        s,
        ry: rng() * Math.PI * 2,
        rx: (rng() - 0.5) * 0.4,
        rz: (rng() - 0.5) * 0.4,
        tint: rng(),
      });
    }

    return { pebbles, boulders };
  }, []);

  const pebbleGeo = useMemo(() => makeRockGeometry(4.2, 1, 0.35), []);
  const boulderGeo = useMemo(() => makeRockGeometry(9.6, 2, 0.45, 0.5), []);
  const landmarkGeo = useMemo(() => makeRockGeometry(14.8, 3, 0.52, 0.4), []);

  return (
    <group>
      {/* Instanced regolith pebbles */}
      <InstancedRockCluster
        items={pebbles}
        geometry={pebbleGeo}
        colorA="#3a251e"
        colorB="#7a4e38"
      />

      {/* Instanced medium and large boulders */}
      <InstancedRockCluster
        items={boulders}
        geometry={boulderGeo}
        colorA="#301b13"
        colorB="#6b4230"
      />

      {/* Landmark Geologic Formations with scientifically documented classifications */}
      {LANDMARK_ROCKS.map((rock) => {
        const ry = surfaceTerrainHeight(rock.x, rock.z);
        return (
          <group key={rock.name} position={[rock.x, ry - 0.08, rock.z]}>
            <mesh
              geometry={landmarkGeo}
              scale={rock.scale}
              rotation={rock.rotation}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={rock.color}
                roughness={0.88}
                metalness={0.05}
                envMapIntensity={0.4}
              />
            </mesh>

            {/* Scientific Proximity Ground Beacon (subtle locator ring) */}
            <mesh position={[0, 0.04, 0]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[rock.scale[0] * 1.1, rock.scale[0] * 1.25, 32]} />
              <meshBasicMaterial
                color="#00e5ff"
                transparent
                opacity={0.18}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

