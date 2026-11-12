import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useBuilder } from "@/lib/builder-store";
import { surfaceStore, useSurfaceStore } from "@/lib/surface-store";
import { useRoverParts } from "./rover-parts";
import { surfaceTerrainHeight } from "./terrain-math";
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

/**
 * Procedural radial ambient occlusion contact shadow texture for rover undercarriage.
 */
function makeContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;

  const gradient = ctx.createRadialGradient(center, center, 4, center, center, center * 0.95);
  gradient.addColorStop(0, "rgba(22, 9, 4, 0.75)");
  gradient.addColorStop(0.35, "rgba(22, 9, 4, 0.55)");
  gradient.addColorStop(0.7, "rgba(22, 9, 4, 0.22)");
  gradient.addColorStop(1, "rgba(22, 9, 4, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Phase 3.4-C: Configured Rover Surface Deployment Component.
 * Faithfully preserves 100% of the user-engineered rover hardware selections
 * from the Workshop and Mission Challenge modes, deploying the spacecraft onto
 * the Martian surface with accurate 4-point terrain suspension alignment.
 */
export function DeployedSurfaceRover() {
  const { state: builderState } = useBuilder();
  const { state: surfaceState } = useSurfaceStore();
  const { root, nodes } = useRoverParts();

  const roverGroupRef = useRef<THREE.Group>(null);
  const shadowMeshRef = useRef<THREE.Mesh>(null);
  const dustPuffRef = useRef<THREE.Mesh>(null);

  const deployTimerRef = useRef(0);
  const [isSettled, setIsSettled] = useState(false);

  const shadowTexture = useMemo(() => makeContactShadowTexture(), []);

  // 1. Synchronize GLB node visibilities with the user's configured hardware
  useEffect(() => {
    // Mobility wheels masking
    const showStandardWheels = builderState.selected.mobility === "wheels_standard";
    const wheelNodes = ["wheel_RF", "wheel_LF", "wheel_RM", "wheel_RL", "wheel_LM", "wheel_LL"];
    for (const wn of wheelNodes) {
      if (nodes[wn]) nodes[wn].visible = showStandardWheels;
    }

    // Power: Solar array (masked when MMRTG nuclear generator replaces it)
    const showSolar = builderState.selected.power !== "power_mmrtg";
    if (nodes["solar"]) nodes["solar"].visible = showSolar;

    // Science: Athena turret (masked when Coring Drill arm replaces it)
    const showInstruments = builderState.selected.science !== "science_coring_drill";
    if (nodes["instruments"]) nodes["instruments"].visible = showInstruments;

    // Telecom: HGA 0.28m dish (masked when Extended Dish or Phased Array replaces it)
    const showHga = builderState.selected.telecom === "telecom_hga_dish";
    if (nodes["hga"]) nodes["hga"].visible = showHga;
  }, [builderState.selected, nodes]);

  // Cleanly restore all GLB nodes on unmount to prevent master model pollution
  useEffect(() => {
    return () => {
      for (const obj of Object.values(nodes)) {
        obj.visible = true;
      }
    };
  }, [nodes]);

  // 2. Ensure all meshes cast and receive shadows on the Martian terrain
  useLayoutEffect(() => {
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [root]);

  // 3. Wheel diameter radius delta for surface grounding
  const wheelRadiusDelta = useMemo(() => {
    if (builderState.selected.mobility === "wheels_heavy") return 0.035; // 32cm vs 25cm baseline
    if (builderState.selected.mobility === "wheels_compliant") return 0.015; // 28cm vs 25cm baseline
    return 0.0;
  }, [builderState.selected.mobility]);

  // 4. Ground contact and touchdown settlement loop
  useFrame((_, dt) => {
    const group = roverGroupRef.current;
    if (!group) return;

    const { x, z, heading } = surfaceState.roverPose;

    // Four-point suspension footprint sampling for authentic rover pitch and roll
    const sinH = Math.sin(heading);
    const cosH = Math.cos(heading);

    // Front & Rear suspension anchors (1.206m wheelbase)
    const xFront = x + 0.603 * sinH;
    const zFront = z + 0.603 * cosH;
    const xRear = x - 0.603 * sinH;
    const zRear = z - 0.603 * cosH;

    // Starboard & Port suspension anchors (0.97m track width)
    const xStarboard = x + 0.485 * cosH;
    const zStarboard = z - 0.485 * sinH;
    const xPort = x - 0.485 * cosH;
    const zPort = z + 0.485 * sinH;

    const yFront = surfaceTerrainHeight(xFront, zFront);
    const yRear = surfaceTerrainHeight(xRear, zRear);
    const yStarboard = surfaceTerrainHeight(xStarboard, zStarboard);
    const yPort = surfaceTerrainHeight(xPort, zPort);

    const averageGroundY = (yFront + yRear + yStarboard + yPort) / 4;
    const pitch = Math.atan2(yFront - yRear, 1.206);
    const roll = Math.atan2(yStarboard - yPort, 0.97);

    // Deployment Touchdown spring settlement animation
    let dropOffset = 0;
    if (surfaceState.isDeploying && !isSettled) {
      deployTimerRef.current += dt;
      const t = deployTimerRef.current;
      if (t < 1.6) {
        // Spring damped harmonic settling curve
        dropOffset = 0.55 * Math.exp(-t * 3.8) * Math.cos(t * 7.5);

        // Expand subtle dust settlement puff
        if (dustPuffRef.current) {
          const puffScale = 1.0 + t * 1.5;
          dustPuffRef.current.scale.set(puffScale, 1.0, puffScale);
          (dustPuffRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
            0,
            0.35 * (1 - t / 1.6),
          );
        }
      } else {
        setIsSettled(true);
        surfaceStore.endDeploymentIntro();
        if (dustPuffRef.current) {
          (dustPuffRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }
    }

    const finalY = averageGroundY + wheelRadiusDelta + dropOffset;

    // Apply exact world transform to rover group
    group.position.set(x, finalY, z);
    group.rotation.set(pitch, heading, roll, "YXZ");

    // Position contact shadow directly under chassis, conforming to ground
    if (shadowMeshRef.current) {
      shadowMeshRef.current.position.set(x, averageGroundY + 0.015, z);
      shadowMeshRef.current.rotation.set(-Math.PI / 2 + pitch, roll, heading, "YXZ");
    }

    // Controllable landing dust puff
    if (dustPuffRef.current && surfaceState.isDeploying) {
      dustPuffRef.current.position.set(x, averageGroundY + 0.02, z);
    }
  });

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. SOFT TERRAIN CONTACT SHADOW                                 */}
      {/* ------------------------------------------------------------- */}
      <mesh ref={shadowMeshRef} renderOrder={1}>
        <planeGeometry args={[1.75, 2.2]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.65}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* ------------------------------------------------------------- */}
      {/* 2. TOUCHDOWN DUST RING PUFF (ANIMATED DURING DEPLOYMENT)      */}
      {/* ------------------------------------------------------------- */}
      {surfaceState.isDeploying && (
        <mesh ref={dustPuffRef} rotation-x={-Math.PI / 2} renderOrder={2}>
          <ringGeometry args={[0.9, 1.6, 32]} />
          <meshBasicMaterial
            color="#e2a87a"
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. CONFIGURED ROVER HIERARCHY                                 */}
      {/* ------------------------------------------------------------- */}
      <group ref={roverGroupRef}>
        {/* Baseline MER-A Parts Graph Clone */}
        <primitive object={root} />

        {/* Mobility Subsystem Alternatives */}
        {builderState.selected.mobility === "wheels_heavy" && (
          <HeavyWheels isCategoryActive={false} />
        )}
        {builderState.selected.mobility === "wheels_compliant" && (
          <CompliantTires isCategoryActive={false} />
        )}

        {/* Power Subsystem Alternatives */}
        {builderState.selected.power === "power_solar_extended" && (
          <ExtendedSolarWings isCategoryActive={false} />
        )}
        {builderState.selected.power === "power_mmrtg" && (
          <MmrtgAssembly isCategoryActive={false} />
        )}

        {/* Science Subsystem Alternatives */}
        {builderState.selected.science === "science_coring_drill" && (
          <CoringDrill isCategoryActive={false} />
        )}
        {builderState.selected.science === "science_subsurface_radar" && (
          <SubsurfaceRadar isCategoryActive={false} />
        )}

        {/* Telecommunications Subsystem Alternatives */}
        {builderState.selected.telecom === "telecom_high_gain_extended" && (
          <ExtendedDish isCategoryActive={false} />
        )}
        {builderState.selected.telecom === "telecom_phased_array" && (
          <PhasedArray isCategoryActive={false} />
        )}
      </group>
    </>
  );
}

