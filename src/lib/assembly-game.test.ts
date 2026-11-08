import { describe, expect, it } from "vitest";
import {
  accuracy,
  attemptInstall,
  canRemove,
  initialState,
  openSockets,
  PARTS,
  POINTS,
  removePart,
  TOTAL_SOCKETS,
  WHEEL_SOCKETS,
  type GameState,
  type PartId,
} from "./assembly-game";

const install = (s: GameState, part: PartId, socket: string) => attemptInstall(s, part, socket, 1000).state;

function buildLevel1(s: GameState) {
  s = install(s, "chassis", "chassis");
  s = install(s, "suspension", "suspension");
  for (const w of WHEEL_SOCKETS) s = install(s, "wheels", w);
  return s;
}

function buildAll(s: GameState) {
  s = buildLevel1(s);
  s = install(s, "solar", "solar");
  s = install(s, "hga", "hga");
  s = install(s, "mast", "mast");
  s = install(s, "pancam", "pancam");
  s = install(s, "navcam", "navcam");
  s = install(s, "arm", "arm");
  s = install(s, "instruments", "instruments");
  return s;
}

describe("rover assembly game", () => {
  it("has ten components and fifteen attachment points (six wheels)", () => {
    expect(PARTS).toHaveLength(10);
    expect(TOTAL_SOCKETS).toBe(15);
  });

  it("puts components in the three levels from the brief", () => {
    const byLevel = (l: number) => PARTS.filter((p) => p.level === l).map((p) => p.id).sort();
    expect(byLevel(1)).toEqual(["chassis", "suspension", "wheels"]);
    expect(byLevel(2)).toEqual(["hga", "solar"]);
    expect(byLevel(3)).toEqual(["arm", "instruments", "mast", "navcam", "pancam"]);
  });

  it("awards 100 points for a correct install", () => {
    const r = attemptInstall(initialState(0), "chassis", "chassis", 1);
    expect(r.result).toBe("installed");
    expect(r.state.score).toBe(100);
  });

  it("rejects a wrong position, counts the mistake and installs nothing", () => {
    const s = install(initialState(0), "chassis", "chassis");
    const r = attemptInstall(s, "suspension", "chassis", 1);
    expect(r.result).toBe("incorrect");
    expect(r.state.mistakes).toBe(1);
    expect(r.state.installed).toEqual(["chassis"]);
  });

  it("prevents installing the same component twice", () => {
    const s = install(initialState(0), "chassis", "chassis");
    expect(attemptInstall(s, "chassis", "chassis", 1).result).toBe("duplicate");
  });

  it("keeps later levels locked until the current one is complete", () => {
    const s = install(initialState(0), "chassis", "chassis");
    expect(attemptInstall(s, "solar", "solar", 1).result).toBe("locked");
    const l2 = buildLevel1(initialState(0));
    expect(l2.level).toBe(2);
    expect(openSockets(l2).sort()).toEqual(["hga", "solar"]);
  });

  it("only opens camera sockets once the mast is installed", () => {
    let s = buildLevel1(initialState(0));
    s = install(s, "solar", "solar");
    s = install(s, "hga", "hga");
    expect(openSockets(s)).not.toContain("pancam");
    s = install(s, "mast", "mast");
    expect(openSockets(s)).toContain("pancam");
  });

  it("gives the flawless bonus only when there were no mistakes", () => {
    const flawless = buildAll(initialState(0));
    expect(flawless.completedAt).not.toBeNull();
    expect(flawless.score).toBe(15 * POINTS.install + 3 * POINTS.level + POINTS.flawless);

    let sloppy = attemptInstall(initialState(0), "chassis", null, 1).state;
    sloppy = buildAll(sloppy);
    expect(sloppy.score).toBe(15 * POINTS.install + 3 * POINTS.level);
    expect(accuracy(sloppy)).toBe(94); // 15 of 16 attempts
  });

  it("returns a removed component to the inventory and blocks removing parts others depend on", () => {
    let s = install(initialState(0), "chassis", "chassis");
    s = install(s, "suspension", "suspension");
    expect(canRemove(s, "chassis").ok).toBe(false);
    s = removePart(s, "suspension");
    expect(s.installed).toEqual(["chassis"]);
    expect(s.score).toBe(100);
  });
});
