import * as THREE from "three";
import { fbm } from "./terrain-math";

/** Irregular, faceted rock built from a displaced icosahedron. */
export function makeRockGeometry(seed: number, detail = 1, rough = 0.35, squash = 0.62) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 1.4 + v.y * 0.7 + seed, v.z * 1.4 - v.y * 0.9 - seed, 3);
    v.multiplyScalar(1 + n * rough);
    v.y *= squash;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Soft round sprite for particles and glows. */
export function makeGlowTexture(inner: string, outer: string, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
