import { useFrame } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MILESTONES, PATH, roverXForStop } from "@/lib/mission";
import { Rover } from "./Rover";
import { makeGlowTexture, makeRockGeometry } from "./rock-geometry";
import { fbm, mulberry32, ridged, smoothstep, terrainHeight } from "./terrain-math";
import { world } from "./world";

// ---------- palette (sRGB) ----------
const RUST = new THREE.Color("#8f4527");
const DUST = new THREE.Color("#c27a4c");
const BASALT = new THREE.Color("#4e2c1f");
const PALE = new THREE.Color("#d39a6c");

const SUN_DAY = new THREE.Vector3(-25, 40, 25);
const SUN_DUSK = new THREE.Vector3(60, 6, -80);

// ---------- textures ----------
function makeGrainTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const rng = mulberry32(42);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(x * 0.06, y * 0.06, 3) * 0.5 + 0.5;
      let v = 200 + n * 45 + (rng() - 0.5) * 30;
      if (rng() < 0.012) v -= 90; // pebble speckles
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v));
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeTreadTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 32);
  ctx.fillStyle = "rgba(40,18,10,0.55)";
  ctx.fillRect(0, 0, 64, 32);
  ctx.fillStyle = "rgba(25,10,5,0.9)";
  for (let i = 0; i < 4; i++) ctx.fillRect(i * 16 + 2, 3, 7, 26);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- sky ----------
const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = /* glsl */ `
  uniform vec3 uDayHorizon;
  uniform vec3 uDayZenith;
  uniform vec3 uDuskHorizon;
  uniform vec3 uDuskZenith;
  uniform vec3 uGlow;
  uniform vec3 uSunDir;
  uniform float uSunset;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -1.0, 1.0);
    vec3 day = mix(uDayHorizon, uDayZenith, smoothstep(-0.02, 0.6, h));
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    float g2 = s * s; float g4 = g2 * g2; float g8 = g4 * g4; float g32 = g8 * g8; g32 *= g32;
    day += vec3(1.0, 0.9, 0.75) * g8 * 0.22;
    vec3 dusk = mix(uDuskHorizon, uDuskZenith, smoothstep(-0.02, 0.55, h));
    float band = 1.0 - smoothstep(0.0, 0.3, abs(h));
    dusk += uGlow * (g8 * 1.1 + g32 * 1.6 + band * g2 * 0.18);
    dusk += vec3(0.95, 0.97, 1.0) * smoothstep(0.99935, 0.9998, s) * 1.5;
    gl_FragColor = vec4(mix(day, dusk, uSunset), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function Sky() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uDayHorizon: { value: new THREE.Color("#d8aa80") },
          uDayZenith: { value: new THREE.Color("#7a5440") },
          uDuskHorizon: { value: new THREE.Color("#4a3432") },
          uDuskZenith: { value: new THREE.Color("#0b0b12") },
          uGlow: { value: new THREE.Color("#7fb0e8") },
          uSunDir: { value: SUN_DAY.clone().normalize() },
          uSunset: { value: 0 },
        },
      }),
    [],
  );
  useFrame(({ camera }) => {
    ref.current?.position.copy(camera.position);
    mat.uniforms["uSunset"]!.value = world.sunset;
    (mat.uniforms["uSunDir"]!.value as THREE.Vector3)
      .copy(SUN_DAY)
      .lerp(SUN_DUSK, world.sunset)
      .normalize();
  });
  return (
    <mesh ref={ref} material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[700, 48, 24]} />
    </mesh>
  );
}

// ---------- ground ----------
function Terrain() {
  const { geometry, texture } = useMemo(() => {
    const g = new THREE.PlaneGeometry(320, 170, 300, 170);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -60);
    const pos = g.attributes["position"] as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);
      const n = fbm(x * 0.07 + 3, z * 0.07 - 9, 3);
      const patch = fbm(x * 0.025 - 4, z * 0.025 + 8, 3);
      c.copy(RUST).lerp(DUST, smoothstep(-0.35, 0.55, n) * 0.8);
      c.lerp(BASALT, smoothstep(0.05, 0.45, -patch) * 0.55);
      c.lerp(PALE, smoothstep(2, 14, h) * 0.35);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const t = makeGrainTexture();
    t.repeat.set(160, 85);
    return { geometry: g, texture: t };
  }, []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        map={texture}
        bumpMap={texture}
        bumpScale={1.2}
        roughness={0.96}
        metalness={0}
        envMapIntensity={0.35}
      />
    </mesh>
  );
}

function Mountains() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(900, 220, 260, 60);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -250);
    const pos = g.attributes["position"] as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const rise = smoothstep(-140, -200, z);
      const h = ridged(x * 0.011 + 3, z * 0.011, 5) * 62 * rise + fbm(x * 0.03, z * 0.03, 3) * 6 + 6;
      pos.setY(i, h);
      c.copy(BASALT).lerp(RUST, smoothstep(5, 50, h));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors roughness={1} metalness={0} envMapIntensity={0.3} />
    </mesh>
  );
}

// ---------- rocks ----------
type RockInst = { x: number; z: number; s: number; ry: number; rx: number; tint: number };

function RockField({ items, geometry }: { items: RockInst[]; geometry: THREE.BufferGeometry }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const col = new THREE.Color();
    const a = new THREE.Color("#3f2d26");
    const b = new THREE.Color("#7a4d36");
    items.forEach((r, i) => {
      p.set(r.x, terrainHeight(r.x, r.z) - r.s * 0.18, r.z);
      e.set(r.rx, r.ry, r.rx * 0.5);
      q.setFromEuler(e);
      sc.set(r.s, r.s, r.s * (0.8 + r.tint * 0.4));
      m.compose(p, q, sc);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, col.copy(a).lerp(b, r.tint));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} castShadow receiveShadow>
      <meshStandardMaterial roughness={0.9} metalness={0.02} envMapIntensity={0.4} />
    </instancedMesh>
  );
}

function Rocks() {
  const { pebbles, boulders } = useMemo(() => {
    const rng = mulberry32(1337);
    const pebbles: RockInst[] = [];
    for (let i = 0; i < 1400; i++) {
      const x = -150 + rng() * 300;
      const z = -70 + rng() * 92;
      if (Math.abs(z) < 1.3 && rng() < 0.9) continue;
      const s = 0.04 + Math.pow(rng(), 3) * 0.42;
      pebbles.push({ x, z, s, ry: rng() * 6.28, rx: (rng() - 0.5) * 0.6, tint: rng() });
    }
    const boulders: RockInst[] = [];
    for (let i = 0; i < 80; i++) {
      const fore = rng() < 0.3;
      const x = -150 + rng() * 300;
      const z = fore ? 4.5 + rng() * 14 : -(4 + rng() * 45);
      boulders.push({ x, z, s: 0.5 + rng() * 1.9, ry: rng() * 6.28, rx: (rng() - 0.5) * 0.4, tint: rng() });
    }
    // geological formations near each milestone
    MILESTONES.forEach((_, k) => {
      const mx = roverXForStop(k);
      for (let j = 0; j < 4; j++) {
        boulders.push({
          x: mx + (rng() - 0.5) * 8,
          z: -3.2 - rng() * 5,
          s: 0.45 + rng() * 1.2,
          ry: rng() * 6.28,
          rx: (rng() - 0.5) * 0.3,
          tint: rng() * 0.6,
        });
      }
    });
    return { pebbles, boulders };
  }, []);
  const geoA = useMemo(() => makeRockGeometry(3.1, 1, 0.32), []);
  const geoB = useMemo(() => makeRockGeometry(8.7, 2, 0.42, 0.55), []);
  return (
    <>
      <RockField items={pebbles} geometry={geoA} />
      <RockField items={boulders} geometry={geoB} />
    </>
  );
}

// ---------- milestone markers ----------
function Marker({ index }: { index: number }) {
  const x = roverXForStop(index);
  const ring = useRef<THREE.MeshBasicMaterial>(null);
  const beacon = useRef<THREE.MeshStandardMaterial>(null);
  const gy = terrainHeight(x, 0);
  const py = terrainHeight(x, -2.2);
  useFrame((state) => {
    const active = world.active === index;
    const reached = world.roverX >= x - 0.2;
    const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4);
    if (ring.current) ring.current.opacity = active ? 0.45 + 0.4 * pulse : reached ? 0.18 : 0.32;
    if (beacon.current) beacon.current.emissiveIntensity = active ? 3 + 2 * pulse : reached ? 0.6 : 1.6;
  });
  return (
    <group>
      <mesh position={[x, gy + 0.04, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.45, 1.6, 64]} />
        <meshBasicMaterial ref={ring} color="#ff9a52" transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <group position={[x, py, -2.2]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.035, 2.2, 8]} />
          <meshStandardMaterial color="#c9ccd1" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[0.18, 2.0, 0]} castShadow>
          <boxGeometry args={[0.36, 0.2, 0.01]} />
          <meshStandardMaterial color="#e9e4dc" metalness={0.2} roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.26, 0]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshStandardMaterial ref={beacon} color="#ffb070" emissive="#ff7a2e" emissiveIntensity={1.6} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- rover tracks (revealed with drawRange as the rover drives) ----------
const SEG = 0.3;
function Tracks() {
  const x0 = roverXForStop(-PATH.leadIn) - 0.6;
  const x1 = roverXForStop(MILESTONES.length - 1);
  const { geometry, texture } = useMemo(() => {
    const segs = Math.ceil((x1 - x0) / SEG);
    const pos: number[] = [];
    const uv: number[] = [];
    const half = 0.085;
    for (let i = 0; i < segs; i++) {
      const xa = x0 + i * SEG;
      const xb = xa + SEG;
      for (const zc of [-0.53, 0.53]) {
        const corners: [number, number, number, number][] = [
          [xa, zc - half, xa / 0.35, 0],
          [xb, zc - half, xb / 0.35, 0],
          [xb, zc + half, xb / 0.35, 1],
          [xa, zc - half, xa / 0.35, 0],
          [xb, zc + half, xb / 0.35, 1],
          [xa, zc + half, xa / 0.35, 1],
        ];
        for (const [x, z, u, v] of corners) {
          pos.push(x, terrainHeight(x, z) + 0.02, z);
          uv.push(u, v);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    g.setDrawRange(0, 0);
    return { geometry: g, texture: makeTreadTexture() };
  }, [x0, x1]);
  useFrame(() => {
    const n = Math.max(0, Math.floor((world.roverX - 0.55 - x0) / SEG));
    geometry.setDrawRange(0, n * 12);
  });
  return (
    <mesh geometry={geometry} receiveShadow frustumCulled={false}>
      <meshStandardMaterial
        map={texture}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        roughness={1}
      />
    </mesh>
  );
}

// ---------- drifting dust ----------
function Dust() {
  const COUNT = 900;
  const { geometry, base, sprite } = useMemo(() => {
    const rng = mulberry32(9);
    const base = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      base[i * 3] = -26 + rng() * 52;
      base[i * 3 + 1] = rng() * 7;
      base[i * 3 + 2] = -16 + rng() * 26;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    return {
      geometry: g,
      base,
      sprite: makeGlowTexture("rgba(255,225,190,1)", "rgba(255,200,150,0)", 32),
    };
  }, []);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const p = geometry.attributes["position"] as THREE.BufferAttribute;
    const cx = world.roverX;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      let bx = base[i * 3]! + d * (0.9 + (i % 7) * 0.15);
      if (bx > 26) bx -= 52;
      base[i * 3] = bx;
      const by = base[i * 3 + 1]!;
      const bz = base[i * 3 + 2]!;
      p.setXYZ(i, cx + bx, by + Math.sin(t * 0.6 + i) * 0.12 + terrainHeight(cx, 0), bz);
    }
    p.needsUpdate = true;
  });
  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={sprite}
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        color="#e8c09a"
      />
    </points>
  );
}

// ---------- lighting ----------
function SunLight() {
  const light = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const targetObj = useMemo(() => new THREE.Object3D(), []);
  const off = useMemo(() => new THREE.Vector3(), []);
  const day = useMemo(() => new THREE.Color("#ffe1c2"), []);
  const dusk = useMemo(() => new THREE.Color("#ffb08a"), []);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const rx = world.roverX;
    off.copy(SUN_DAY).lerp(SUN_DUSK, world.sunset);
    l.position.set(rx + off.x, off.y, off.z);
    targetObj.position.set(rx, 0, 0);
    targetObj.updateMatrixWorld();
    l.intensity = 2.7 - 1.9 * world.sunset;
    l.color.copy(day).lerp(dusk, world.sunset);
    if (hemi.current) hemi.current.intensity = 0.85 - 0.55 * world.sunset;
  });
  return (
    <>
      <primitive object={targetObj} />
      <directionalLight
        ref={light}
        target={targetObj}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <hemisphereLight ref={hemi} args={["#e2b48c", "#5a2c1a", 0.85]} />
    </>
  );
}

export function Surface({ onReady }: { onReady?: (() => void) | undefined }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = world.mode === "surface";
  });
  return (
    <group ref={group} visible={false}>
      <Sky />
      <SunLight />
      <Terrain />
      <Mountains />
      <Rocks />
      <Tracks />
      {MILESTONES.map((m, i) => (
        <Marker key={m.code} index={i} />
      ))}
      <Dust />
      <Suspense fallback={null}>
        <Rover onReady={onReady} />
      </Suspense>
    </group>
  );
}
