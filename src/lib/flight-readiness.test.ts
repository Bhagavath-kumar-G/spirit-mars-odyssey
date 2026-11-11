import { describe, expect, it, beforeEach } from "vitest";
import { builderStore } from "./builder-store";
import { evaluateMission } from "./mission-evaluation";
import { MISSION_SCENARIOS, MissionId } from "./mission-scenarios";
import { BASELINE_SELECTIONS } from "./rover-engineering";

describe("Stage 3.3-C: Flight Readiness Review & Mission Debriefing Engine", () => {
  beforeEach(() => {
    builderStore.resetToBaseline();
  });

  it("1. Manages FRR modal visibility and review tab switching", () => {
    expect(builderStore.get().isReviewOpen).toBe(false);
    expect(builderStore.get().reviewTab).toBe("readiness");

    builderStore.setReviewOpen(true);
    expect(builderStore.get().isReviewOpen).toBe(true);

    builderStore.setReviewTab("debrief");
    expect(builderStore.get().reviewTab).toBe("debrief");

    builderStore.setReviewTab("historical");
    expect(builderStore.get().reviewTab).toBe("historical");

    builderStore.setReviewOpen(false);
    expect(builderStore.get().isReviewOpen).toBe(false);
  });

  it("2. Automatically closes FRR modal when challenge is reset", () => {
    builderStore.startChallenge("traverse_alpine");
    builderStore.setReviewOpen(true);
    expect(builderStore.get().isReviewOpen).toBe(true);

    builderStore.resetChallenge();
    expect(builderStore.get().isReviewOpen).toBe(false);
    expect(builderStore.get().challengeStep).toBe(0);
    expect(builderStore.get().completedObjectives.mobility).toBe(false);
  });

  it("3. Automatically closes FRR modal when starting a new challenge", () => {
    builderStore.setReviewOpen(true);
    expect(builderStore.get().isReviewOpen).toBe(true);

    builderStore.startChallenge("subsurface_astrobiology");
    expect(builderStore.get().isReviewOpen).toBe(false);
    expect(builderStore.get().activeMissionId).toBe("subsurface_astrobiology");
  });

  it("4. Evaluates all 4 scenarios dynamically using evaluateMission as single source of truth", () => {
    const scenarioIds: MissionId[] = [
      "traverse_alpine",
      "subsurface_astrobiology",
      "winter_survival",
      "spirit_baseline",
    ];

    for (const id of scenarioIds) {
      const result = evaluateMission(id, BASELINE_SELECTIONS);
      expect(result.scenarioId).toBe(id);
      expect(result.compositeScore).toBeGreaterThanOrEqual(0);
      expect(result.compositeScore).toBeLessThanOrEqual(100);
      expect(["A", "B", "C", "F"]).toContain(result.grade);

      // Verify all five engineering pillars exist and have required attributes
      const pillars = [
        result.pillars.mass,
        result.pillars.energy,
        result.pillars.mobility,
        result.pillars.science,
        result.pillars.telecom,
      ];

      for (const pillar of pillars) {
        expect(pillar.score).toBeGreaterThanOrEqual(0);
        expect(pillar.score).toBeLessThanOrEqual(100);
        expect(pillar.weight).toBeGreaterThan(0);
        expect(pillar.details).toBeTruthy();
        expect(["optimal", "nominal", "marginal", "critical"]).toContain(pillar.status);
      }
    }
  });

  it("5. Yields Class A for Spirit baseline under nominal conditions", () => {
    const result = evaluateMission("spirit_baseline", BASELINE_SELECTIONS);
    expect(result.grade).toBe("A");
    expect(result.isApproved).toBe(true);
    expect(result.compositeScore).toBeGreaterThanOrEqual(90);
    expect(result.totalDeductions).toBe(0);
  });

  it("6. Correctly assigns Class F when net daily energy margin is negative", () => {
    // Winter survival scenario with baseline solar in dust storm yields critical deficit
    const deficitResult = evaluateMission("winter_survival", {
      mobility: "wheels_heavy", // +60 W draw
      power: "power_solar_baseline", // low winter solar 350 Wh/sol
      science: "science_coring_drill", // +85 W draw
      telecom: "telecom_high_gain_extended",
    });

    expect(deficitResult.budget.netEnergyMarginWhPerSol).toBeLessThan(0);
    expect(deficitResult.grade).toBe("F");
    expect(deficitResult.isApproved).toBe(false);
    expect(deficitResult.gradeLabel).toContain("ENERGY FAILURE");
  });

  it("7. Dynamic reconfiguration immediately refreshes review evaluation without stale state", () => {
    builderStore.startChallenge("traverse_alpine");

    // Initially baseline wheels
    const initialEval = evaluateMission("traverse_alpine", builderStore.get().selected);
    expect(initialEval.pillars.mobility.status).toBe("marginal");

    // Install Heavy-Traction wheels (optimal for alpine traverse)
    builderStore.selectOption("mobility", "wheels_heavy");
    const updatedEval = evaluateMission("traverse_alpine", builderStore.get().selected);

    expect(updatedEval.pillars.mobility.score).toBeGreaterThan(initialEval.pillars.mobility.score);
    expect(updatedEval.pillars.mobility.status).toBe("optimal");
  });

  it("8. Incorporates verified NASA primary references and taxonomy in scenarios", () => {
    const scenarios = Object.values(MISSION_SCENARIOS);
    for (const scen of scenarios) {
      expect(scen.verifiedFact).toBeTruthy();
      expect(scen.sourceReference).toBeTruthy();
      expect(scen.simulationNote).toBeTruthy();
    }

    // Check specific verified Sol 2210 and Troy facts
    expect(MISSION_SCENARIOS.traverse_alpine.verifiedFact).toContain("Troy");
    expect(MISSION_SCENARIOS.traverse_alpine.verifiedFact).toContain("Sol 618");
    expect(MISSION_SCENARIOS.spirit_baseline.verifiedFact).toContain("2,210 sols");
    expect(MISSION_SCENARIOS.winter_survival.verifiedFact).toContain("140 Wh/sol");
  });

  it("9. Properly applies interface compatibility deductions (e.g., coring drill on baseline power)", () => {
    const incompatibleResult = evaluateMission("subsurface_astrobiology", {
      mobility: "wheels_standard",
      power: "power_solar_baseline",
      science: "science_coring_drill", // Requires upgraded power
      telecom: "telecom_hga_dish",
    });

    expect(incompatibleResult.deductions.length).toBeGreaterThan(0);
    const deduction = incompatibleResult.deductions.find((d) => d.id === "DED-DRILL-UNPOWERED");
    expect(deduction).toBeDefined();
    expect(deduction?.penalty).toBe(20);
    expect(incompatibleResult.totalDeductions).toBeGreaterThanOrEqual(20);
  });
});
