// Deterministic noise + terrain height. Pure TS so scene and rover agree on the ground.

export function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, z: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export function noise2(x: number, z: number) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash2(xi, zi);
  const b = hash2(xi + 1, zi);
  const c = hash2(xi, zi + 1);
  const d = hash2(xi + 1, zi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}

export function fbm(x: number, z: number, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * freq, z * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export function ridged(x: number, z: number, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2(x * freq, z * freq));
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum / norm;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

const CRATERS = [
  { x: -40, z: -18, r: 8, depth: 1.6 },
  { x: 12, z: -26, r: 12, depth: 2.2 },
  { x: 52, z: -13, r: 5.5, depth: 1.1 },
  { x: -78, z: -36, r: 14, depth: 2.6 },
  { x: 86, z: -30, r: 10, depth: 2 },
  { x: 28, z: 13, r: 4.5, depth: 0.8 },
  { x: -18, z: 15, r: 3.5, depth: 0.6 },
];

/** Ground height in metres at world (x, z). The rover drives along z = 0. */
export function terrainHeight(x: number, z: number) {
  const offPath = smoothstep(1.6, 10, Math.abs(z));
  let h = fbm(x * 0.035, z * 0.035, 4) * 3.4 * (0.12 + 0.88 * offPath);
  h += fbm(x * 0.22 + 11, z * 0.22 - 7, 2) * 0.22 * (0.4 + 0.6 * offPath);
  // Columbia-Hills-style rise in the distance
  const back = smoothstep(-22, -95, z);
  h += back * (fbm(x * 0.018 + 5, z * 0.018, 4) * 16 + 7);
  for (const c of CRATERS) {
    const d = Math.hypot(x - c.x, z - c.z) / c.r;
    if (d < 1.8) {
      if (d < 1) h -= (1 - d * d) * c.depth;
      const rim = (d - 1) / 0.28;
      h += Math.exp(-rim * rim) * c.depth * 0.45;
    }
  }
  return h;
}

// ============================================================================
// PHASE 3.4-B: NAVIGABLE 200m x 200m MARS SURFACE OPERATIONS TERRAIN MATH
// ============================================================================

export interface SurfaceCrater {
  x: number;
  z: number;
  r: number;
  depth: number;
  name: string;
}

export const SURFACE_CRATERS: readonly SurfaceCrater[] = [
  { x: 38, z: -32, r: 16, depth: 3.2, name: "Bonneville Crater" },
  { x: -46, z: 24, r: 9, depth: 1.8, name: "Missoula Crater" },
  { x: -28, z: -52, r: 7.5, depth: 1.4, name: "Lahontan Crater" },
  { x: 52, z: 42, r: 8, depth: 1.6, name: "Castille Crater" },
  { x: 0, z: 62, r: 14, depth: 1.1, name: "Troy Sulfate Hollow" },
  { x: -14, z: -18, r: 5, depth: 0.8, name: "Sleepy Hollow" },
  { x: 22, z: 16, r: 4.5, depth: 0.7, name: "Vostok Pocket" },
];

/** Geologically significant Martian outcrops and plateaus */
export interface SurfaceFormation {
  x: number;
  z: number;
  r: number;
  height: number;
  name: string;
}

export const SURFACE_FORMATIONS: readonly SurfaceFormation[] = [
  { x: 48, z: -4, r: 12, height: 2.2, name: "Home Plate Plateau" },
  { x: -18, z: 8, r: 6, height: 1.1, name: "Humphrey Ridge" },
];

/**
 * Deterministic ground height calculation for the 200m x 200m Mars Surface Operations grid.
 * Provides smooth, omnidirectional 2D terrain with rolling regolith dunes,
 * excavated craters with raised ejecta rims, Columbia Hills northern rise,
 * and an encircling crater rim containment at r > 80m.
 */
export function surfaceTerrainHeight(x: number, z: number): number {
  // 1. Base undulating Martian regolith plain
  let h = fbm(x * 0.028, z * 0.028, 4) * 2.4;
  h += fbm(x * 0.12 + 4.2, z * 0.12 - 6.8, 3) * 0.45;
  h += noise2(x * 0.5, z * 0.5) * 0.08;

  // 2. Landing / Starting plateau around (0, 0)
  // Gentle grading within 8m radius to ensure stable initial spacecraft touchdown
  const startDist = Math.hypot(x, z);
  const startFlatten = 1.0 - smoothstep(2.5, 9.0, startDist);
  h *= 1.0 - startFlatten * 0.65;

  // 3. Columbia Hills Northern Rise (z < -16m)
  // Re-creates the majestic alpine ascent toward Husband Hill
  const northRise = smoothstep(-16, -92, z);
  h += northRise * (fbm(x * 0.016 + 8.1, z * 0.016, 4) * 15.0 + 6.5);

  // 4. Geological Formations (e.g. Home Plate elevated volcanic mesa)
  for (const f of SURFACE_FORMATIONS) {
    const d = Math.hypot(x - f.x, z - f.z) / f.r;
    if (d < 1.4) {
      const mesa = 1.0 - smoothstep(0.7, 1.15, d);
      h += mesa * f.height;
    }
  }

  // 5. Impact Craters with excavated bowls and elevated rims
  for (const c of SURFACE_CRATERS) {
    const d = Math.hypot(x - c.x, z - c.z) / c.r;
    if (d < 1.9) {
      // Crater interior bowl depression
      if (d < 1.0) {
        h -= (1.0 - d * d) * c.depth;
      }
      // Crater ejecta rim uplift
      const rimDist = (d - 1.0) / 0.28;
      h += Math.exp(-rimDist * rimDist) * c.depth * 0.42;
    }
  }

  // 6. Natural Perimeter Escarpment / Exploration Boundary Containment (r > 78m)
  // Smoothly rises to keep exploration bounded naturally without artificial invisible walls
  if (startDist > 78) {
    const boundaryRise = smoothstep(78, 100, startDist);
    h += boundaryRise * 8.5;
  }

  return h;
}

/**
 * Calculates the exact surface normal vector [-nx, ny, -nz] at (x, z)
 * using symmetrical central differences (eps = 0.2m).
 * Returned vector is guaranteed normalized.
 */
export function surfaceTerrainNormal(x: number, z: number, eps = 0.2): [number, number, number] {
  const hL = surfaceTerrainHeight(x - eps, z);
  const hR = surfaceTerrainHeight(x + eps, z);
  const hD = surfaceTerrainHeight(x, z - eps);
  const hU = surfaceTerrainHeight(x, z + eps);
  const dx = (hR - hL) / (2 * eps);
  const dz = (hU - hD) / (2 * eps);
  const len = Math.hypot(-dx, 1.0, -dz);
  return [-dx / len, 1.0 / len, -dz / len];
}

/**
 * Surface slope angle in radians (0 = completely flat horizontal, pi/2 = vertical cliff).
 */
export function surfaceTerrainSlope(x: number, z: number): number {
  const normal = surfaceTerrainNormal(x, z);
  // normal[1] is cos(theta) where theta is slope from horizontal
  return Math.acos(clamp01(normal[1]));
}

