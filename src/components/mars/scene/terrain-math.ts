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
