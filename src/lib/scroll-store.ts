// Shared, mutable scroll state written by GSAP ScrollTrigger and read every
// frame by the 3D scene. Plain object on purpose: no React re-renders.
export const scrollState = {
  intro: 1, // 0..1 opening camera approach
  exploded: 0, // 0..1 opening exploded rover landing experience
  assembly: 0,
  hero: 0, // landing section scrolled out
  descent: 0, // space -> surface transition
  timeline: 0, // rover drive across the milestones
  info: 0, // rover info panel
  legacy: 0, // closing scene
};

export type ScrollState = typeof scrollState;
