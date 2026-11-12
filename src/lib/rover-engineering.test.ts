import { describe, expect, it } from "vitest";
import {
  BASELINE_AVIONICS_HOTEL_WH_SOL,
  BASELINE_ELECTRIC_HEAT_WH_SOL,
  BASELINE_GROUND_CLEARANCE_CM,
  BASELINE_NOMINAL_SLOPE_DEG,
  BASELINE_ROVER_MASS_KG,
  BASELINE_SELECTIONS,
  BASELINE_SOLAR_OUTPUT_WH_SOL,
  BASELINE_WHEEL_DIAMETER_CM,
  COMPONENT_OPTIONS,
  DUTY_HOURS_MOBILITY,
  DUTY_HOURS_SCIENCE,
  DUTY_HOURS_TELECOM,
  HISTORICAL_PROPOSED_DESIGN_MASS_KG,
  MARTIAN_SOL_HOURS,
  SIMULATION_MASS_THRESHOLD_KG,
  SOLAR_SCENARIOS,
  calculateActiveOperationalLoad,
  calculateContinuousHotelLoad,
  calculateEnergyGeneration,
  calculateEngineeringBudget,
  calculateMmrtgGrossGeneration,
  calculateNetDailyEnergyMargin,
  calculateRoverMass,
  calculateScienceRatings,
  evaluateCompatibilityAndNotices,
} from "./rover-engineering";
import { builderStore } from "./builder-store";

describe("Rover Engineering Systems Engine", () => {
  // -------------------------------------------------------------
  // 1. Spirit Baseline Configuration
  // -------------------------------------------------------------
  it("evaluates Spirit MER-A baseline flight configuration with verified NASA parameters", () => {
    const budget = calculateEngineeringBudget(BASELINE_SELECTIONS);

    // Verified As-Built Landed Mass (NASA January 2004 Landing Press Kit)
    expect(budget.totalMassKg).toBe(BASELINE_ROVER_MASS_KG);
    expect(budget.totalMassKg).toBe(174.0);
    expect(budget.massDeltaKg).toBe(0);
    expect(budget.isOverMassThreshold).toBe(false);
    expect(budget.isOverAirbagLimit).toBe(false);

    // Historical reference note
    expect(HISTORICAL_PROPOSED_DESIGN_MASS_KG).toBe(185.0);

    // Verified Early Mission Peak Solar Output (1.5 AU, Gusev Crater)
    expect(budget.powerGenWhPerSol).toBe(BASELINE_SOLAR_OUTPUT_WH_SOL);
    expect(budget.powerGenWhPerSol).toBe(900);

    // Verified Dimensions
    expect(budget.obstacleCapabilityCm).toBe(BASELINE_WHEEL_DIAMETER_CM);
    expect(budget.obstacleCapabilityCm).toBe(25);
    expect(budget.chassisGroundClearanceCm).toBe(BASELINE_GROUND_CLEARANCE_CM);
    expect(budget.chassisGroundClearanceCm).toBe(30);
    expect(budget.maxSlopeDeg).toBe(BASELINE_NOMINAL_SLOPE_DEG);
    expect(budget.maxSlopeDeg).toBe(20.0);
    expect(budget.operationalSlopeRange).toContain("31.2° record");

    // Hotel & Active Electrical Loads
    // Hotel: 296 avionics + 80 electric heater = 376 Wh/sol
    expect(budget.hotelLoadWhPerSol).toBe(
      BASELINE_AVIONICS_HOTEL_WH_SOL + BASELINE_ELECTRIC_HEAT_WH_SOL,
    );
    expect(budget.hotelLoadWhPerSol).toBe(376);

    // Active load: 67.5W (mobility) + 30W (science) + 17.5W (telecom) = 115 Wh/sol (unrounded sum)
    expect(budget.activeLoadWhPerSol).toBe(115);
    expect(budget.dailyConsumptionWhPerSol).toBe(376 + 115);
    expect(budget.dailyConsumptionWhPerSol).toBe(491);
    expect(budget.netEnergyMarginWhPerSol).toBe(900 - 491);
    expect(budget.netEnergyMarginWhPerSol).toBe(409);

    // Telecommunications Breakdown (Direct-to-Earth vs UHF Relay)
    expect(budget.telecomRates.directToEarthKbps).toBe(28.8);
    expect(budget.telecomRates.directToEarthRange).toContain("3.5–12.0 kbps");
    expect(budget.telecomRates.uhfOrbiterRelayKbps).toBe(128.0);
    expect(budget.telecomRates.uhfRelayRange).toContain("32–128 kbps");

    // Review Status
    expect(budget.compatibilityWarnings).toHaveLength(0);
    expect(budget.isReviewPassed).toBe(true);
  });

  // -------------------------------------------------------------
  // 2. Mass Calculations for Each Alternative Component
  // -------------------------------------------------------------
  it("calculates exact mass and dimensions for each alternative component", () => {
    // Mobility: Heavy Sand Wheels (+7.2 kg)
    const heavyMass = calculateRoverMass({ mobility: "wheels_heavy" });
    expect(heavyMass.totalMassKg).toBe(181.2);
    expect(heavyMass.massDeltaKg).toBe(7.2);
    expect(heavyMass.isOverMassThreshold).toBe(false);

    // Mobility: Compliant SMA Tires (+4.8 kg)
    const compliantMass = calculateRoverMass({ mobility: "wheels_compliant" });
    expect(compliantMass.totalMassKg).toBe(178.8);
    expect(compliantMass.massDeltaKg).toBe(4.8);
    expect(compliantMass.isOverMassThreshold).toBe(false);

    // Power: Extended Solar Wings (+14.5 kg)
    const extSolarMass = calculateRoverMass({ power: "power_solar_extended" });
    expect(extSolarMass.totalMassKg).toBe(188.5);
    expect(extSolarMass.massDeltaKg).toBe(14.5);

    // Power: Nuclear MMRTG (+45.0 kg complete generator)
    const mmrtgMass = calculateRoverMass({ power: "power_mmrtg" });
    expect(mmrtgMass.totalMassKg).toBe(219.0);
    expect(mmrtgMass.massDeltaKg).toBe(45.0);
    expect(mmrtgMass.isOverMassThreshold).toBe(true);
    expect(mmrtgMass.notice).toContain("exceeds the 205.0 kg Simulation Mass Threshold");

    // Science: Coring Drill (+11.8 kg)
    const drillMass = calculateRoverMass({ science: "science_coring_drill" });
    expect(drillMass.totalMassKg).toBe(185.8);
    expect(drillMass.massDeltaKg).toBe(11.8);

    // Science: Subsurface Radar (+5.4 kg)
    const radarMass = calculateRoverMass({ science: "science_subsurface_radar" });
    expect(radarMass.totalMassKg).toBe(179.4);
    expect(radarMass.massDeltaKg).toBe(5.4);

    // Telecom: High-Gain Extended (+4.6 kg)
    const extDishMass = calculateRoverMass({ telecom: "telecom_high_gain_extended" });
    expect(extDishMass.totalMassKg).toBe(178.6);
    expect(extDishMass.massDeltaKg).toBe(4.6);

    // Telecom: Solid-State Phased Array (+2.8 kg)
    const phasedMass = calculateRoverMass({ telecom: "telecom_phased_array" });
    expect(phasedMass.totalMassKg).toBe(176.8);
    expect(phasedMass.massDeltaKg).toBe(2.8);
  });

  // -------------------------------------------------------------
  // 3. Mass Threshold Boundary Conditions
  // -------------------------------------------------------------
  it("evaluates simulation mass threshold boundary conditions (205.0 kg)", () => {
    expect(SIMULATION_MASS_THRESHOLD_KG).toBe(205.0);

    // Exactly at threshold: 174.0 + 31.0 = 205.0 kg -> NOT over threshold
    const atThreshold = calculateRoverMass({
      mobility: "wheels_heavy", // +7.2
      power: "power_solar_extended", // +14.5
      science: "science_subsurface_radar", // +5.4
      telecom: "telecom_phased_array", // +2.8
      // Sum = 7.2 + 14.5 + 5.4 + 2.8 = 29.9 kg -> 203.9 kg
    });
    expect(atThreshold.totalMassKg).toBe(203.9);
    expect(atThreshold.isOverMassThreshold).toBe(false);

    // Just above threshold: 174.0 + 7.2 + 14.5 + 11.8 = 207.5 kg -> OVER threshold
    const aboveThreshold = calculateRoverMass({
      mobility: "wheels_heavy", // +7.2
      power: "power_solar_extended", // +14.5
      science: "science_coring_drill", // +11.8
    });
    expect(aboveThreshold.totalMassKg).toBe(207.5);
    expect(aboveThreshold.isOverMassThreshold).toBe(true);
    expect(aboveThreshold.notice).toContain("exceeds the 205.0 kg Simulation Mass Threshold");
  });

  // -------------------------------------------------------------
  // 4. Solar Generation Scenarios (Historical & Simulation)
  // -------------------------------------------------------------
  it("evaluates all solar generation scenarios correctly", () => {
    // 1. Clean Summer Perihelion (NASA Benchmark)
    const summer = calculateEnergyGeneration("power_solar_baseline", "clean_summer_perihelion");
    expect(summer.powerGenWhPerSol).toBe(900);
    expect(summer.classification).toBe("SPIRIT FLIGHT HARDWARE");
    expect(SOLAR_SCENARIOS.clean_summer_perihelion.classification).toBe("NASA Historical Benchmark");

    const summerExt = calculateEnergyGeneration("power_solar_extended", "clean_summer_perihelion");
    expect(summerExt.powerGenWhPerSol).toBe(1215);

    // 2. Mid-Mission Nominal (NASA Benchmark)
    const midMission = calculateEnergyGeneration("power_solar_baseline", "mid_mission_nominal");
    expect(midMission.powerGenWhPerSol).toBe(600);
    expect(SOLAR_SCENARIOS.mid_mission_nominal.classification).toBe("NASA Historical Benchmark");

    const midMissionExt = calculateEnergyGeneration("power_solar_extended", "mid_mission_nominal");
    expect(midMissionExt.powerGenWhPerSol).toBe(810);

    // 3. Winter Solstice (Simulation Scenario)
    const winter = calculateEnergyGeneration("power_solar_baseline", "winter_solstice");
    expect(winter.powerGenWhPerSol).toBe(350);
    expect(SOLAR_SCENARIOS.winter_solstice.classification).toBe("Simulation Input Scenario");

    const winterExt = calculateEnergyGeneration("power_solar_extended", "winter_solstice");
    expect(winterExt.powerGenWhPerSol).toBe(475);

    // 4. Severe Dust Storm (Simulation Scenario)
    const storm = calculateEnergyGeneration("power_solar_baseline", "severe_dust_storm");
    expect(storm.powerGenWhPerSol).toBe(140);
    expect(SOLAR_SCENARIOS.severe_dust_storm.classification).toBe("Simulation Input Scenario");

    const stormExt = calculateEnergyGeneration("power_solar_extended", "severe_dust_storm");
    expect(stormExt.powerGenWhPerSol).toBe(190);
  });

  // -------------------------------------------------------------
  // 5. Idealized MMRTG Generation
  // -------------------------------------------------------------
  it("calculates idealized continuous MMRTG electrical generation over a 24.65h Martian sol", () => {
    expect(MARTIAN_SOL_HOURS).toBe(24.65);

    // 110 W beginning-of-life * 24.65 hours = 2,711.5 Wh/sol (gross)
    const grossWh = calculateMmrtgGrossGeneration(110, 24.65);
    expect(grossWh).toBe(2711);

    const mmrtgGen = calculateEnergyGeneration("power_mmrtg");
    expect(mmrtgGen.powerGenWhPerSol).toBe(2711);
    expect(mmrtgGen.isIdealizedGross).toBe(true);
    expect(mmrtgGen.classification).toBe("NASA-INSPIRED ALTERNATIVE");
  });

  // -------------------------------------------------------------
  // 6. Hotel and Active Energy Calculations
  // -------------------------------------------------------------
  it("computes continuous hotel loads and active operational duty cycle loads", () => {
    // Solar configurations: 296 Wh avionics + 80 Wh survival heater = 376 Wh/sol
    const solarHotel = calculateContinuousHotelLoad("power_solar_baseline");
    expect(solarHotel.avionicsWhPerSol).toBe(296);
    expect(solarHotel.survivalHeaterWhPerSol).toBe(80);
    expect(solarHotel.totalHotelWhPerSol).toBe(376);
    expect(solarHotel.thermalCreditApplied).toBe(false);

    // MMRTG configuration: 296 Wh avionics + 0 Wh heater (waste heat credit) = 296 Wh/sol
    const mmrtgHotel = calculateContinuousHotelLoad("power_mmrtg");
    expect(mmrtgHotel.avionicsWhPerSol).toBe(296);
    expect(mmrtgHotel.survivalHeaterWhPerSol).toBe(0);
    expect(mmrtgHotel.totalHotelWhPerSol).toBe(296);
    expect(mmrtgHotel.thermalCreditApplied).toBe(true);

    // Active operational loads with default duty hours (unrounded intermediate, final aggregate rounded)
    const baselineActive = calculateActiveOperationalLoad(BASELINE_SELECTIONS);
    expect(baselineActive.mobilityWh).toBe(67.5); // 45W * 1.5h = 67.5 Wh/sol
    expect(baselineActive.scienceWh).toBe(30); // 30W * 1.0h = 30 Wh/sol
    expect(baselineActive.telecomWh).toBe(17.5); // 35W * 0.5h = 17.5 Wh/sol
    expect(baselineActive.totalActiveWhPerSol).toBe(115); // Math.round(67.5 + 30 + 17.5) = 115 Wh/sol

    // Custom duty cycle hours
    const customActive = calculateActiveOperationalLoad(BASELINE_SELECTIONS, {
      mobilityHours: 3.0,
      scienceHours: 2.0,
      telecomHours: 1.0,
    });
    expect(customActive.mobilityWh).toBe(135);
    expect(customActive.scienceWh).toBe(60);
    expect(customActive.telecomWh).toBe(35);
    expect(customActive.totalActiveWhPerSol).toBe(230);
  });

  it("verifies unrounded intermediate summation and final aggregate rounding policy", () => {
    // Case where individual rounds would diverge from rounded sum:
    // mobility: 45 * 1.5 = 67.5 (individually rounds to 68)
    // telecom: 35 * 0.5 = 17.5 (individually rounds to 18)
    // science: 30 * 1.0 = 30.0 (rounds to 30)
    // Sum of individually rounded values would be 68 + 18 + 30 = 116
    // Required unrounded intermediate sum: 67.5 + 17.5 + 30.0 = 115.0 -> Math.round = 115
    const load = calculateActiveOperationalLoad(BASELINE_SELECTIONS);
    expect(load.mobilityWh).toBe(67.5);
    expect(load.telecomWh).toBe(17.5);
    expect(load.scienceWh).toBe(30);
    expect(load.totalActiveWhPerSol).toBe(115);
    expect(load.totalActiveWhPerSol).not.toBe(116);

    // Another fractional test case: 0.3h mobility (13.5 Wh), 0.3h telecom (10.5 Wh)
    // Sum = 13.5 + 10.5 = 24.0 Wh -> 24
    const fractionalLoad = calculateActiveOperationalLoad(BASELINE_SELECTIONS, {
      mobilityHours: 0.3, // 45 * 0.3 = 13.5
      scienceHours: 0,
      telecomHours: 0.3, // 35 * 0.3 = 10.5
    });
    expect(fractionalLoad.mobilityWh).toBe(13.5);
    expect(fractionalLoad.telecomWh).toBe(10.5);
    expect(fractionalLoad.totalActiveWhPerSol).toBe(24);
  });

  // -------------------------------------------------------------
  // 7. Positive, Low, and Negative Net Energy Margins
  // -------------------------------------------------------------
  it("evaluates positive, low, and negative net daily energy margins", () => {
    // 1. Positive healthy margin (> 150 Wh/sol)
    const healthy = calculateNetDailyEnergyMargin(900, 376, 115);
    expect(healthy.dailyConsumptionWhPerSol).toBe(491);
    expect(healthy.netEnergyMarginWhPerSol).toBe(409);
    expect(healthy.warning).toBeUndefined();

    // 2. Low energy margin (< 150 Wh/sol and >= 0 Wh/sol)
    const low = calculateNetDailyEnergyMargin(550, 376, 115);
    expect(low.dailyConsumptionWhPerSol).toBe(491);
    expect(low.netEnergyMarginWhPerSol).toBe(59);
    expect(low.warning).toContain("operational safety margin");

    // 3. Negative energy deficit (< 0 Wh/sol)
    const deficit = calculateNetDailyEnergyMargin(350, 376, 115);
    expect(deficit.dailyConsumptionWhPerSol).toBe(491);
    expect(deficit.netEnergyMarginWhPerSol).toBe(-141);
    expect(deficit.warning).toContain("Critical Energy Deficit");
    expect(deficit.warning).toContain("Battery depletion will occur");
  });

  // -------------------------------------------------------------
  // 8. Coring Drill Simulation Compatibility Rule
  // -------------------------------------------------------------
  it("enforces coring drill power compatibility rule with informative remediation", () => {
    const drillWithStandardSolar = {
      ...BASELINE_SELECTIONS,
      science: "science_coring_drill",
      power: "power_solar_baseline",
    };
    const warnings = evaluateCompatibilityAndNotices(drillWithStandardSolar, 185.8, 300);

    expect(
      warnings.some((w) =>
        w.includes("Extended daily coring operations draw substantial cumulative energy"),
      ),
    ).toBe(true);

    // Resolves when paired with Extended Solar Wings
    const drillWithExtendedSolar = {
      ...drillWithStandardSolar,
      power: "power_solar_extended",
    };
    const resolvedWarnings = evaluateCompatibilityAndNotices(drillWithExtendedSolar, 200.3, 600);
    expect(
      resolvedWarnings.some((w) =>
        w.includes("Extended daily coring operations draw substantial cumulative energy"),
      ),
    ).toBe(false);

    // Resolves when paired with Nuclear MMRTG
    const drillWithMmrtg = {
      ...drillWithStandardSolar,
      power: "power_mmrtg",
    };
    const mmrtgWarnings = evaluateCompatibilityAndNotices(drillWithMmrtg, 230.8, 2200);
    expect(
      mmrtgWarnings.some((w) =>
        w.includes("Extended daily coring operations draw substantial cumulative energy"),
      ),
    ).toBe(false);
  });

  // -------------------------------------------------------------
  // 9. Science Discipline Scoring and Aggregate Score
  // -------------------------------------------------------------
  it("aggregates science ratings across Petrology, Mineralogy, Astrobiology, and Stratigraphy", () => {
    // Athena baseline
    const athenaScore = calculateScienceRatings(BASELINE_SELECTIONS);
    expect(athenaScore.ratings.petrology).toBe(95);
    expect(athenaScore.ratings.mineralogy).toBe(90);
    expect(athenaScore.ratings.astrobiology).toBe(45);
    expect(athenaScore.ratings.stratigraphy).toBe(45);
    // (95 + 90 + 45 + 45) / 4 = 68.75 -> 69
    expect(athenaScore.overallScore).toBe(69);

    // Coring Drill upgrade: astrobiology boosts to 95
    const drillScore = calculateScienceRatings({
      ...BASELINE_SELECTIONS,
      science: "science_coring_drill",
    });
    expect(drillScore.ratings.astrobiology).toBe(95);
    expect(drillScore.ratings.stratigraphy).toBe(80);
    expect(drillScore.overallScore).toBe(88); // (90 + 85 + 95 + 80) / 4 = 87.5 -> 88

    // Deep Subsurface Sounding Radar: stratigraphy boosts to 100
    const radarScore = calculateScienceRatings({
      ...BASELINE_SELECTIONS,
      science: "science_subsurface_radar",
    });
    expect(radarScore.ratings.stratigraphy).toBe(100);
  });

  // -------------------------------------------------------------
  // 10. Authenticity Classification
  // -------------------------------------------------------------
  it("assigns valid authenticity badges and traceable citations to all catalogue components", () => {
    const validBadges = new Set([
      "SPIRIT FLIGHT HARDWARE",
      "NASA-INSPIRED ALTERNATIVE",
      "FICTIONAL SIMULATION",
    ]);

    for (const [id, comp] of Object.entries(COMPONENT_OPTIONS)) {
      expect(validBadges.has(comp.authenticity), `${id} has invalid authenticity badge`).toBe(true);
      expect(comp.verifiedFact.length).toBeGreaterThan(10);
      expect(comp.sourceReference.length).toBeGreaterThan(5);
    }

    // Baseline components must all be authentic Spirit Flight Hardware
    for (const id of Object.values(BASELINE_SELECTIONS)) {
      expect(COMPONENT_OPTIONS[id]?.authenticity).toBe("SPIRIT FLIGHT HARDWARE");
    }

    // Alternative badges check
    expect(COMPONENT_OPTIONS["wheels_heavy"]?.authenticity).toBe("NASA-INSPIRED ALTERNATIVE");
    expect(COMPONENT_OPTIONS["power_mmrtg"]?.authenticity).toBe("NASA-INSPIRED ALTERNATIVE");
    expect(COMPONENT_OPTIONS["telecom_phased_array"]?.authenticity).toBe("FICTIONAL SIMULATION");
  });

  // -------------------------------------------------------------
  // 11. Builder Store State & Reset-to-Baseline
  // -------------------------------------------------------------
  it("manages builder reactive state mutations and one-click reset to Spirit baseline", () => {
    builderStore.resetToBaseline();
    expect(builderStore.get().selected).toEqual(BASELINE_SELECTIONS);
    expect(builderStore.get().scenario).toBe("clean_summer_perihelion");
    expect(builderStore.get().isOpen).toBe(false);

    builderStore.setOpen(true);
    expect(builderStore.get().isOpen).toBe(true);

    builderStore.setActiveCategory("power");
    expect(builderStore.get().activeCategory).toBe("power");

    builderStore.selectOption("power", "power_mmrtg");
    expect(builderStore.get().selected.power).toBe("power_mmrtg");

    builderStore.setScenario("winter_solstice");
    expect(builderStore.get().scenario).toBe("winter_solstice");

    builderStore.setActiveTab("review");
    expect(builderStore.get().activeTab).toBe("review");

    // Reset restores baseline
    builderStore.resetToBaseline();
    expect(builderStore.get().selected.power).toBe("power_solar_baseline");
    expect(builderStore.get().selected).toEqual(BASELINE_SELECTIONS);
    expect(builderStore.get().scenario).toBe("clean_summer_perihelion");
    expect(builderStore.get().activeTab).toBe("configure");
  });

  // -------------------------------------------------------------
  // 12. Boundary Cases and Invalid Input Handling
  // -------------------------------------------------------------
  it("gracefully handles invalid inputs and empty selections without throwing", () => {
    // Empty object
    const emptyMass = calculateRoverMass({});
    expect(emptyMass.totalMassKg).toBe(174.0);
    expect(emptyMass.massDeltaKg).toBe(0);

    // Invalid IDs in calculateEngineeringBudget fall back safely to baseline
    const budgetWithBogusIds = calculateEngineeringBudget({
      mobility: "non_existent_wheel",
      power: "fake_power",
      science: "ghost_science",
      telecom: "alien_telecom",
    });
    expect(budgetWithBogusIds.totalMassKg).toBe(174.0);
    expect(budgetWithBogusIds.powerGenWhPerSol).toBe(900);
    expect(budgetWithBogusIds.isReviewPassed).toBe(true);

    // Negative power generation in margin calculation
    const negativeGen = calculateNetDailyEnergyMargin(-100, 200, 100);
    expect(negativeGen.netEnergyMarginWhPerSol).toBe(-400);
    expect(negativeGen.warning).toContain("Critical Energy Deficit");
  });
});
