import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Registers ScrollTrigger once. Call only from effects / handlers (browser). */
export function ensureGsap() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return { gsap, ScrollTrigger };
}

/** Smooth-scrolls so that a tall sticky section sits at progress p (0..1). */
export function scrollToSectionProgress(id: string, p: number) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const range = Math.max(0, el.offsetHeight - window.innerHeight);
  window.scrollTo({ top: top + range * p, behavior: "smooth" });
}

/** Smooth-scrolls to the top of an element by ID. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
}

export const STORY_SECTIONS = [
  { id: "exploded", label: "Blueprint" },
  { id: "hero", label: "Orbit" },
  { id: "descent", label: "Descent" },
  { id: "timeline", label: "Timeline" },
  { id: "dossier", label: "Rover" },
  { id: "legacy", label: "Legacy" },
] as const;
