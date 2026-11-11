import { beforeEach, describe, expect, it } from "vitest";
import { builderStore, CHALLENGE_STEPS } from "./builder-store";
import { getComponentRecommendation } from "./mission-evaluation";
import { BASELINE_SELECTIONS } from "./rover-engineering";

describe("Stage 3.3-B: Challenge Store & Gameplay Logic", () => {
  beforeEach(() => {
    builderStore.resetToBaseline();
  });

  // ---------------------------------------------------------------------------
  // 1. GAME MODE SWITCHING
  // ---------------------------------------------------------------------------
  describe("Game Mode Switching", () => {
    it("initializes in sandbox mode", () => {
      const state = builderStore.get();
      expect(state.gameMode).toBe("sandbox");
      expect(state.isBriefingOpen).toBe(false);
      expect(state.challengeStep).toBe(0);
    });

    it("switches to challenge mode and synchronizes solar scenario", () => {
      builderStore.setActiveMission("winter_survival");
      builderStore.setGameMode("challenge");

      const state = builderStore.get();
      expect(state.gameMode).toBe("challenge");
      expect(state.activeMissionId).toBe("winter_survival");
      // winter_survival uses winter_solstice solar scenario
      expect(state.scenario).toBe("winter_solstice");
      expect(state.activeCategory).toBe("mobility");
    });

    it("switches back to sandbox mode while preserving selections", () => {
      builderStore.setGameMode("challenge");
      builderStore.selectOption("mobility", "wheels_heavy");
      builderStore.setGameMode("sandbox");

      const state = builderStore.get();
      expect(state.gameMode).toBe("sandbox");
      expect(state.selected.mobility).toBe("wheels_heavy");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. MISSION START & INITIALIZATION
  // ---------------------------------------------------------------------------
  describe("Mission Challenge Start", () => {
    it("starts a challenge and resets objectives to uncompleted", () => {
      builderStore.startChallenge("subsurface_astrobiology");

      const state = builderStore.get();
      expect(state.gameMode).toBe("challenge");
      expect(state.activeMissionId).toBe("subsurface_astrobiology");
      expect(state.challengeStep).toBe(0);
      expect(state.activeCategory).toBe("mobility");
      expect(state.completedObjectives.mobility).toBe(false);
      expect(state.completedObjectives.power).toBe(false);
      expect(state.completedObjectives.science).toBe(false);
      expect(state.completedObjectives.telecom).toBe(false);
      expect(state.isBriefingOpen).toBe(false);
    });

    it("toggles briefing modal open state", () => {
      builderStore.setBriefingOpen(true);
      expect(builderStore.get().isBriefingOpen).toBe(true);

      builderStore.setBriefingOpen(false);
      expect(builderStore.get().isBriefingOpen).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ASSEMBLY OBJECTIVE PROGRESSION
  // ---------------------------------------------------------------------------
  describe("Assembly Objective Progression", () => {
    it("marks objective completed when component is installed in challenge mode", () => {
      builderStore.startChallenge("traverse_alpine");

      // Step 0: Mobility
      expect(builderStore.get().completedObjectives.mobility).toBe(false);
      builderStore.selectOption("mobility", "wheels_heavy");
      expect(builderStore.get().completedObjectives.mobility).toBe(true);
      expect(builderStore.get().selected.mobility).toBe("wheels_heavy");

      // Advance to Step 1: Power
      builderStore.nextChallengeStep();
      expect(builderStore.get().challengeStep).toBe(1);
      expect(builderStore.get().activeCategory).toBe("power");

      expect(builderStore.get().completedObjectives.power).toBe(false);
      builderStore.selectOption("power", "power_solar_extended");
      expect(builderStore.get().completedObjectives.power).toBe(true);

      // Advance to Step 2: Science
      builderStore.nextChallengeStep();
      expect(builderStore.get().challengeStep).toBe(2);
      expect(builderStore.get().activeCategory).toBe("science");
      builderStore.selectOption("science", "science_athena_baseline");
      expect(builderStore.get().completedObjectives.science).toBe(true);

      // Advance to Step 3: Telecom
      builderStore.nextChallengeStep();
      expect(builderStore.get().challengeStep).toBe(3);
      expect(builderStore.get().activeCategory).toBe("telecom");
      builderStore.selectOption("telecom", "telecom_hga_dish");
      expect(builderStore.get().completedObjectives.telecom).toBe(true);

      // Verify all 4 completed
      const completed = Object.values(builderStore.get().completedObjectives).filter(Boolean);
      expect(completed.length).toBe(4);
    });

    it("allows revisiting and reconfiguring a completed objective", () => {
      builderStore.startChallenge("traverse_alpine");
      builderStore.selectOption("mobility", "wheels_heavy");
      builderStore.setChallengeStep(2); // Jump to Science
      expect(builderStore.get().activeCategory).toBe("science");

      // Jump back to Mobility
      builderStore.setChallengeStep(0);
      expect(builderStore.get().activeCategory).toBe("mobility");

      // Change wheel to compliant tires
      builderStore.selectOption("mobility", "wheels_compliant");
      expect(builderStore.get().selected.mobility).toBe("wheels_compliant");
      expect(builderStore.get().completedObjectives.mobility).toBe(true);
    });

    it("clamps challenge step bounds (cannot exceed 0..3)", () => {
      builderStore.startChallenge("traverse_alpine");
      expect(builderStore.get().challengeStep).toBe(0);

      builderStore.prevChallengeStep();
      expect(builderStore.get().challengeStep).toBe(0);

      builderStore.setChallengeStep(10);
      expect(builderStore.get().challengeStep).toBe(CHALLENGE_STEPS.length - 1); // 3

      builderStore.nextChallengeStep();
      expect(builderStore.get().challengeStep).toBe(3);
    });

    it("resets challenge progress while retaining the active mission", () => {
      builderStore.startChallenge("subsurface_astrobiology");
      builderStore.selectOption("mobility", "wheels_heavy");
      builderStore.selectOption("power", "power_solar_extended");

      builderStore.resetChallenge();
      const state = builderStore.get();
      expect(state.activeMissionId).toBe("subsurface_astrobiology");
      expect(state.challengeStep).toBe(0);
      expect(state.activeCategory).toBe("mobility");
      expect(state.selected).toEqual(BASELINE_SELECTIONS);
      expect(state.completedObjectives.mobility).toBe(false);
      expect(state.completedObjectives.power).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. HARDWARE RECOMMENDATIONS
  // ---------------------------------------------------------------------------
  describe("Contextual Hardware Recommendations", () => {
    it("identifies heavy wheels as SCENARIO OPTIMAL in alpine traverse", () => {
      const rec = getComponentRecommendation(
        "traverse_alpine",
        "mobility",
        "wheels_heavy",
        BASELINE_SELECTIONS,
      );
      expect(rec.badge).toBe("SCENARIO OPTIMAL");
      expect(rec.isPositive).toBe(true);
      expect(rec.reason).toContain("32 cm chevron grousers");
    });

    it("flags coring drill as INCOMPATIBLE when equipped with baseline solar", () => {
      const rec = getComponentRecommendation(
        "subsurface_astrobiology",
        "science",
        "science_coring_drill",
        { ...BASELINE_SELECTIONS, power: "power_solar_baseline" },
      );
      expect(rec.badge).toBe("INCOMPATIBLE");
      expect(rec.isPositive).toBe(false);
      expect(rec.reason).toContain("Requires Extended Solar Wings or Nuclear MMRTG");
    });

    it("clears INCOMPATIBLE badge on coring drill when power is upgraded", () => {
      const rec = getComponentRecommendation(
        "subsurface_astrobiology",
        "science",
        "science_coring_drill",
        { ...BASELINE_SELECTIONS, power: "power_solar_extended" },
      );
      expect(rec.badge).toBe("SCENARIO OPTIMAL");
      expect(rec.isPositive).toBe(true);
    });

    it("flags EXCESS MASS RISK when component causes total mass to exceed 205 kg", () => {
      const rec = getComponentRecommendation(
        "traverse_alpine",
        "power",
        "power_mmrtg", // +45 kg
        BASELINE_SELECTIONS, // 174 + 45 = 219 kg > 205 kg
      );
      expect(rec.badge).toBe("EXCESS MASS RISK");
      expect(rec.isPositive).toBe(false);
      expect(rec.reason).toContain("205.0 kg simulation threshold");
    });

    it("flags solid-state phased array as SCENARIO OPTIMAL in dusty winter storm scenario", () => {
      const rec = getComponentRecommendation(
        "winter_survival",
        "telecom",
        "telecom_phased_array",
        BASELINE_SELECTIONS,
      );
      expect(rec.badge).toBe("SCENARIO OPTIMAL");
      expect(rec.isPositive).toBe(true);
      expect(rec.reason).toContain("Solid-state electronic beam steering");
    });

    it("flags baseline components as SCENARIO OPTIMAL in Spirit baseline reference", () => {
      const rec = getComponentRecommendation(
        "spirit_baseline",
        "mobility",
        "wheels_standard",
        BASELINE_SELECTIONS,
      );
      expect(rec.badge).toBe("SCENARIO OPTIMAL");
      expect(rec.isPositive).toBe(true);
      expect(rec.reason).toContain("NASA/JPL flight hardware");
    });
  });
});
