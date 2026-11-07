import { Stars, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import marsMap from "@/assets/textures/mars-map.jpg";
import { makeGlowTexture, makeRockGeometry } from "./rock-geometry";
import { world } from "./world";

const LIGHT_POS: [number, number, number] = [-7, 2.2, 5];
const LIGHT_DIR = new THREE.Vector3(...LIGHT_POS).normalize();

const vertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLight;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = clamp(-dot(vN, vV), 0.0, 1.0);
    float i = smoothstep(0.0, 0.46, f);
    i = i * i;
    float lf = clamp(dot(vN, uLight) * 0.7 + 0.45, 0.12, 1.0);
    gl_FragColor = vec4(uColor * i * lf * 0.75, 1.0);
  }
`;

const rimFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLight;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = 1.0 - clamp(dot(vN, vV), 0.0, 1.0);
    float i = f * f * f;
    float lf = clamp(dot(vN, uLight) * 0.8 + 0.35, 0.05, 1.0);
    gl_FragColor = vec4(uColor * i * lf * 1.1, 1.0);
  }
`;

function Globe() {
  const tex = useTexture(marsMap);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  }, [tex]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += Math.min(dt, 0.05) * 0.05;
  });
  return (
    <group rotation={[0.1, 0, 0.44]}>
      <mesh ref={ref} rotation={[0, 2.2, 0]}>
        <sphereGeometry args={[2, 128, 96]} />
        <meshStandardMaterial
          map={tex}
          bumpMap={tex}
          bumpScale={3}
          roughness={0.95}
          metalness={0}
          envMapIntensity={0.06}
        />
      </mesh>
    </group>
  );
}

function Atmosphere() {
  const [halo, rim] = useMemo(() => {
    const color = new THREE.Color("#ff8a52");
    const common = {
      vertexShader: vertex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    };
    return [
      new THREE.ShaderMaterial({
        ...common,
        fragmentShader: haloFragment,
        side: THREE.BackSide,
        uniforms: { uColor: { value: color }, uLight: { value: LIGHT_DIR } },
      }),
      new THREE.ShaderMaterial({
        ...common,
        fragmentShader: rimFragment,
        uniforms: { uColor: { value: new THREE.Color("#ffb07a") }, uLight: { value: LIGHT_DIR } },
      }),
    ];
  }, []);
  return (
    <>
      <mesh material={halo} scale={2.25}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
      <mesh material={rim} scale={2.012}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
    </>
  );
}

function Moon({ size, orbit, speed, phase, tilt, seed }: {
  size: number; orbit: number; speed: number; phase: number; tilt: number; seed: number;
}) {
  const geo = useMemo(() => makeRockGeometry(seed, 2, 0.45, 0.75), [seed]);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const a = phase + state.clock.elapsedTime * speed;
    ref.current?.position.set(Math.cos(a) * orbit, Math.sin(a) * orbit * tilt, Math.sin(a) * orbit);
    if (ref.current) ref.current.rotation.y = a * 2;
  });
  return (
    <mesh ref={ref} geometry={geo} scale={size}>
      <meshStandardMaterial color="#6d5d52" roughness={1} envMapIntensity={0.05} />
    </mesh>
  );
}

function SunAndEarth() {
  const [sun, earth] = useMemo(
    () => [
      makeGlowTexture("rgba(255,244,228,1)", "rgba(255,150,70,0)"),
      makeGlowTexture("rgba(150,200,255,1)", "rgba(60,120,255,0)", 64),
    ],
    [],
  );
  return (
    <>
      <sprite position={[-110, 34, -190]} scale={[26, 26, 1]}>
        <spriteMaterial map={sun} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
      </sprite>
      <sprite position={[38, -14, -160]} scale={[1.4, 1.4, 1]}>
        <spriteMaterial map={earth} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
      </sprite>
    </>
  );
}

export function Space() {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.visible = world.mode === "space";
  });
  return (
    <group ref={group}>
      <Stars radius={220} depth={90} count={6000} factor={5} saturation={0} fade speed={0.4} />
      <directionalLight position={LIGHT_POS} intensity={3.4} color="#fff0e0" />
      <ambientLight intensity={0.035} />
      <Suspense fallback={null}>
        <Globe />
      </Suspense>
      <Atmosphere />
      <Moon size={0.11} orbit={3.1} speed={0.16} phase={0.6} tilt={0.18} seed={2.3} />
      <Moon size={0.065} orbit={4.9} speed={0.07} phase={3.4} tilt={0.1} seed={5.1} />
      <SunAndEarth />
    </group>
  );
}
