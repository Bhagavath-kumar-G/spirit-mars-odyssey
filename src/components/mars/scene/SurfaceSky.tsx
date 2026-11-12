import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSurfaceStore } from "@/lib/surface-store";

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
  uniform vec3 uDustHorizon;
  uniform vec3 uDustZenith;
  uniform vec3 uSunGlow;
  uniform vec3 uSunDir;
  uniform float uOpticalDepth; // Tau (0.2 - 1.5)
  varying vec3 vDir;

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -1.0, 1.0);

    // Horizon to zenith Rayleigh/dust gradient
    vec3 nominalSky = mix(uDayHorizon, uDayZenith, smoothstep(-0.02, 0.65, h));
    vec3 dustySky = mix(uDustHorizon, uDustZenith, smoothstep(-0.05, 0.55, h));

    // Optical depth blend
    float tauFactor = smoothstep(0.3, 1.2, uOpticalDepth);
    vec3 skyBase = mix(nominalSky, dustySky, tauFactor);

    // Sun disk & forward-scattering blue glow (Martian atmospheric signature)
    float sunDot = max(dot(d, normalize(uSunDir)), 0.0);
    float g2 = sunDot * sunDot;
    float g4 = g2 * g2;
    float g8 = g4 * g4;
    float g32 = g8 * g8;
    g32 *= g32;

    // Forward scattering blue aureole
    skyBase += uSunGlow * (g8 * 0.35 + g32 * 1.4);

    // Sun disk
    float sunDisk = smoothstep(0.9992, 0.9998, sunDot);
    skyBase += vec3(1.0, 0.98, 0.95) * sunDisk * 2.0;

    gl_FragColor = vec4(skyBase, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * Martian Atmospheric Sky Dome and Photorealistic Sun Directional Lighting.
 * Features parameterized atmospheric dust opacity (optical depth Tau),
 * authentic forward Mie scattering (blue sun halo), and dynamic shadow mapping.
 */
export function SurfaceSky() {
  const { scene } = useThree();
  const { state } = useSurfaceStore();
  const skyMeshRef = useRef<THREE.Mesh>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const targetObj = useMemo(() => new THREE.Object3D(), []);

  // Material setup
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uDayHorizon: { value: new THREE.Color("#d8aa80") },
          uDayZenith: { value: new THREE.Color("#7a5440") },
          uDustHorizon: { value: new THREE.Color("#9c5c36") },
          uDustZenith: { value: new THREE.Color("#4c2c1a") },
          uSunGlow: { value: new THREE.Color("#6fa5e8") }, // Martian blue sunset scattering
          uSunDir: { value: new THREE.Vector3(0.5, 0.7, -0.5).normalize() },
          uOpticalDepth: { value: 0.45 },
        },
      }),
    [],
  );

  // Set scene fog
  useLayoutEffect(() => {
    const fogColor = new THREE.Color("#c99872");
    // Tau 0.45 -> density ~0.004, Tau 1.2 -> density ~0.012
    const density = 0.003 + state.opticalDepthTau * 0.007;
    scene.fog = new THREE.FogExp2(fogColor, density);

    return () => {
      // Scene boundary or Director will reset fog when leaving
    };
  }, [scene, state.opticalDepthTau]);

  useFrame(({ camera }) => {
    // Keep sky dome centered at camera position
    if (skyMeshRef.current) {
      skyMeshRef.current.position.copy(camera.position);
    }

    // Update Sun direction based on store state
    const sunElevRad = (state.sunElevationDeg * Math.PI) / 180;
    const sunAzimuthRad = 0.65; // North-West bias for dramatic shadows
    const sunDir = new THREE.Vector3(
      Math.cos(sunElevRad) * Math.sin(sunAzimuthRad),
      Math.sin(sunElevRad),
      Math.cos(sunElevRad) * Math.cos(sunAzimuthRad),
    ).normalize();

    // Update sky uniforms
    (skyMat.uniforms["uSunDir"]!.value as THREE.Vector3).copy(sunDir);
    skyMat.uniforms["uOpticalDepth"]!.value = state.opticalDepthTau;

    // Update Sun Light position tracking camera target
    const [tx, ty, tz] = state.cameraTarget;
    targetObj.position.set(tx, ty, tz);
    targetObj.updateMatrixWorld();

    const sun = sunLightRef.current;
    if (sun) {
      sun.position.set(tx + sunDir.x * 60, ty + sunDir.y * 60, tz + sunDir.z * 60);

      // Light attenuation by atmospheric dust optical depth Tau
      const tauAttenuation = Math.exp(-state.opticalDepthTau * 0.65);
      sun.intensity = 2.6 * tauAttenuation;

      // Color shifts warmer with higher dust
      const dayColor = new THREE.Color("#ffe0be");
      const dustColor = new THREE.Color("#e89a6a");
      const tauBlend = Math.min(1.0, Math.max(0.0, (state.opticalDepthTau - 0.3) / 0.9));
      sun.color.copy(dayColor).lerp(dustColor, tauBlend);
    }

    const hemi = hemiLightRef.current;
    if (hemi) {
      hemi.intensity = 0.75 * (0.6 + 0.4 * Math.exp(-state.opticalDepthTau * 0.4));
    }
  });

  return (
    <>
      {/* Sky Sphere Dome */}
      <mesh ref={skyMeshRef} material={skyMat} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[750, 48, 24]} />
      </mesh>

      {/* Sun Directional Light with Shadows */}
      <primitive object={targetObj} />
      <directionalLight
        ref={sunLightRef}
        target={targetObj}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-camera-near={5}
        shadow-camera-far={140}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
      />

      {/* Ambient Regolith Hemisphere Fill Light */}
      <hemisphereLight ref={hemiLightRef} args={["#e4b78f", "#4a2416", 0.75]} />
    </>
  );
}

