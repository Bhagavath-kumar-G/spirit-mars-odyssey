import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PATH, roverStateAt, roverXForStop } from "@/lib/mission";
import { INTRO_PHASES } from "@/lib/assembly-intro";
import { scrollState } from "@/lib/scroll-store";
import { ASSEMBLY_POS } from "./AssemblyRover";
import { clamp01, smoothstep, terrainHeight } from "./terrain-math";
import { smoothed, world } from "./world";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const target = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

const DIVE_POS = new THREE.Vector3(0, 1.62, 1.78);
const DIVE_LOOK = new THREE.Vector3(0, 1.05, -1.6);

const fogDay = new THREE.Color("#c49a72");
const fogDusk = new THREE.Color("#2e2224");

/**
 * The single stepper: smooths scroll input, advances the rover, picks the scene
 * mode and drives the camera. Runs before every other useFrame (priority -1).
 */
export function Director() {
  const { camera, scene, size } = useThree();
  const look = useRef(new THREE.Vector3());
  const first = useRef(true);
  const fog = useRef(new THREE.Fog(fogDay.clone(), 30, 260));
  const veil = useRef<HTMLElement | null>(null);

  useFrame((state, rawDt) => {
    // Exponential smoothing is stable for any dt, so allow large steps on slow devices.
    const dt = Math.min(rawDt, 0.25);
    const k = 1 - Math.exp(-7 * dt);
    (Object.keys(smoothed) as (keyof typeof smoothed)[]).forEach((key) => {
      smoothed[key] += (scrollState[key] - smoothed[key]) * k;
    });

    const portrait = size.width < size.height * 0.9;
    const mode = smoothed.descent < 0.5 ? "space" : "surface";
    const switched = mode !== world.mode;
    world.mode = mode;

    const rs = roverStateAt(smoothed.timeline);
    world.roverX = roverXForStop(rs.stop);
    world.active = rs.active;
    world.sunset = smoothstep(0.05, 0.75, smoothed.legacy);
    world.rest = smoothstep(0.0, 0.5, smoothed.legacy);

    // Dust veil hides the cut between space and surface.
    if (!veil.current) veil.current = document.getElementById("descent-veil");
    if (veil.current) {
      const o = 1 - smoothstep(0.05, 0.2, Math.abs(smoothed.descent - 0.5));
      veil.current.style.opacity = o.toFixed(3);
    }

    const t = state.clock.elapsedTime;

    if (mode === "space") {
      scene.fog = null;
      const intro = ease(clamp01(scrollState.intro));
      const far = portrait ? 1.7 : 1;
      const z = (17 - 8.4 * intro - 1.6 * smoothed.hero) * far;
      target.set(Math.sin(t * 0.12) * 0.25, 0.25 + 0.25 * smoothed.hero, z);
      lookTarget.set(0, 0, 0);

      // Opening assembly: start close on a single wheel, pull back to the full rover,
      // then fly past it into the orbit view above.
      const asm = smoothed.assembly;
      if (asm < 0.9999) {
        const b = clamp01(asm / INTRO_PHASES.build);
        const fr = ease(smoothstep(0.02, 0.75, b));
        const ex = ease(smoothstep(INTRO_PHASES.reveal, 1, asm));
        const pf = portrait ? 1.75 : 1;
        tmpB.set(0.5 - 0.5 * fr, 0.13 + 0.42 * fr, 0.6 - 0.6 * fr);
        tmpA
          .set(0.95 + 1.65 * fr, 0.1 + 0.9 * fr, 0.12 + 2.58 * fr)
          .multiplyScalar(pf)
          .add(tmpB)
          .add(ASSEMBLY_POS);
        tmpB.add(ASSEMBLY_POS);
        tmpA.lerp(target, ex);
        tmpB.lerp(lookTarget, ex);
        target.copy(tmpA);
        lookTarget.copy(tmpB);
      }

      const dive = ease(clamp01(smoothed.descent / 0.5));
      target.lerp(DIVE_POS, dive);
      lookTarget.lerp(DIVE_LOOK, dive);
    } else {
      scene.fog = fog.current;
      fog.current.color.copy(fogDay).lerp(fogDusk, world.sunset);
      fog.current.far = 260 - 90 * world.sunset;

      const rx = world.roverX;
      const gy = terrainHeight(rx, 0);
      const fz = portrait ? 12.5 : 7.8;
      const fy = portrait ? 2.9 : 2.1;
      // follow cam: side-on so the rover drives left -> right on screen
      tmpA.set(rx + 0.4, gy + fy, fz);
      tmpB.set(rx + 0.6, gy + (portrait ? 2.0 : 1.45), 0);

      // descent: sweeping drop from altitude into the follow cam
      const d2 = ease(clamp01((smoothed.descent - 0.5) / 0.5));
      const rx0 = roverXForStop(-PATH.leadIn);
      target.set(rx0 - 14, 34, 42).lerp(tmpA, d2);
      lookTarget.set(rx0 + 8, 2, -25).lerp(tmpB, d2);

      // info: orbit to a front three-quarter view, rover pushed right of the HUD
      const info = smoothed.info;
      if (info > 0.001) {
        const ei = ease(info);
        const a = ei * 1.1;
        const r = fz + ((portrait ? 9.5 : 7) - fz) * ei;
        const y = gy + fy + 0.3 * ei;
        tmpA.set(rx + Math.sin(a) * r, y, Math.cos(a) * r);
        const shift = portrait ? 0 : 1.1 * smoothstep(0, 0.2, info);
        tmpB.set(rx - Math.cos(a) * shift, gy + 0.9, Math.sin(a) * shift);
        const blend = smoothstep(0, 0.12, info);
        target.lerp(tmpA, blend);
        lookTarget.lerp(tmpB, blend);
      }

      // legacy: low, wide shot with the sunset behind the resting rover
      const leg = smoothed.legacy;
      if (leg > 0.001) {
        const el = ease(leg);
        const dist = portrait ? 1.5 : 1;
        tmpA.set(rx - 6.5 * dist, gy + 1.1 + 0.4 * (1 - el), 8.5 * dist);
        tmpB.set(rx + 2.2, gy + 1.7, -2.6);
        target.lerp(tmpA, el);
        lookTarget.lerp(tmpB, el);
      }
    }

    const fov = portrait ? 58 : 42;
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    if (first.current || switched) {
      camera.position.copy(target);
      look.current.copy(lookTarget);
      first.current = false;
    } else {
      const kc = 1 - Math.exp(-9 * dt);
      camera.position.lerp(target, kc);
      look.current.lerp(lookTarget, kc);
    }
    camera.lookAt(look.current);
  }, -1);

  return null;
}
