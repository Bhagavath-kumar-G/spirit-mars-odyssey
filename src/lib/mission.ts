// Pure mission data + scroll-to-rover mapping. No React, no three.js.

export type Milestone = {
  code: string;
  title: string;
  date: string;
  description: string;
  image: string; // key into the milestone image map (UI layer resolves it)
};

export const MILESTONES: Milestone[] = [
  {
    code: "MISSION 01",
    title: "Launch",
    date: "June 10, 2003",
    description: "Spirit launches from Earth aboard a Delta II rocket.",
    image: "launch",
  },
  {
    code: "MISSION 02",
    title: "Landing on Mars",
    date: "January 4, 2004",
    description: "Spirit successfully lands in Gusev Crater on Mars.",
    image: "landing",
  },
  {
    code: "MISSION 03",
    title: "Exploration Begins",
    date: "2004",
    description:
      "Spirit begins exploring Martian terrain, studying rocks, soil, and geological formations to understand the planet's past.",
    image: "exploration",
  },
  {
    code: "MISSION 04",
    title: "Scientific Discoveries",
    date: "2004–2008",
    description:
      "Spirit explores the Martian surface and discovers evidence of past water activity.",
    image: "discoveries",
  },
  {
    code: "MISSION 05",
    title: "The Final Struggle",
    date: "May 2009",
    description: "Spirit becomes stuck in soft Martian soil, limiting its mobility.",
    image: "struggle",
  },
  {
    code: "MISSION 06",
    title: "Last Communication",
    date: "March 22, 2010",
    description: "Spirit sends its final communication to Earth.",
    image: "communication",
  },
  {
    code: "MISSION 07",
    title: "Mission Complete",
    date: "May 25, 2011",
    description:
      "NASA officially ends the Spirit mission after unsuccessful attempts to re-establish contact.",
    image: "complete",
  },
];

/** World-space layout of the rover path (metres along +x). */
export const PATH = {
  startX: -62,
  spacing: 18,
  leadIn: 0.8, // stops the rover drives before reaching milestone 1
};

/** Fraction of timeline scroll spent on the drive-in, each hold, and each drive. */
export const TIMING = {
  lead: 0.05,
  hold: 0.07,
};

export type RoverState = {
  /** Continuous stop coordinate: 0 = milestone 1, N-1 = last milestone. */
  stop: number;
  /** Index of the milestone the rover is parked at, or -1 while driving. */
  active: number;
  /** Most recent milestone reached (or 0 before the first). */
  reached: number;
  /** 0..1 progress through the current hold or drive. */
  local: number;
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Maps timeline scroll progress (0..1) to where the rover is and which milestone shows. */
export function roverStateAt(progress: number, count = MILESTONES.length): RoverState {
  const p = clamp01(progress);
  const { lead, hold } = TIMING;
  const move = (1 - lead - hold * count) / (count - 1);

  if (p < lead) {
    const t = smooth(p / lead);
    return { stop: -PATH.leadIn * (1 - t), active: -1, reached: 0, local: t };
  }
  let cursor = lead;
  for (let i = 0; i < count; i++) {
    if (p <= cursor + hold || i === count - 1) {
      return { stop: i, active: i, reached: i, local: clamp01((p - cursor) / hold) };
    }
    cursor += hold;
    if (p < cursor + move) {
      const t = (p - cursor) / move;
      return { stop: i + smooth(t), active: -1, reached: i, local: t };
    }
    cursor += move;
  }
  return { stop: count - 1, active: count - 1, reached: count - 1, local: 1 };
}

/** Scroll progress (0..1) at the centre of milestone i's hold window. */
export function progressForMilestone(i: number, count = MILESTONES.length): number {
  const { lead, hold } = TIMING;
  const move = (1 - lead - hold * count) / (count - 1);
  return lead + i * (hold + move) + hold / 2;
}

export function roverXForStop(stop: number): number {
  return PATH.startX + stop * PATH.spacing;
}

export const ROVER_FACTS = [
  { label: "Rover name", value: "Spirit (MER-A)" },
  { label: "Mission", value: "Mars Exploration Rover Mission" },
  { label: "Launch date", value: "June 10, 2003" },
  { label: "Landing date", value: "January 4, 2004" },
  { label: "Landing location", value: "Gusev Crater" },
  { label: "Mission status", value: "Ended" },
];

export const ROVER_OBJECTIVE =
  "Explore Martian geology and search for evidence of past water.";
