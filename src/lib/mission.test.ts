import { describe, expect, it } from "vitest";
import { MILESTONES, progressForMilestone, roverStateAt } from "./mission";

describe("Spirit mission timeline", () => {
  it("has the seven milestones in historical order", () => {
    expect(MILESTONES.map((m) => m.date)).toEqual([
      "June 10, 2003",
      "January 4, 2004",
      "2004",
      "2004–2008",
      "May 2009",
      "March 22, 2010",
      "May 25, 2011",
    ]);
  });

  it("starts before the first milestone and ends parked at Mission Complete", () => {
    expect(roverStateAt(0).active).toBe(-1);
    expect(roverStateAt(1).active).toBe(6);
    expect(roverStateAt(1).stop).toBe(6);
  });

  it("parks the rover at each milestone in the middle of its hold window", () => {
    for (let i = 0; i < MILESTONES.length; i++) {
      const s = roverStateAt(progressForMilestone(i));
      expect(s.active).toBe(i);
      expect(s.stop).toBe(i);
    }
  });

  it("only ever moves the rover left to right as you scroll down", () => {
    let last = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.001) {
      const { stop } = roverStateAt(p);
      expect(stop).toBeGreaterThanOrEqual(last);
      last = stop;
    }
  });
});
