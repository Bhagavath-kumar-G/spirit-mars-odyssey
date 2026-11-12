import { useMemo } from "react";
import * as THREE from "three";
import {
  fbm,
  mulberry32,
  smoothstep,
  surfaceTerrainHeight,
  SURFACE_CRATERS,
  SURFACE_FORMATIONS,
} from "./terrain-math";

// Martian geological color palette (sRGB)
const COLOR_RUST = new THREE.Color("#9e4a2b");
const COLOR_DUST = new THREE.Color("#c27a4c");
const COLOR_BASALT = new THREE.Color("#351c14");
const COLOR_PALE_SILICA = new THREE.Color("#dfa679");
const COLOR_SULFATE_SAND = new THREE.Color("#ded0b6"); // "Troy" powder sulfate

function makeSurfaceGrainTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const rng = mulberry32(104);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x * 0.05, y * 0.05, 3) * 0.5 + 0.5;
      let val = 195 + n * 50 + (rng() - 0.5) * 32;
      // Regolith micro-speckles
      if (rng() < 0.015) val -= 85;
      const i = (y * size + x) * 4;
      img.data[i] = Math.max(0, Math.min(255, val));
      img.data[i + 1] = Math.max(0, Math.min(255, val * 0.94));
      img.data[i + 2] = Math.max(0, Math.min(255, val * 0.88));
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(100, 100);
  return tex;
}

/**
 * High-resolution 200m x 200m Martian Surface Terrain Mesh.
 * Realized through deterministic analytical heightfield mathematics,
 * multi-tonal regolith vertex coloration, and authentic Martian geology.
 */
export function SurfaceTerrain() {
  const { geometry, texture, boundaryLine } = useMemo(() => {
    // 200m x 200m grid with 200 x 200 subdivisions (1m spacing, 40,401 vertices)
    const g = new THREE.PlaneGeometry(200, 200, 200, 200);
    g.rotateX(-Math.PI / 2);

    const pos = g.attributes["position"] as THREE.BufferAttribute;
    const vertexCount = pos.count;
    const colors = new Float32Array(vertexCount * 3);
    const tempCol = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // 1. Analytical deterministic elevation
      const h = surfaceTerrainHeight(x, z);
      pos.setY(i, h);

      // 2. Multi-spectral mineralogical coloring
      const distFromCenter = Math.hypot(x, z);
      const noiseA = fbm(x * 0.05 + 1.2, z * 0.05 - 3.4, 3);
      const noiseB = fbm(x * 0.018 - 4.1, z * 0.018 + 7.6, 3);

      // Base regolith blend: rust base with atmospheric dust accumulation
      tempCol.copy(COLOR_RUST).lerp(COLOR_DUST, smoothstep(-0.35, 0.45, noiseA) * 0.75);

      // Basalt deposits in hollows and depressions
      tempCol.lerp(COLOR_BASALT, smoothstep(0.08, 0.5, -noiseB) * 0.55);

      // High ridges, crater rims and Columbia rise catch brighter oxidized dust/pale silica
      tempCol.lerp(COLOR_PALE_SILICA, smoothstep(2.5, 12.0, h) * 0.45);

      // Troy sulfate sand drift signature around (0, 62)
      const troyDist = Math.hypot(x - 0, z - 62);
      if (troyDist < 18.0) {
        const troyBlend = 1.0 - smoothstep(6.0, 18.0, troyDist);
        tempCol.lerp(COLOR_SULFATE_SAND, troyBlend * 0.7);
      }

      // Home Plate silica signature around (48, -4)
      const homePlateDist = Math.hypot(x - 48, z - (-4));
      if (homePlateDist < 14.0) {
        const hpBlend = 1.0 - smoothstep(4.0, 14.0, homePlateDist);
        tempCol.lerp(COLOR_PALE_SILICA, hpBlend * 0.65);
      }

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();

    const tex = makeSurfaceGrainTexture();

    // 3. Subtle boundary perimeter ring at r = 94m
    const ringSegs = 128;
    const ringPos = new Float32Array((ringSegs + 1) * 3);
    for (let j = 0; j <= ringSegs; j++) {
      const theta = (j / ringSegs) * Math.PI * 2;
      const rx = Math.sin(theta) * 94;
      const rz = Math.cos(theta) * 94;
      const ry = surfaceTerrainHeight(rx, rz) + 0.12;
      ringPos[j * 3] = rx;
      ringPos[j * 3 + 1] = ry;
      ringPos[j * 3 + 2] = rz;
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute("position", new THREE.BufferAttribute(ringPos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: "#ff7a2e", transparent: true, opacity: 0.32 });
    const boundaryLine = new THREE.Line(bg, lineMat);

    return { geometry: g, texture: tex, boundaryLine };
  }, []);

  return (
    <group>
      {/* Navigable Main Terrain Mesh */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          map={texture}
          bumpMap={texture}
          bumpScale={1.1}
          roughness={0.94}
          metalness={0.02}
          envMapIntensity={0.35}
        />
      </mesh>

      {/* Exploration Boundary Ring (Natural visual limiter) */}
      <primitive object={boundaryLine} />

      {/* Geologic Feature Markers (Crater / Outcrop Signposts for Rover Traversal) */}
      {SURFACE_CRATERS.map((c) => {
        const cy = surfaceTerrainHeight(c.x, c.z);
        return (
          <group key={c.name} position={[c.x, cy + 0.05, c.z]}>
            {/* Subtle crater center locator ring */}
            <mesh rotation-x={-Math.PI / 2}>
              <ringGeometry args={[c.r * 0.96, c.r, 48]} />
              <meshBasicMaterial
                color="#e58c4f"
                transparent
                opacity={0.15}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}

      {SURFACE_FORMATIONS.map((f) => {
        const fy = surfaceTerrainHeight(f.x, f.z);
        return (
          <group key={f.name} position={[f.x, fy + 0.05, f.z]}>
            <mesh rotation-x={-Math.PI / 2}>
              <ringGeometry args={[f.r * 0.94, f.r, 48]} />
              <meshBasicMaterial
                color="#ffd08a"
                transparent
                opacity={0.2}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
