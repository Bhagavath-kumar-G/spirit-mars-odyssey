// Rules for the "Build the Explorer" rover assembly game. Pure TS, no React/three.

export type PartId =
  | "chassis"
  | "suspension"
  | "wheels"
  | "solar"
  | "hga"
  | "mast"
  | "pancam"
  | "navcam"
  | "arm"
  | "instruments";

export type Level = 1 | 2 | 3;

export type Part = {
  id: PartId;
  name: string;
  description: string;
  mount: string;
  fact: string;
  level: Level;
  requires?: PartId;
  /** Model node names this part fills. */
  sockets: string[];
};

export const WHEEL_SOCKETS = ["wheel_LF", "wheel_RF", "wheel_LM", "wheel_RM", "wheel_LL", "wheel_RL"];

export const PARTS: Part[] = [
  {
    id: "chassis",
    name: "Rover Body / Main Chassis",
    description: "Contains the main electronic systems.",
    mount: "Central structural platform",
    fact: "The 'warm electronics box' kept Spirit's computer and batteries alive through −100 °C Martian nights.",
    level: 1,
    sockets: ["chassis"],
  },
  {
    id: "suspension",
    name: "Rocker-Bogie Suspension",
    description: "Helps the rover travel across uneven terrain.",
    mount: "Connects chassis to wheel assemblies",
    fact: "The rocker-bogie lets each wheel rise and fall independently, so Spirit could roll over rocks bigger than its wheels.",
    level: 1,
    requires: "chassis",
    sockets: ["suspension"],
  },
  {
    id: "wheels",
    name: "Six Wheels",
    description: "Enable the rover to move across Martian terrain.",
    mount: "One per wheel assembly",
    fact: "Each wheel had its own motor. In 2006 Spirit's right-front wheel failed, and it drove backwards dragging it.",
    level: 1,
    requires: "suspension",
    sockets: WHEEL_SOCKETS,
  },
  {
    id: "solar",
    name: "Solar Panels",
    description: "Generate electrical power using sunlight.",
    mount: "Upper platform",
    fact: "Spirit's solar arrays produced about 900 watt-hours per sol at the start — and Martian winds sometimes blew them clean.",
    level: 2,
    requires: "chassis",
    sockets: ["solar"],
  },
  {
    id: "hga",
    name: "High-Gain Antenna",
    description: "Communicates with Earth through spacecraft relays.",
    mount: "Communication mount on the deck",
    fact: "The steerable dish could talk directly to Earth, while most data went through orbiters like Mars Odyssey.",
    level: 2,
    requires: "chassis",
    sockets: ["hga"],
  },
  {
    id: "mast",
    name: "Camera Mast",
    description: "Supports the rover's navigation and panoramic cameras.",
    mount: "Upper section, front of the deck",
    fact: "The Pancam Mast Assembly raised Spirit's eyes to about 1.5 m — roughly the height of a person.",
    level: 3,
    requires: "chassis",
    sockets: ["mast"],
  },
  {
    id: "pancam",
    name: "Pancam Cameras",
    description: "Capture panoramic images of the Martian surroundings.",
    mount: "Outer ends of the camera mast head",
    fact: "Pancam's two cameras used 14 colour filters to build Spirit's famous high-resolution panoramas.",
    level: 3,
    requires: "mast",
    sockets: ["pancam"],
  },
  {
    id: "navcam",
    name: "Navigation Cameras",
    description: "Help the rover understand its surroundings and navigate safely.",
    mount: "Inner pair on the camera mast head",
    fact: "Navcam's stereo images let Spirit map hazards in 3D and plan safe drives on its own.",
    level: 3,
    requires: "mast",
    sockets: ["navcam"],
  },
  {
    id: "arm",
    name: "Robotic Arm",
    description: "Carries scientific instruments to examine rocks and soil.",
    mount: "Front section, below the deck",
    fact: "The Instrument Deployment Device worked like a human arm, with shoulder, elbow and wrist joints.",
    level: 3,
    requires: "chassis",
    sockets: ["arm"],
  },
  {
    id: "instruments",
    name: "Scientific Instruments",
    description: "Study the chemical and geological composition of Martian rocks.",
    mount: "End of the robotic arm",
    fact: "The arm's turret held a microscope, two spectrometers and the Rock Abrasion Tool that ground into rocks.",
    level: 3,
    requires: "arm",
    sockets: ["instruments"],
  },
];

export const LEVELS: { level: Level; title: string }[] = [
  { level: 1, title: "Basic structure" },
  { level: 2, title: "Power and communication" },
  { level: 3, title: "Scientific exploration" },
];

export const POINTS = { install: 100, level: 250, flawless: 1000 };

export const TOTAL_SOCKETS = PARTS.reduce((n, p) => n + p.sockets.length, 0);

export const MESSAGES = {
  correct: "COMPONENT INSTALLED SUCCESSFULLY!",
  incorrect: "INCORRECT POSITION. CHECK THE ROVER BLUEPRINT.",
};

export type GameState = {
  level: Level;
  installed: string[];
  correct: number;
  mistakes: number;
  score: number;
  startedAt: number | null;
  completedAt: number | null;
};

export type InstallResult = "installed" | "incorrect" | "duplicate" | "locked";

const PART_BY_ID = new Map(PARTS.map((p) => [p.id, p]));
const PART_BY_SOCKET = new Map(PARTS.flatMap((p) => p.sockets.map((s) => [s, p] as const)));

export function getPart(id: PartId): Part {
  return PART_BY_ID.get(id)!;
}

export function partForSocket(socket: string): Part | undefined {
  return PART_BY_SOCKET.get(socket);
}

export function initialState(now: number | null = null): GameState {
  return { level: 1, installed: [], correct: 0, mistakes: 0, score: 0, startedAt: now, completedAt: null };
}

export function placedCount(state: GameState, id: PartId): number {
  return getPart(id).sockets.filter((s) => state.installed.includes(s)).length;
}

export function isPartComplete(state: GameState, id: PartId): boolean {
  return placedCount(state, id) === getPart(id).sockets.length;
}

export function isSocketOpen(state: GameState, socket: string): boolean {
  const part = partForSocket(socket);
  if (!part || state.completedAt !== null) return false;
  if (state.installed.includes(socket)) return false;
  if (part.level !== state.level) return false;
  return !part.requires || isPartComplete(state, part.requires);
}

export function openSockets(state: GameState): string[] {
  return PARTS.flatMap((p) => p.sockets).filter((s) => isSocketOpen(state, s));
}

function levelDone(installed: string[], level: Level) {
  return PARTS.filter((p) => p.level === level).every((p) => p.sockets.every((s) => installed.includes(s)));
}

/** Try to drop `part` on `socket` (null = dropped on the rover but not on an attachment point). */
export function attemptInstall(
  state: GameState,
  partId: PartId,
  socket: string | null,
  now: number,
): { state: GameState; result: InstallResult; levelUp: boolean; complete: boolean } {
  const part = getPart(partId);
  const none = { levelUp: false, complete: false };
  if (state.completedAt !== null || part.level !== state.level) return { state, result: "locked", ...none };
  if (isPartComplete(state, partId)) return { state, result: "duplicate", ...none };

  if (!socket || !part.sockets.includes(socket) || !isSocketOpen(state, socket)) {
    return { state: { ...state, mistakes: state.mistakes + 1 }, result: "incorrect", ...none };
  }

  const installed = [...state.installed, socket];
  let score = state.score + POINTS.install;
  let level = state.level;
  let completedAt: number | null = null;
  let levelUp = false;
  if (levelDone(installed, state.level)) {
    score += POINTS.level;
    if (state.level < 3) {
      level = (state.level + 1) as Level;
      levelUp = true;
    } else {
      completedAt = now;
      if (state.mistakes === 0) score += POINTS.flawless;
    }
  }
  return {
    state: { ...state, installed, score, level, completedAt, correct: state.correct + 1 },
    result: "installed",
    levelUp,
    complete: completedAt !== null,
  };
}

export function canRemove(state: GameState, socket: string): { ok: boolean; reason?: string } {
  const part = partForSocket(socket);
  if (!part || !state.installed.includes(socket)) return { ok: false, reason: "Not installed." };
  if (state.completedAt !== null) return { ok: false, reason: "The rover is complete." };
  if (part.level !== state.level) return { ok: false, reason: "Locked — part of a completed level." };
  const dependent = PARTS.find(
    (p) => p.requires === part.id && p.sockets.some((s) => state.installed.includes(s)),
  );
  if (dependent) return { ok: false, reason: `Remove the ${dependent.name} first.` };
  return { ok: true };
}

/** Return an installed component to the inventory (its install points are taken back). */
export function removePart(state: GameState, socket: string): GameState {
  if (!canRemove(state, socket).ok) return state;
  return {
    ...state,
    installed: state.installed.filter((s) => s !== socket),
    score: state.score - POINTS.install,
    correct: state.correct - 1,
  };
}

export function accuracy(state: GameState): number {
  const total = state.correct + state.mistakes;
  return total === 0 ? 100 : Math.round((state.correct / total) * 100);
}

export function progress(state: GameState): number {
  return state.installed.length / TOTAL_SOCKETS;
}

export function nextInstruction(state: GameState): string {
  if (state.completedAt !== null) return "Assembly complete. Deploy the rover to Mars.";
  const open = openSockets(state);
  const next = PARTS.find((p) => p.sockets.some((s) => open.includes(s)));
  if (!next) return "";
  const left = next.sockets.length - placedCount(state, next.id);
  return next.sockets.length > 1
    ? `Install the ${next.name.toLowerCase()} — ${left} remaining.`
    : `Install the ${next.name}. Mount: ${next.mount.toLowerCase()}.`;
}

/** Attachment-point positions in rover model space (metres). */
export const SOCKET_POSITIONS: Record<string, [number, number, number]> = {
  chassis: [0.0, 0.6, -0.1],
  suspension: [0.36, 0.33, 0.22],
  wheel_LF: [-0.5, 0.13, 0.603],
  wheel_RF: [0.5, 0.13, 0.603],
  wheel_LM: [-0.44, 0.13, -0.11],
  wheel_RM: [0.44, 0.13, -0.11],
  wheel_LL: [-0.53, 0.13, -0.603],
  wheel_RL: [0.53, 0.13, -0.603],
  solar: [-0.45, 0.7, -0.3],
  hga: [0.6, 0.82, -0.23],
  mast: [-0.02, 0.85, 0.37],
  pancam: [-0.2, 1.545, 0.4],
  navcam: [0.06, 1.545, 0.39],
  arm: [-0.12, 0.43, 0.42],
  instruments: [0.14, 0.41, 0.46],
};
