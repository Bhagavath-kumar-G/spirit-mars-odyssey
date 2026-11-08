import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { INTRO_PHASES, INTRO_STEPS, clamp01, nodeArrival } from "@/lib/assembly-intro";
import { useRoverParts } from "./rover-parts";
import { smoothstep } from "./terrain-math";
import { smoothed, world } from "./world";

/** Where the opening assembly happens: in deep space, well in front of Mars. */
export const ASSEMBLY_POS = new THREE.Vector3(0, -0.75, 26);

/** Scroll-driven assembly: a single wheel, then every part flies in and seats itself. */
export function AssemblyRover() {
  const { root, nodes, home } = useRoverParts();
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const a = smoothed.assembly;
    g.visible = world.mode === "space" && a < 0.999;
    if (!g.visible) return;

    const b = clamp01(a / INTRO_PHASES.build);
    const reveal = smoothstep(INTRO_PHASES.build, 1, a);
    root.rotation.y = reveal * 0.85;

    INTRO_STEPS.forEach((step, si) => {
      step.nodes.forEach((name, k) => {
        const n = nodes[name];
        const h = home[name];
        if (!n || !h) return;
        const arr = si === 0 ? 1 : nodeArrival(step, k, b);
        n.visible = arr > 0;
        const e = 1 - Math.pow(1 - arr, 3);
        const left = 1 - e;
        let fx = step.from[0];
        if (name.startsWith("wheel_L")) fx = -Math.abs(fx);
        if (name.startsWith("wheel_R")) fx = Math.abs(fx);
        n.position.set(h.x + fx * left, h.y + step.from[1] * left, h.z + step.from[2] * left);
        if (name.startsWith("wheel_")) n.rotation.set(left * 4, 0, 0);
        else n.rotation.set(left * 0.5, left * 0.7 * (si % 2 ? 1 : -1), 0);
      });
    });

    // The opening wheel floats and turns while it is alone, then settles.
    const solo = 1 - smoothstep(0.02, 0.15, b);
    spin.current += Math.min(dt, 0.1) * 0.6 * solo;
    const w = nodes["wheel_RF"];
    const wh = home["wheel_RF"];
    if (w && wh) {
      w.position.y = wh.y + Math.sin(state.clock.elapsedTime * 1.1) * 0.025 * solo;
      w.rotation.x = spin.current;
    }
  });

  return (
    <group ref={group} position={ASSEMBLY_POS}>
      <primitive object={root} />
      <primitive object={target} position={[0, 0.5, 0]} />
      <directionalLight
        position={[2.5, 3.5, 3]}
        target={target}
        intensity={2.6}
        color="#fff1e2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-1.6}
        shadow-camera-right={1.6}
        shadow-camera-top={1.6}
        shadow-camera-bottom={-1.6}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <pointLight position={[-2.2, 1.6, -2.4]} intensity={9} distance={9} decay={2} color="#ff8a4c" />
      <pointLight position={[2.4, 0.4, -1.8]} intensity={5} distance={8} decay={2} color="#8fb3ff" />
      <pointLight position={[0.5, 2.6, 2.2]} intensity={3} distance={8} decay={2} color="#ffffff" />
    </group>
  );
}
