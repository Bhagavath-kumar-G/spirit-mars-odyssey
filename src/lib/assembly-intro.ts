// Scroll-driven opening: a single wheel grows into the full Spirit rover. Pure data.

export type IntroStep = {
  label: string;
  nodes: string[];
  /** Offset (model metres) each node flies in from. */
  from: [number, number, number];
  /** Build-progress window [start, end] in 0..1. */
  window: [number, number];
};

/** Fraction of the intro section spent building, then holding the reveal, then leaving for Mars. */
export const INTRO_PHASES = { build: 0.68, reveal: 0.84 };

export const INTRO_STEPS: IntroStep[] = [
  { label: "Wheel", nodes: ["wheel_RF"], from: [0, 0, 0], window: [0, 0] },
  { label: "Main chassis", nodes: ["chassis"], from: [0, 2.4, -0.4], window: [0.04, 0.18] },
  { label: "Wheels", nodes: ["wheel_LF", "wheel_RM", "wheel_LM", "wheel_RL", "wheel_LL"], from: [1.8, 0.3, 0], window: [0.16, 0.38] },
  { label: "Rocker-bogie suspension", nodes: ["suspension"], from: [0, -1.4, 0], window: [0.36, 0.5] },
  { label: "Robotic arm", nodes: ["arm"], from: [0, -0.2, 2.0], window: [0.48, 0.6] },
  { label: "Camera mast", nodes: ["mast"], from: [0, -1.0, 0], window: [0.58, 0.7] },
  { label: "Solar panels", nodes: ["solar"], from: [0, 1.8, 0], window: [0.68, 0.82] },
  { label: "Antennas & instruments", nodes: ["hga", "pancam", "navcam", "instruments"], from: [1.4, 0.9, 0.8], window: [0.8, 0.98] },
];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Arrival progress (0 = not started, 1 = seated) for node k of a step at build progress b. */
export function nodeArrival(step: IntroStep, k: number, b: number): number {
  const [s, e] = step.window;
  if (e <= s) return 1;
  const n = step.nodes.length;
  const span = e - s;
  const each = n > 1 ? span * 0.55 : span;
  const start = n > 1 ? s + ((span - each) * k) / (n - 1) : s;
  return clamp01((b - start) / each);
}

/** Index of the step currently assembling (or last completed). */
export function currentStep(b: number): number {
  let idx = 0;
  INTRO_STEPS.forEach((st, i) => {
    if (b >= st.window[0]) idx = i;
  });
  return idx;
}
