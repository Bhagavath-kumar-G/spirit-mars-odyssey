// Pure Systems Engineering Scoring and Flight Readiness Review Engine
// Grounded in verified NASA engineering metrics and peer-reviewed mission literature.

import {
  BASELINE_ROVER_MASS_KG,
  BASELINE_SELECTIONS,
  calculateEngineeringBudget,
  calculateRoverMass,
  calculateScienceRatings,
  COMPONENT_OPTIONS,
  EngineeringBudget,
  SIMULATION_MASS_THRESHOLD_KG,
  SubsystemCategory,
} from "./rover-engineering";
import {
  MissionId,
  MISSION_SCENARIOS,
  MissionScenario,
} from "./mission-scenarios";

export type FlightGrade = "A" | "B" | "C" | "F";

export interface PillarScore {
  name: string;
  score: number; // 0 to 100
  weight: number; // 0 to 1
  weightedScore: number; // score * weight
  details: string;
  status: "optimal" | "nominal" | "marginal" | "critical";
}

export interface DeductionItem {
  id: string;
  category: string;
  penalty: number;
  reason: string;
  recommendation: string;
}

export interface MissionEvaluationResult {
  scenarioId: MissionId;
  scenarioTitle: string;
  selected: Record<SubsystemCategory, string>;
  budget: EngineeringBudget;
  pillars: {
    mass: PillarScore;
    energy: PillarScore;
    mobility: PillarScore;
    science: PillarScore;
    telecom: PillarScore;
  };
  compositeScore: number; // 0 to 100
  rawWeightedScore: number;
  totalDeductions: number;
  grade: FlightGrade;
  gradeLabel: string;
  isApproved: boolean;
  deductions: DeductionItem[];
  strengths: string[];
  weaknesses: string[];
  directives: string[];
  simulationPrediction: string;
}

/**
 * 1. Pillar 1: Mass Efficiency Scoring (0 to 100)
 * Evaluates launch mass against verified 174.0 kg Spirit baseline and 205.0 kg simulation threshold.
 */
export function calculateMassScore(totalMassKg: number): {
  score: number;
  details: string;
  status: PillarScore["status"];
} {
  if (totalMassKg <= BASELINE_ROVER_MASS_KG) {
    return {
      score: 100,
      details: `Optimal Flight Baseline: ${totalMassKg.toFixed(1)} kg meets the exact historical 174.0 kg NASA landing press kit benchmark.`,
      status: "optimal",
    };
  }

  if (totalMassKg <= SIMULATION_MASS_THRESHOLD_KG) {
    // Linear scale between 174.0 kg (100 pts) and 205.0 kg (65 pts)
    const deltaRatio =
      (totalMassKg - BASELINE_ROVER_MASS_KG) /
      (SIMULATION_MASS_THRESHOLD_KG - BASELINE_ROVER_MASS_KG);
    const score = Math.round(100 - deltaRatio * 35);
    return {
      score,
      details: `Nominal Payload: ${totalMassKg.toFixed(1)} kg remains within the 205.0 kg educational simulation mass threshold (${(SIMULATION_MASS_THRESHOLD_KG - totalMassKg).toFixed(1)} kg margin remaining).`,
      status: score >= 80 ? "optimal" : "nominal",
    };
  }

  // Threshold exceeded: steep drop from 65 downwards (3 pts per kg over 205.0 kg)
  const overKg = totalMassKg - SIMULATION_MASS_THRESHOLD_KG;
  const score = Math.max(0, Math.round(65 - overKg * 3.0));
  return {
    score,
    details: `Mass Threshold Exceeded: ${totalMassKg.toFixed(1)} kg exceeds the 205.0 kg simulation threshold by ${overKg.toFixed(1)} kg.`,
    status: "critical",
  };
}

/**
 * 2. Pillar 2: Daily Energy Margin Scoring (0 to 100)
 * Evaluates electrical and thermal balance under scenario insolation.
 */
export function calculateEnergyScore(
  netEnergyMarginWhPerSol: number,
  minRequiredMarginWhPerSol: number = 150,
): {
  score: number;
  details: string;
  status: PillarScore["status"];
} {
  if (netEnergyMarginWhPerSol < 0) {
    return {
      score: 0,
      details: `Critical Energy Deficit: Daily power consumption exceeds generation by ${Math.abs(netEnergyMarginWhPerSol)} Wh/sol. Battery depletion will occur.`,
      status: "critical",
    };
  }

  const threshold = Math.max(50, minRequiredMarginWhPerSol);

  if (netEnergyMarginWhPerSol < threshold) {
    // 0 to threshold scales from 0 to 74 pts (marginal survival buffer)
    const score = Math.round((netEnergyMarginWhPerSol / threshold) * 74);
    return {
      score,
      details: `Marginal Survival Buffer: Net margin of +${netEnergyMarginWhPerSol} Wh/sol is below the scenario requirement of +${threshold} Wh/sol.`,
      status: "marginal",
    };
  }

  // threshold to 500 Wh/sol scales from 75 to 100 pts (nominal to robust reserve)
  const score = Math.min(
    100,
    Math.round(75 + ((netEnergyMarginWhPerSol - threshold) / Math.max(1, 500 - threshold)) * 25),
  );

  return {
    score,
    details: `Nominal Operations Buffer: Net margin of +${netEnergyMarginWhPerSol} Wh/sol satisfies mission requirements with healthy contingency.`,
    status: score >= 85 ? "optimal" : "nominal",
  };
}

/**
 * 3. Pillar 3: Mobility Suitability Scoring (0 to 100)
 * Compares wheel diameter, obstacle clearance, slope rating, and sand flotation.
 */
export function calculateMobilityScore(
  selectedMobilityId: string,
  scenario: MissionScenario,
): {
  score: number;
  details: string;
  status: PillarScore["status"];
} {
  const fallback = COMPONENT_OPTIONS["wheels_standard"];
  const opt = COMPONENT_OPTIONS[selectedMobilityId] ?? fallback;
  const obs = opt?.obstacleCapabilityCm && opt.obstacleCapabilityCm > 0 ? opt.obstacleCapabilityCm : 25;
  const slope = opt?.maxSlopeDeg && opt.maxSlopeDeg > 0 ? opt.maxSlopeDeg : 20;
  const optName = opt?.name ?? "Standard Wheels";

  const obsScore = Math.min(100, (obs / scenario.demands.minObstacleCapabilityCm) * 100);
  const slopeScore = Math.min(100, (slope / scenario.demands.minMaxSlopeDeg) * 100);

  let rawScore = 0;
  let status: PillarScore["status"] = "nominal";
  let details = "";

  if (scenario.demands.flotationRequired) {
    const hasFlotation =
      selectedMobilityId === "wheels_heavy" || selectedMobilityId === "wheels_compliant";
    const flotationBonus = hasFlotation ? 20 : 0;
    rawScore = Math.round(0.4 * obsScore + 0.4 * slopeScore + flotationBonus);

    if (hasFlotation) {
      details = `Flotation Verified: ${optName} (${obs} cm Ø, ${slope}° slope) provides flotation across loose sulfate sands and clears steep ridge obstacles.`;
      status = rawScore >= 85 ? "optimal" : "nominal";
    } else {
      details = `Sand Entrapment Risk: Standard 25 cm cleated wheels risk high wheel slip and entrapment in loose sulfate sand (historical Sol 1870 'Troy' hazard).`;
      status = "marginal";
    }
  } else {
    rawScore = Math.round(0.5 * obsScore + 0.5 * slopeScore);
    details = `Terrain Traversal Verified: ${optName} provides ${obs} cm obstacle clearance and ${slope}° nominal slope capability.`;
    status = rawScore >= 90 ? "optimal" : "nominal";
  }

  const score = Math.max(0, Math.min(100, rawScore));
  return { score, details, status };
}

/**
 * 4. Pillar 4: Scientific Return Scoring (0 to 100)
 * Evaluates alignment between instrument suite and scenario scientific disciplines.
 */
export function calculateScienceScore(
  selected: Partial<Record<SubsystemCategory, string>>,
  scenario: MissionScenario,
): {
  score: number;
  details: string;
  status: PillarScore["status"];
} {
  const { ratings } = calculateScienceRatings(selected);
  const weights = scenario.weights.scienceDisciplineWeights;

  const totalWeighted =
    weights.petrology * ratings.petrology +
    weights.mineralogy * ratings.mineralogy +
    weights.astrobiology * ratings.astrobiology +
    weights.stratigraphy * ratings.stratigraphy;

  const sumWeights =
    weights.petrology + weights.mineralogy + weights.astrobiology + weights.stratigraphy;

  const score = Math.max(0, Math.min(100, Math.round(totalWeighted / sumWeights)));

  const primaryDiscStr = scenario.demands.primaryScienceDisciplines
    .map((d) => `${d.charAt(0).toUpperCase() + d.slice(1)}: ${ratings[d]}/100`)
    .join(", ");

  let status: PillarScore["status"] = "nominal";
  if (score >= scenario.demands.minScienceScore) {
    status = score >= 85 ? "optimal" : "nominal";
  } else {
    status = "marginal";
  }

  const details = `Discipline Alignment: ${score}/100 score on scenario science goals (${primaryDiscStr}).`;
  return { score, details, status };
}

/**
 * 5. Pillar 5: Telecom Link Capacity Scoring (0 to 100)
 * Evaluates direct-to-Earth and orbiter relay bandwidth against scenario demands.
 */
export function calculateTelecomScore(
  selectedTelecomId: string,
  scenario: MissionScenario,
): {
  score: number;
  details: string;
  status: PillarScore["status"];
} {
  const fallback = COMPONENT_OPTIONS["telecom_hga_dish"];
  const opt = COMPONENT_OPTIONS[selectedTelecomId] ?? fallback;
  const dte = opt?.telecomRates?.directToEarthKbps ?? 28.8;
  const uhf = opt?.telecomRates?.uhfOrbiterRelayKbps ?? 128.0;
  const minKbps = scenario.demands.minDownlinkKbps;

  let rawScore = 0;
  if (dte >= minKbps) {
    // 80 base points for meeting requirement + up to 20 points for high bandwidth (up to 100 kbps)
    rawScore = 80 + Math.round(((dte - minKbps) / Math.max(1, 100 - minKbps)) * 20);
  } else {
    rawScore = Math.round((dte / minKbps) * 70);
  }

  // Bonus for phased array in high dust opacity / dust storm scenarios (zero gimbal actuator wear)
  if (
    scenario.environment.opticalDepthTau >= 1.0 &&
    selectedTelecomId === "telecom_phased_array"
  ) {
    rawScore += 10;
  }

  const score = Math.max(0, Math.min(100, rawScore));
  const status: PillarScore["status"] = score >= 85 ? "optimal" : score >= 75 ? "nominal" : "marginal";
  const details = `Bandwidth Capacity: ${dte} kbps DTE (Deep Space Network) and ${uhf} kbps UHF relay.`;

  return { score, details, status };
}

/**
 * Evaluates compatibility rules and generates itemized deductions without duplicates.
 */
export function evaluateDeductions(
  selected: Record<SubsystemCategory, string>,
  budget: EngineeringBudget,
  scenario: MissionScenario,
): DeductionItem[] {
  const deductions: DeductionItem[] = [];

  // Deduction 1: Coring drill on baseline solar without power upgrade
  if (selected.science === "science_coring_drill") {
    if (selected.power === "power_solar_baseline") {
      deductions.push({
        id: "DED-DRILL-UNPOWERED",
        category: "System Compatibility",
        penalty: 20,
        reason:
          "High-Draw Coring Drill on Baseline Solar: Astrobiology coring drill draws 85 W. Under workshop study rules, sustained daily drilling requires Extended Solar Wings or Nuclear MMRTG.",
        recommendation:
          "Upgrade power architecture to High-Latitude Extended Solar Wings or Nuclear MMRTG Generator.",
      });
    }
  }

  // Deduction 2: Critical Energy Deficit
  if (budget.netEnergyMarginWhPerSol < 0) {
    deductions.push({
      id: "DED-ENERGY-DEFICIT",
      category: "Power Architecture",
      penalty: 50,
      reason: `Negative Net Daily Energy Margin: Rover consumes ${budget.dailyConsumptionWhPerSol} Wh/sol but generates only ${budget.powerGenWhPerSol} Wh/sol in this scenario.`,
      recommendation:
        "Switch to High-Latitude Extended Solar Wings or Nuclear MMRTG to balance daily consumption.",
    });
  }

  return deductions;
}

/**
 * Master Mission Evaluation Function
 * Pure, deterministic evaluation of any rover configuration against a selected Mars mission scenario.
 */
export function evaluateMission(
  missionId: MissionId,
  userSelected: Partial<Record<SubsystemCategory, string>> = {},
): MissionEvaluationResult {
  const scenario = MISSION_SCENARIOS[missionId] ?? MISSION_SCENARIOS.spirit_baseline;

  // Sanitize partial or undefined selections to Spirit flight baseline
  const selected: Record<SubsystemCategory, string> = {
    mobility: userSelected.mobility && COMPONENT_OPTIONS[userSelected.mobility]
      ? userSelected.mobility
      : BASELINE_SELECTIONS.mobility,
    power: userSelected.power && COMPONENT_OPTIONS[userSelected.power]
      ? userSelected.power
      : BASELINE_SELECTIONS.power,
    science: userSelected.science && COMPONENT_OPTIONS[userSelected.science]
      ? userSelected.science
      : BASELINE_SELECTIONS.science,
    telecom: userSelected.telecom && COMPONENT_OPTIONS[userSelected.telecom]
      ? userSelected.telecom
      : BASELINE_SELECTIONS.telecom,
  };

  // Evaluate engineering budget under scenario solar insolation
  const budget = calculateEngineeringBudget(selected, scenario.environment.solarScenario);

  // Calculate the 5 individual pillar scores
  const massPillar = calculateMassScore(budget.totalMassKg);
  const energyPillar = calculateEnergyScore(
    budget.netEnergyMarginWhPerSol,
    scenario.demands.minEnergyMarginWhPerSol,
  );
  const mobilityPillar = calculateMobilityScore(selected.mobility, scenario);
  const sciencePillar = calculateScienceScore(selected, scenario);
  const telecomPillar = calculateTelecomScore(selected.telecom, scenario);

  const pillars = {
    mass: {
      name: "Mass Efficiency",
      score: massPillar.score,
      weight: scenario.weights.mass,
      weightedScore: Math.round(massPillar.score * scenario.weights.mass * 10) / 10,
      details: massPillar.details,
      status: massPillar.status,
    },
    energy: {
      name: "Daily Energy Margin",
      score: energyPillar.score,
      weight: scenario.weights.energy,
      weightedScore: Math.round(energyPillar.score * scenario.weights.energy * 10) / 10,
      details: energyPillar.details,
      status: energyPillar.status,
    },
    mobility: {
      name: "Mobility Suitability",
      score: mobilityPillar.score,
      weight: scenario.weights.mobility,
      weightedScore: Math.round(mobilityPillar.score * scenario.weights.mobility * 10) / 10,
      details: mobilityPillar.details,
      status: mobilityPillar.status,
    },
    science: {
      name: "Scientific Return",
      score: sciencePillar.score,
      weight: scenario.weights.science,
      weightedScore: Math.round(sciencePillar.score * scenario.weights.science * 10) / 10,
      details: sciencePillar.details,
      status: sciencePillar.status,
    },
    telecom: {
      name: "Telecom Link Capacity",
      score: telecomPillar.score,
      weight: scenario.weights.telecom,
      weightedScore: Math.round(telecomPillar.score * scenario.weights.telecom * 10) / 10,
      details: telecomPillar.details,
      status: telecomPillar.status,
    },
  };

  const rawWeightedScore = Math.round(
    pillars.mass.score * scenario.weights.mass +
      pillars.energy.score * scenario.weights.energy +
      pillars.mobility.score * scenario.weights.mobility +
      pillars.science.score * scenario.weights.science +
      pillars.telecom.score * scenario.weights.telecom,
  );

  // Evaluate deductions
  const deductions = evaluateDeductions(selected, budget, scenario);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.penalty, 0);

  const compositeScore = Math.max(0, Math.min(100, rawWeightedScore - totalDeductions));

  // Determine Flight Readiness Grade
  let grade: FlightGrade = "F";
  let gradeLabel = "";
  let isApproved = false;

  if (budget.netEnergyMarginWhPerSol < 0) {
    grade = "F";
    gradeLabel = "MISSION CRITICAL DEFICIT (ENERGY FAILURE)";
    isApproved = false;
  } else if (budget.totalMassKg > SIMULATION_MASS_THRESHOLD_KG) {
    // Mass overage caps maximum grade at C or F
    if (compositeScore >= 60) {
      grade = "C";
      gradeLabel = "CONDITIONAL APPROVAL (MASS THRESHOLD EXCEEDED)";
      isApproved = false;
    } else {
      grade = "F";
      gradeLabel = "MISSION REJECTED (OVER-MASS & DEFICIT)";
      isApproved = false;
    }
  } else if (compositeScore >= 90 && deductions.length === 0) {
    grade = "A";
    gradeLabel = "FLIGHT APPROVED (OPTIMAL READINESS)";
    isApproved = true;
  } else if (compositeScore >= 75 && deductions.length === 0) {
    grade = "B";
    gradeLabel = "FLIGHT APPROVED (NOMINAL READINESS)";
    isApproved = true;
  } else if (compositeScore >= 60) {
    grade = "C";
    gradeLabel = "CONDITIONAL APPROVAL (MARGINAL BUFFER)";
    isApproved = false;
  } else {
    grade = "F";
    gradeLabel = "MISSION REJECTED (INADEQUATE PERFORMANCE)";
    isApproved = false;
  }

  // Synthesize Strengths, Weaknesses, Directives
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const directives: string[] = [];

  if (pillars.mass.status === "optimal") {
    strengths.push(`Mass efficiency: ${budget.totalMassKg.toFixed(1)} kg preserves healthy launch mass margin.`);
  } else if (pillars.mass.status === "critical") {
    weaknesses.push(`Mass overage: ${budget.totalMassKg.toFixed(1)} kg exceeds 205.0 kg simulation threshold.`);
    directives.push("Reduce component mass in non-critical subsystems to clear the 205.0 kg simulation threshold.");
  }

  if (pillars.energy.status === "optimal") {
    strengths.push(`Robust power margin: +${budget.netEnergyMarginWhPerSol} Wh/sol provides ample operational buffer.`);
  } else if (pillars.energy.status === "critical") {
    weaknesses.push(`Power deficit: Consumption exceeds generation by ${Math.abs(budget.netEnergyMarginWhPerSol)} Wh/sol.`);
    directives.push("Upgrade power architecture or curtail active tool duty cycles.");
  }

  if (pillars.mobility.status === "optimal") {
    strengths.push(`Locomotion: Highly suited for ${scenario.environment.maxTerrainSlopeDeg}° terrain obstacles and sand flotation.`);
  } else if (pillars.mobility.status === "marginal") {
    weaknesses.push("Locomotion limitations: Standard wheel architecture vulnerable to scenario sand entrapment hazards.");
    directives.push("Consider heavy chevron wheels or compliant SMA tires for soft sulfate sands.");
  }

  if (pillars.science.status === "optimal") {
    strengths.push(`Science capability: ${pillars.science.score}/100 high-yield alignment with scenario scientific goals.`);
  } else if (pillars.science.status === "marginal") {
    weaknesses.push(`Science shortfall: Instrument suite returns only ${pillars.science.score}/100 on primary discipline targets.`);
    directives.push("Equip scenario-recommended analytical payload to satisfy mission science criteria.");
  }

  // Formulate narrative simulation prediction
  let simulationPrediction = "";
  if (grade === "A") {
    simulationPrediction = `FLIGHT OPERATIONS PREDICTION: The configured spacecraft satisfies all ${scenario.title} engineering thresholds. Robust energy margins (+${budget.netEnergyMarginWhPerSol} Wh/sol) and verified ${budget.totalMassKg.toFixed(1)} kg launch mass indicate a high probability of exceeding nominal mission milestones.`;
  } else if (grade === "B") {
    simulationPrediction = `FLIGHT OPERATIONS PREDICTION: The configured spacecraft achieves nominal flight readiness for ${scenario.title}. Minor operational duty cycle constraints will be required during adverse weather periods.`;
  } else if (grade === "C") {
    simulationPrediction = `FLIGHT OPERATIONS PREDICTION: Conditional readiness only. The rover operates with marginal reserves (+${budget.netEnergyMarginWhPerSol} Wh/sol margin or mass near threshold). Science operations may be severely constrained.`;
  } else {
    simulationPrediction = `FLIGHT OPERATIONS PREDICTION: Mission failure predicted. Spacecraft suffers from critical engineering defects (${budget.netEnergyMarginWhPerSol < 0 ? "negative daily energy balance" : "severe technical deficiencies"}). Redesign mandatory before launch authorization.`;
  }

  return {
    scenarioId: missionId,
    scenarioTitle: scenario.title,
    selected,
    budget,
    pillars,
    compositeScore,
    rawWeightedScore,
    totalDeductions,
    grade,
    gradeLabel,
    isApproved,
    deductions,
    strengths,
    weaknesses,
    directives,
    simulationPrediction,
  };
}

export type RecommendationBadge =
  | "SCENARIO OPTIMAL"
  | "RECOMMENDED"
  | "HIGH POWER DRAW"
  | "EXCESS MASS RISK"
  | "INCOMPATIBLE";

export interface ComponentRecommendation {
  badge: RecommendationBadge;
  reason: string;
  isPositive: boolean;
  className: string;
}

/**
 * Computes contextual recommendation badges for hardware options based on scenario demands
 * and real-time technical evaluation.
 */
export function getComponentRecommendation(
  scenarioId: MissionId,
  category: SubsystemCategory,
  optionId: string,
  currentSelected: Record<SubsystemCategory, string>,
): ComponentRecommendation {
  const scenario = MISSION_SCENARIOS[scenarioId] ?? MISSION_SCENARIOS.spirit_baseline;
  const opt = COMPONENT_OPTIONS[optionId];

  // 1. INCOMPATIBILITY CHECK
  if (category === "science" && optionId === "science_coring_drill") {
    const power = currentSelected.power ?? "power_solar_baseline";
    if (power === "power_solar_baseline") {
      return {
        badge: "INCOMPATIBLE",
        reason: "Requires Extended Solar Wings or Nuclear MMRTG to sustain 85 W drilling operations.",
        isPositive: false,
        className: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      };
    }
  }

  // 2. EXCESS MASS RISK CHECK
  const projectedSelected = { ...currentSelected, [category]: optionId };
  const { totalMassKg } = calculateRoverMass(projectedSelected);
  if (totalMassKg > SIMULATION_MASS_THRESHOLD_KG) {
    return {
      badge: "EXCESS MASS RISK",
      reason: `Pushes total rover mass to ${totalMassKg.toFixed(1)} kg, exceeding the 205.0 kg simulation threshold.`,
      isPositive: false,
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };
  }

  // 3. SCENARIO SPECIFIC CHECKS (Takes precedence if hard constraints are clear)
  const isExplicitlyRecommended = scenario.recommendedComponentIds.includes(optionId);

  if (scenarioId === "traverse_alpine") {
    if (category === "mobility") {
      if (optionId === "wheels_heavy") {
        return {
          badge: "SCENARIO OPTIMAL",
          reason: "32 cm chevron grousers provide essential sand flotation across loose drifts at 'Troy'.",
          isPositive: true,
          className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        };
      }
      if (optionId === "wheels_compliant") {
        return {
          badge: "SCENARIO OPTIMAL",
          reason: "Superelastic SMA mesh provides low rolling resistance and rock conformity on Husband Hill.",
          isPositive: true,
          className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        };
      }
      if (optionId === "wheels_standard") {
        return {
          badge: "HIGH POWER DRAW",
          reason: "25 cm spiral cleats risk immobilization in concealed loose sulfate sand.",
          isPositive: false,
          className: "bg-zinc-800 text-zinc-400 border-zinc-700",
        };
      }
    }
    if (category === "power" && optionId === "power_solar_extended") {
      return {
        badge: "SCENARIO OPTIMAL",
        reason: "+35% solar area delivers +296 Wh/sol margin for extended 1.5h daily driving.",
        isPositive: true,
        className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      };
    }
  }

  if (scenarioId === "subsurface_astrobiology") {
    if (category === "science") {
      if (optionId === "science_coring_drill") {
        return {
          badge: "SCENARIO OPTIMAL",
          reason: "Rotary core drill extracts pristine hydrothermal samples (95 astrobiology score).",
          isPositive: true,
          className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        };
      }
      if (optionId === "science_subsurface_radar") {
        return {
          badge: "SCENARIO OPTIMAL",
          reason: "Underbelly GPR radar sounds volcaniclastic strata down to 10m depth (100 stratigraphy score).",
          isPositive: true,
          className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        };
      }
    }
    if (category === "telecom" && optionId === "telecom_high_gain_extended") {
      return {
        badge: "SCENARIO OPTIMAL",
        reason: "57.6 kbps DTE enables downlinking high-resolution spectral cubes.",
        isPositive: true,
        className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      };
    }
  }

  if (scenarioId === "winter_survival") {
    if (category === "power") {
      if (optionId === "power_mmrtg") {
        return {
          badge: "SCENARIO OPTIMAL",
          reason: "Continuous 2,711 Wh/sol and waste heat eliminate survival heater load in low-Sun conditions.",
          isPositive: true,
          className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        };
      }
      if (optionId === "power_solar_extended") {
        return {
          badge: "SCENARIO OPTIMAL",
          reason: "475 Wh/sol winter output provides positive energy margin without mass overage.",
          isPositive: true,
          className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        };
      }
    }
    if (category === "telecom" && optionId === "telecom_phased_array") {
      return {
        badge: "SCENARIO OPTIMAL",
        reason: "Solid-state electronic beam steering eliminates mechanical gimbal failure in dusty skies.",
        isPositive: true,
        className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      };
    }
  }

  if (scenarioId === "spirit_baseline") {
    if (
      (category === "mobility" && optionId === "wheels_standard") ||
      (category === "power" && optionId === "power_solar_baseline") ||
      (category === "science" && optionId === "science_athena_baseline") ||
      (category === "telecom" && optionId === "telecom_hga_dish")
    ) {
      return {
        badge: "SCENARIO OPTIMAL",
        reason: "Authentic NASA/JPL flight hardware configuration flown on Spirit MER-A.",
        isPositive: true,
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    }
  }

  // 4. HIGH POWER DRAW CHECK (for non-optimal components)
  if (opt && opt.powerDrawWatts >= 60 && scenario.environment.solarInsolationWhPerSol <= 600) {
    if (currentSelected.power === "power_solar_baseline") {
      return {
        badge: "HIGH POWER DRAW",
        reason: `${opt.powerDrawWatts} W operational draw severely taxes the +${scenario.environment.solarInsolationWhPerSol} Wh/sol solar energy budget.`,
        isPositive: false,
        className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    }
  }

  if (isExplicitlyRecommended) {
    return {
      badge: "RECOMMENDED",
      reason: "Satisfies scenario engineering demands with nominal margins.",
      isPositive: true,
      className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    };
  }

  return {
    badge: "RECOMMENDED",
    reason: "Standard engineering configuration option.",
    isPositive: true,
    className: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
}
