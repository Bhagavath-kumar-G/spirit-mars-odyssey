import { useFrame, ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { builderStore, useBuilder } from "@/lib/builder-store";
import { WorkshopRover } from "./WorkshopRover";

/** Fixed vertical elevation of the cleanroom engineering workshop bay */
export const WORKSHOP_POS = new THREE.Vector3(0, 85, 0);

export function WorkshopBay() {
  const { state, rotateTurntable } = useBuilder();
  const turntableRef = useRef<THREE.Group>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Radial tick marks every 30 degrees on the turntable perimeter
  const tickMarks = useMemo(() => {
    const marks: { angle: number; isMajor: boolean; label?: string | undefined }[] = [];
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const isMajor = deg % 90 === 0;
      let label: string | undefined;
      if (deg === 0) label = "000°";
      else if (deg === 90) label = "090°";
      else if (deg === 180) label = "180°";
      else if (deg === 270) label = "270°";
      marks.push({ angle: rad, isMajor, label });
    }
    return marks;
  }, []);

  // Frame loop: subtle idle auto-spin and smooth turntable rotation
  useFrame((_, dt) => {
    if (!state.isOpen) return;

    if (state.isAutoSpinning && !dragStartRef.current) {
      builderStore.rotateTurntable(dt * 0.08);
    }

    if (turntableRef.current) {
      turntableRef.current.rotation.y = state.turntableAngle;
    }
  });

  // Pointer drag to spin the turntable
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    try {
      (e.nativeEvent.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignored if unsupported
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragStartRef.current) return;
    e.stopPropagation();
    const deltaX = e.clientX - dragStartRef.current.x;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    rotateTurntable(deltaX * 0.0075);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    dragStartRef.current = null;
    try {
      (e.nativeEvent.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
  };

  // Only render 3D workshop assets when the workshop is active
  if (!state.isOpen) return null;

  return (
    <group position={WORKSHOP_POS}>
      {/* ----------------------------------------------------------- */}
      {/* 1. Overhead Cleanroom Soft Studio Lighting                 */}
      {/* ----------------------------------------------------------- */}
      {/* Studio key light */}
      <directionalLight
        position={[3.8, 6.0, 3.8]}
        intensity={1.75}
        color="#fffbf5"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0005}
      />
      {/* Cool balanced fill light */}
      <directionalLight position={[-3.8, 3.5, 2.5]} intensity={0.65} color="#93c5fd" />
      {/* Backlight / rim accent light */}
      <pointLight position={[0, 4.0, -4.0]} intensity={0.55} color="#cbd5e1" distance={15} />

      {/* Overhead Luminaire Fixture (visual emissive bar) */}
      <mesh position={[0, 4.8, 0]}>
        <boxGeometry args={[4.2, 0.08, 2.4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 4.85, 0]}>
        <boxGeometry args={[4.3, 0.04, 2.5]} />
        <meshStandardMaterial color="#1f2937" roughness={0.7} metalness={0.6} />
      </mesh>

      {/* ----------------------------------------------------------- */}
      {/* 2. Technical Grid Floor & Outer Surroundings               */}
      {/* ----------------------------------------------------------- */}
      {/* Deep charcoal technical floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#080a0f" roughness={0.85} metalness={0.2} />
      </mesh>

      {/* Technical grid overlay */}
      <gridHelper
        args={[20, 20, "#2563eb", "#1e293b"]}
        position={[0, -0.045, 0]}
      />

      {/* Concentric distance measurement rings on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[2.98, 3.0, 64]} />
        <meshBasicMaterial color="#334155" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[3.98, 4.0, 64]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      {/* ----------------------------------------------------------- */}
      {/* 3. Circular Illuminated Rover Turntable                    */}
      {/* ----------------------------------------------------------- */}
      {/* Static outer ring bezel */}
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[2.35, 2.4, 0.06, 64]} />
        <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* Glowing perimeter accent ring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.26, 2.29, 64]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Rotating Turntable Top Plate */}
      <group ref={turntableRef}>
        {/* Main dark graphite disc */}
        <mesh position={[0, -0.01, 0]} receiveShadow>
          <cylinderGeometry args={[2.25, 2.25, 0.04, 64]} />
          <meshStandardMaterial color="#141820" roughness={0.45} metalness={0.7} />
        </mesh>

        {/* Concentric technical circles on turntable */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[1.19, 1.20, 48]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[1.79, 1.80, 48]} />
          <meshBasicMaterial color="#334155" />
        </mesh>

        {/* Radial degree tick marks */}
        {tickMarks.map((tm, idx) => (
          <group key={idx} rotation={[0, tm.angle, 0]}>
            <mesh position={[0, 0.013, 2.15]}>
              <boxGeometry args={[0.018, 0.005, tm.isMajor ? 0.14 : 0.07]} />
              <meshBasicMaterial color={tm.isMajor ? "#38bdf8" : "#64748b"} />
            </mesh>
          </group>
        ))}

        {/* Assembled Spirit Rover on the Turntable */}
        <WorkshopRover />
      </group>

      {/* ----------------------------------------------------------- */}
      {/* 4. Invisible Interactive Hit Target for Dragging           */}
      {/* ----------------------------------------------------------- */}
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <circleGeometry args={[2.8, 32]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* ----------------------------------------------------------- */}
      {/* 5. Cleanroom Diagnostic Backdrop Wall                      */}
      {/* ----------------------------------------------------------- */}
      <group position={[0, 1.8, -4.5]}>
        {/* Dark acoustic / cleanroom wall panel */}
        <mesh receiveShadow>
          <planeGeometry args={[10, 4.5]} />
          <meshStandardMaterial color="#0b0e14" roughness={0.9} metalness={0.2} />
        </mesh>

        {/* Subtle engineering frame accent lines */}
        <mesh position={[0, 1.8, 0.01]}>
          <planeGeometry args={[9.2, 0.02]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, -1.8, 0.01]}>
          <planeGeometry args={[9.2, 0.02]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>

        {/* Left diagnostic status column */}
        <group position={[-3.6, 0.2, 0.02]}>
          <mesh position={[0, 0.6, 0]}>
            <planeGeometry args={[1.4, 0.5]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.4, 0.5]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>

        {/* Right diagnostic blueprint column */}
        <group position={[3.6, 0.2, 0.02]}>
          <mesh position={[0, 0.3, 0]}>
            <planeGeometry args={[1.4, 1.1]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>
      </group>
    </group>
  );
}
