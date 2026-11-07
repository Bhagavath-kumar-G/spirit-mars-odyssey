import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useRef } from "react";
import { Director } from "./Director";
import { Space } from "./Space";
import { Surface } from "./Surface";

/** Fixed full-screen 3D layer behind the scrolling story. Lazy-loaded, client only. */
export default function MarsScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const onReady = useCallback(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => wrap.current?.setAttribute("data-scene-ready", "true")),
    );
  }, []);

  return (
    <div ref={wrap} className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 42, near: 0.1, far: 1600, position: [0, 0.3, 17] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#050404"]} />
        <Director />
        <Environment resolution={128}>
          <Lightformer intensity={1.6} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} color="#ffe6cc" />
          <Lightformer intensity={0.9} color="#c77a4a" position={[-6, 1, -2]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          <Lightformer intensity={0.6} color="#9fb4c8" position={[6, 2, 3]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        </Environment>
        <Space />
        <Surface onReady={onReady} />
      </Canvas>
    </div>
  );
}
