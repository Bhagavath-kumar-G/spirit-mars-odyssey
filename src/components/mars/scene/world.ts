import { PATH, roverXForStop } from "@/lib/mission";

/** Per-frame scene state, written by the Director and read by every scene part. */
export const world = {
  mode: "space" as "space" | "surface",
  roverX: roverXForStop(-PATH.leadIn),
  active: -1,
  sunset: 0,
  rest: 0,
};

/** Smoothed copies of the scroll progress values. */
export const smoothed = {
  hero: 0,
  descent: 0,
  timeline: 0,
  info: 0,
  legacy: 0,
};
