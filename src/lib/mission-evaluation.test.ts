import { describe, expect, it } from "vitest";
import {
  calculateEnergyScore,
  calculateMassScore,
  calculateMobilityScore,
  calculateScienceScore,
  calculateTelecomScore,
  evaluateMission,
} from "./mission-evaluation";
import { MISSION_SCENARIOS } from "./mission-scenarios";
import { BASELINE_SELECTIONS } from "./rover-engineering";

describe("Stage 3.3-A: Mission Evaluation & Scoring Engine", () => {
  // ---------------------------------------------------------------------------
  // 1. SCENARIO CONFIGURATION AUDIT
  // ---------------------------------------------------------------------------
  describe("Scenario Definitions", () => {
    it("defines all four required mission scenarios with complete metadata", () => {
      const scenarioIds = [
        "traverse_alpine",
        "subsurface_astrobiology",
        "winter_survival",
        "spirit_baseline",
      ] as const;

      for (const id of scenarioIds) {
        const scen = MISSION_SCENARIOS[id];
        expect(scen).toBeDefined();
        expect(scen.title).toBeTruthy();
        expect(scen.code).toBeTruthy();
        expect(scen.location).toBeTruthy();
        expect(scen.verifiedFact).toBeTruthy();
        expect(scen.sourceReference).toBeTruthy();
        expect(scen.simulationNote).toBeTruthy();
        expect(scen.environment.solarInsolationWhPerSol).toBeGreaterThan(0);
        expect(scen.demands.minEnergyMarginWhPerSol).toBeGreaterThanOrEqual(0);

        // Verify scoring weights sum to 1.0 (with floating-point tolerance)
        const weightSum =
          scen.weights.mass +
          scen.weights.energy +
          scen.weights.mobility +
          scen.weights.science +
          scen.weights.telecom;
        expect(Math.abs(weightSum - 1.0)).toBeLessThan(0.001);

        // Verify discipline weights sum to 1.0
        const dWeights = scen.weights.scienceDisciplineWeights;
        const dSum =
          dWeights.petrology +
          dWeights.mineralogy +
          dWeights.astrobiology +
          dWeights.stratigraphy;
        expect(Math.abs(dSum - 1.0)).toBeLessThan(0.001);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. PILLAR 1: MASS EFFICIENCY SCORING
  // ---------------------------------------------------------------------------
  describe("Pillar 1: Mass Efficiency Scoring", () => {
    it("awards 100 points to the exact 174.0 kg Spirit flight baseline", () => {
      const res = calculateMassScore(174.0);
      expect(res.score).toBe(100);
      expect(res.status).toBe("optimal");
    });

    it("scales smoothly between 174.0 kg (100) and 205.0 kg (65)", () => {
      const midMass = 174.0 + (205.0 - 174.0) / 2; // ~189.5 kg
      const resMid = calculateMassScore(midMass);
      expect(resMid.score).toBe(83); // 100 - 0.5 * 35 = 82.5 -> 83
      expect(resMid.status).toBe("optimal");

      const resThreshold = calculateMassScore(205.0);
      expect(resThreshold.score).toBe(65);
      expect(resThreshold.status).toBe("nominal");
    });

    it("applies steep penalty when exceeding the 205.0 kg simulation threshold", () => {
      const resOver = calculateMassScore(219.0); // +14.0 kg over 205 kg
      expect(resOver.score).toBe(23); // 65 - 14 * 3.0 = 23
      expect(resOver.status).toBe("critical");
      expect(resOver.details).toContain("Mass Threshold Exceeded");
    });

    it("clamps mass score to 0 on extreme over-mass configurations", () => {
      const resExtreme = calculateMassScore(250.0);
      expect(resExtreme.score).toBe(0);
      expect(resExtreme.status).toBe("critical");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. PILLAR 2: DAILY ENERGY MARGIN SCORING
  // ---------------------------------------------------------------------------
  describe("Pillar 2: Daily Energy Margin Scoring", () => {
    it("returns 0 points and critical status for any negative energy margin", () => {
      const res = calculateEnergyScore(-50, 150);
      expect(res.score).toBe(0);
      expect(res.status).toBe("critical");
      expect(res.details).toContain("Critical Energy Deficit");
    });

    it("scales scores appropriately for positive marginal buffers (0 to 150 Wh/sol)", () => {
      const resZero = calculateEnergyScore(0, 150);
      expect(resZero.score).toBe(0);
      expect(resZero.status).toBe("marginal");

      const resMid = calculateEnergyScore(75, 150);
      expect(resMid.score).toBe(37); // 75/150 * 74 = 37
      expect(resMid.status).toBe("marginal");
    });

    it("scales smoothly between 150 Wh/sol (75 pts) and 500 Wh/sol (100 pts)", () => {
      const res150 = calculateEnergyScore(150, 150);
      expect(res150.score).toBe(75);

      const res409 = calculateEnergyScore(409, 150); // Baseline summer margin
      expect(res409.score).toBe(94);
      expect(res409.status).toBe("optimal");

      const res500 = calculateEnergyScore(500, 150);
      expect(res500.score).toBe(100);
    });

    it("awards 100 points for energy margins exceeding 500 Wh/sol", () => {
      const resSurplus = calculateEnergyScore(1200, 150);
      expect(resSurplus.score).toBe(100);
      expect(resSurplus.status).toBe("optimal");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. PILLAR 3: MOBILITY SUITABILITY SCORING
  // ---------------------------------------------------------------------------
  describe("Pillar 3: Mobility Suitability Scoring", () => {
    const alpineScen = MISSION_SCENARIOS.traverse_alpine;

    it("rewards high-flotation wheels (heavy wheels) on sand drift scenarios", () => {
      const resHeavy = calculateMobilityScore("wheels_heavy", alpineScen);
      expect(resHeavy.score).toBe(100); // 32cm / 28cm * 40 + 22 / 20 * 40 + 20 = 100
      expect(resHeavy.status).toBe("optimal");
      expect(resHeavy.details).toContain("Flotation Verified");
    });

    it("rewards compliant SMA mesh tires on sand drift scenarios", () => {
      const resCompliant = calculateMobilityScore("wheels_compliant", alpineScen);
      expect(resCompliant.score).toBeGreaterThanOrEqual(90);
      expect(resCompliant.status).toBe("optimal");
    });

    it("flags standard wheels as marginal on high-sinkage sand scenarios", () => {
      const resStd = calculateMobilityScore("wheels_standard", alpineScen);
      expect(resStd.score).toBeLessThan(80);
      expect(resStd.status).toBe("marginal");
      expect(resStd.details).toContain("Sand Entrapment Risk");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. PILLAR 4: SCIENTIFIC RETURN SCORING
  // ---------------------------------------------------------------------------
  describe("Pillar 4: Scientific Return Scoring", () => {
    it("evaluates Athena baseline petrology suite highly on alpine petrology targets", () => {
      const scen = MISSION_SCENARIOS.traverse_alpine;
      const res = calculateScienceScore({ science: "science_athena_baseline" }, scen);
      expect(res.score).toBeGreaterThanOrEqual(75);
    });

    it("rewards coring drill and GPR radar on astrobiology & stratigraphy scenario", () => {
      const scen = MISSION_SCENARIOS.subsurface_astrobiology;
      const resDrill = calculateScienceScore({ science: "science_coring_drill" }, scen);
      expect(resDrill.score).toBeGreaterThanOrEqual(85);

      const resRadar = calculateScienceScore({ science: "science_subsurface_radar" }, scen);
      expect(resRadar.score).toBeGreaterThanOrEqual(75);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. PILLAR 5: TELECOM LINK CAPACITY SCORING
  // ---------------------------------------------------------------------------
  describe("Pillar 5: Telecom Link Capacity Scoring", () => {
    it("evaluates extended 0.42m dish and phased array with high bandwidth scores", () => {
      const scen = MISSION_SCENARIOS.subsurface_astrobiology;
      const resExtended = calculateTelecomScore("telecom_high_gain_extended", scen);
      expect(resExtended.score).toBeGreaterThanOrEqual(70);

      const resPhased = calculateTelecomScore("telecom_phased_array", scen);
      expect(resPhased.score).toBeGreaterThanOrEqual(85);
    });

    it("awards environmental bonus to solid-state phased array in high dust opacity scenarios", () => {
      const scen = MISSION_SCENARIOS.winter_survival; // opticalDepthTau = 1.5
      const resPhased = calculateTelecomScore("telecom_phased_array", scen);
      expect(resPhased.score).toBeGreaterThanOrEqual(95);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. COMPATIBILITY & DEDUCTIONS (PREVENTING DUPLICATE PENALTIES)
  // ---------------------------------------------------------------------------
  describe("Compatibility Deductions", () => {
    it("penalizes high-power coring drill when equipped with baseline solar", () => {
      const res = evaluateMission("subsurface_astrobiology", {
        mobility: "wheels_standard",
        power: "power_solar_baseline",
        science: "science_coring_drill",
        telecom: "telecom_hga_dish",
      });

      expect(res.deductions.some((d) => d.id === "DED-DRILL-UNPOWERED")).toBe(true);
      expect(res.compositeScore).toBeLessThan(res.rawWeightedScore);
      expect(res.isApproved).toBe(false);
    });

    it("clears coring drill deduction when equipped with extended solar or MMRTG", () => {
      const resExtended = evaluateMission("subsurface_astrobiology", {
        mobility: "wheels_standard",
        power: "power_solar_extended",
        science: "science_coring_drill",
        telecom: "telecom_hga_dish",
      });

      expect(resExtended.deductions.some((d) => d.id === "DED-DRILL-UNPOWERED")).toBe(false);
    });

    it("does not issue duplicate deductions for mass overage", () => {
      const res = evaluateMission("winter_survival", {
        mobility: "wheels_heavy", // +7.2 kg
        power: "power_mmrtg", // +45.0 kg -> 226.2 kg (> 205 kg)
        science: "science_athena_baseline",
        telecom: "telecom_hga_dish",
      });

      // Mass overage is already reflected in mass pillar score (critical status)
      expect(res.pillars.mass.status).toBe("critical");
      // And caps grade at C
      expect(res.grade).toBe("C");
      // Does not create a redundant duplicate deduction in deductions list
      expect(res.deductions.filter((d) => d.id === "DED-MASS-THRESHOLD").length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. MASTER EVALUATION & FLIGHT READINESS GRADES
  // ---------------------------------------------------------------------------
  describe("Master Mission Evaluation & Grades", () => {
    it("evaluates Spirit Flight Baseline recreation with Class A flight readiness", () => {
      const res = evaluateMission("spirit_baseline", BASELINE_SELECTIONS);

      expect(res.budget.totalMassKg).toBe(174.0);
      expect(res.budget.netEnergyMarginWhPerSol).toBe(409);
      expect(res.pillars.mass.score).toBe(100);
      expect(res.compositeScore).toBeGreaterThanOrEqual(90);
      expect(res.grade).toBe("A");
      expect(res.isApproved).toBe(true);
      expect(res.gradeLabel).toContain("FLIGHT APPROVED");
      expect(res.strengths.length).toBeGreaterThan(0);
    });

    it("evaluates an optimal alpine traverse configuration as Flight Approved", () => {
      const res = evaluateMission("traverse_alpine", {
        mobility: "wheels_heavy",
        power: "power_solar_extended",
        science: "science_athena_baseline",
        telecom: "telecom_hga_dish",
      });

      expect(res.compositeScore).toBeGreaterThanOrEqual(85);
      expect(res.isApproved).toBe(true);
    });

    it("evaluates energy deficit with Class F critical failure", () => {
      // In winter solstice scenario with high-draw equipment and baseline solar
      const res = evaluateMission("winter_survival", {
        mobility: "wheels_heavy", // 60 W draw
        power: "power_solar_baseline", // only 350 Wh/sol in winter!
        science: "science_coring_drill", // 85 W draw
        telecom: "telecom_phased_array", // 55 W draw
      });

      expect(res.budget.netEnergyMarginWhPerSol).toBeLessThan(0);
      expect(res.pillars.energy.score).toBe(0);
      expect(res.grade).toBe("F");
      expect(res.isApproved).toBe(false);
      expect(res.gradeLabel).toContain("MISSION CRITICAL DEFICIT");
    });

    it("safely handles empty, partial, or invalid component selections", () => {
      const resEmpty = evaluateMission("spirit_baseline", {});
      expect(resEmpty.budget.totalMassKg).toBe(174.0);
      expect(resEmpty.compositeScore).toBeGreaterThanOrEqual(90);

      const resInvalid = evaluateMission("spirit_baseline", {
        mobility: "non_existent_part",
      });
      expect(resInvalid.budget.totalMassKg).toBe(174.0);
    });

    it("is completely deterministic: identical inputs yield identical outputs", () => {
      const run1 = evaluateMission("subsurface_astrobiology", {
        mobility: "wheels_compliant",
        power: "power_solar_extended",
        science: "science_subsurface_radar",
        telecom: "telecom_high_gain_extended",
      });

      const run2 = evaluateMission("subsurface_astrobiology", {
        mobility: "wheels_compliant",
        power: "power_solar_extended",
        science: "science_subsurface_radar",
        telecom: "telecom_high_gain_extended",
      });

      expect(run1).toEqual(run2);
    });
  });
});
