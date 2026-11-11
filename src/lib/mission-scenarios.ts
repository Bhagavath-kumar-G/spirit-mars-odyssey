// Mission Scenarios for the Phase 3 Rover Assembly Simulation
// Grounded in verified NASA/JPL MER-A flight history, peer-reviewed literature,
// and educational engineering trade studies.

import {
  ScienceRatings,
  SolarScenario,
  SubsystemCategory,
} from "./rover-engineering";

export type MissionId =
  | "traverse_alpine"
  | "subsurface_astrobiology"
  | "winter_survival"
  | "spirit_baseline";

export interface EnvironmentalConditions {
  solarScenario: SolarScenario;
  solarInsolationWhPerSol: number;
  opticalDepthTau: number;
  maxTerrainSlopeDeg: number;
  surfaceMaterial: string;
  nightTempC: number;
  dustDepositionRatePercentPerSol: number;
}

export interface MissionDemands {
  minObstacleCapabilityCm: number;
  minMaxSlopeDeg: number;
  flotationRequired: boolean;
  minEnergyMarginWhPerSol: number;
  primaryScienceDisciplines: Array<keyof ScienceRatings>;
  minScienceScore: number;
  minDownlinkKbps: number;
  targetRoverMassKg: number;
}

export interface ScoringWeights {
  mass: number;
  energy: number;
  mobility: number;
  science: number;
  telecom: number;
  scienceDisciplineWeights: Record<keyof ScienceRatings, number>;
}

export interface MissionScenario {
  id: MissionId;
  title: string;
  code: string;
  subtitle: string;
  location: string;
  solWindow: string;
  historicalContext: string;
  verifiedFact: string;
  sourceReference: string;
  simulationNote: string;
  environment: EnvironmentalConditions;
  demands: MissionDemands;
  weights: ScoringWeights;
  recommendedComponentIds: string[];
  briefingDirectives: string[];
}

export const MISSION_SCENARIOS: Record<MissionId, MissionScenario> = {
  // ---------------------------------------------------------------------------
  // SCENARIO 1: COLUMBIA HILLS ALPINE TRAVERSE
  // ---------------------------------------------------------------------------
  traverse_alpine: {
    id: "traverse_alpine",
    title: "Columbia Hills Alpine Traverse",
    code: "MSN-TRAV-01",
    subtitle: "Long-Distance Steep Slope & Loose Sand Flotation",
    location: "Gusev Crater / Columbia Hills (Husband Hill & West Spur)",
    solWindow: "Sol 400 – 620",
    historicalContext:
      "Inspired by Spirit's historic ascent of Husband Hill (Sol 400–620, scaling steep 31.2° rocky slopes) and subsequent encounter with deceptive sulfate sand at 'Troy' where its right-front wheel became immobilized.",
    verifiedFact:
      "Spirit successfully ascended Husband Hill on Sol 618 across a 31.2° rocky incline. In April 2009 (Sol 1870), Spirit broke through an iron-oxide crust into loose sulfate sand at 'Troy', immobilizing the rover.",
    sourceReference:
      "R. E. Arvidson et al., 'Spirit Mars Rover Mission: Overview and Results from the Northern Edge of Home Plate', J. Geophys. Res., 2008; R. A. Lindemann and D. B. Bickler, IEEE, 2005",
    simulationNote:
      "Educational simulation trade study: Evaluates high-traction deep-sand wheels (+7.2 kg, 32 cm Ø) and compliant SMA mesh tires (+4.8 kg, 28 cm Ø) against standard 25 cm flight wheels across steep rocky slopes and high-sinkage sand dunes.",
    environment: {
      solarScenario: "mid_mission_nominal",
      solarInsolationWhPerSol: 600,
      opticalDepthTau: 0.6,
      maxTerrainSlopeDeg: 25.0,
      surfaceMaterial: "Concealed loose sulfate sand drift over bedrock outcrops",
      nightTempC: -85,
      dustDepositionRatePercentPerSol: 0.18,
    },
    demands: {
      minObstacleCapabilityCm: 28,
      minMaxSlopeDeg: 20.0,
      flotationRequired: true,
      minEnergyMarginWhPerSol: 150,
      primaryScienceDisciplines: ["petrology", "mineralogy"],
      minScienceScore: 70,
      minDownlinkKbps: 28.8,
      targetRoverMassKg: 195.0,
    },
    weights: {
      mass: 0.2,
      energy: 0.25,
      mobility: 0.35,
      science: 0.1,
      telecom: 0.1,
      scienceDisciplineWeights: {
        petrology: 0.35,
        mineralogy: 0.35,
        astrobiology: 0.15,
        stratigraphy: 0.15,
      },
    },
    recommendedComponentIds: [
      "wheels_heavy",
      "wheels_compliant",
      "power_solar_extended",
      "science_athena_baseline",
      "telecom_hga_dish",
    ],
    briefingDirectives: [
      "Select high-flotation locomotion hardware capable of traversing loose sulfate sands without exceeding wheel-sink thresholds.",
      "Maintain rock-climbing clearance to clear obstacles taller than 25 cm during the Husband Hill ridge ascent.",
      "Reserve at least +150 Wh/sol net energy margin to support a 1.5-hour daily drive duty cycle under mid-mission dust conditions.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SCENARIO 2: HOME PLATE SUBSURFACE INVESTIGATION
  // ---------------------------------------------------------------------------
  subsurface_astrobiology: {
    id: "subsurface_astrobiology",
    title: "Home Plate Subsurface Investigation",
    code: "MSN-SCI-02",
    subtitle: "Hydrothermal Volcanism & Deep Subsurface Sounding",
    location: "Home Plate Volcanic Plateau (Inner Basin of Columbia Hills)",
    solWindow: "Sol 750 – 1100",
    historicalContext:
      "Commemorates Spirit's landmark discovery of nearly 90% pure opaline silica deposits around Home Plate, indicating ancient volcanic fumaroles or hydrothermal hot springs with high biosignature preservation potential.",
    verifiedFact:
      "S. W. Squyres et al. confirmed that churning wheels at Gertrude Weil uncovered white silica deposits with ~90% SiO2 concentration, confirming Martian hydrothermal activity.",
    sourceReference:
      "S. W. Squyres et al., 'Detection of Silica-Rich Deposits on Mars', Science, 320(5879), 1063–1067, 2008",
    simulationNote:
      "Educational simulation trade study: Evaluates astrobiology coring drill (85 W draw, +11.8 kg) and polarimetric ground-penetrating radar (+5.4 kg). Sustained daily drilling requires Extended Solar Wings or Nuclear MMRTG under workshop simulation rules.",
    environment: {
      solarScenario: "clean_summer_perihelion",
      solarInsolationWhPerSol: 750,
      opticalDepthTau: 0.45,
      maxTerrainSlopeDeg: 15.0,
      surfaceMaterial: "Stratified volcaniclastic ash and hydrothermal opaline silica deposits",
      nightTempC: -90,
      dustDepositionRatePercentPerSol: 0.12,
    },
    demands: {
      minObstacleCapabilityCm: 25,
      minMaxSlopeDeg: 15.0,
      flotationRequired: false,
      minEnergyMarginWhPerSol: 150,
      primaryScienceDisciplines: ["astrobiology", "stratigraphy"],
      minScienceScore: 80,
      minDownlinkKbps: 57.6,
      targetRoverMassKg: 195.0,
    },
    weights: {
      mass: 0.15,
      energy: 0.25,
      mobility: 0.1,
      science: 0.35,
      telecom: 0.15,
      scienceDisciplineWeights: {
        petrology: 0.1,
        mineralogy: 0.15,
        astrobiology: 0.4,
        stratigraphy: 0.35,
      },
    },
    recommendedComponentIds: [
      "science_coring_drill",
      "science_subsurface_radar",
      "power_solar_extended",
      "power_mmrtg",
      "telecom_high_gain_extended",
    ],
    briefingDirectives: [
      "Equip analytical instruments capable of subsurface stratification logging and sample core extraction to search for hydrothermal biosignatures.",
      "Ensure the power subsystem can sustain high active tool draw (85 W) without triggering daily energy deficits.",
      "Provision high-bandwidth telecommunications to downlink comprehensive spectral cubes and radar radargrams to Earth.",
    ],
  },

  // ---------------------------------------------------------------------------
  // SCENARIO 3: WINTER SOLSTICE & DUST STORM SURVIVAL
  // ---------------------------------------------------------------------------
  winter_survival: {
    id: "winter_survival",
    title: "Winter Solstice & Dust Storm Survival",
    code: "MSN-SURV-03",
    subtitle: "Low Insolation & Critical Thermal Survival Heating",
    location: "Gusev Crater Southern Slopes (14.8° S Latitude)",
    solWindow: "Sol 800 – 1450",
    historicalContext:
      "Modeled after Spirit's extreme southern winter solstices and the severe 2007 global dust storms where atmospheric dust opacity rose above tau = 1.5, reducing solar output to 140–350 Wh/sol and triggering critical battery survival protocols.",
    verifiedFact:
      "In July 2007, atmospheric dust blocked up to 99% of direct sunlight. Solar generation plummeted from 700 Wh/sol to less than 140 Wh/sol, forcing engineers to turn off all non-essential equipment to save battery reserves.",
    sourceReference:
      "P. Stella et al., 'Performance of the Mars Exploration Rover Solar Arrays', IEEE, 2005; NASA JPL MER Surface Operations Summaries",
    simulationNote:
      "Educational simulation trade study: Evaluates simulated Nuclear MMRTG (+45.0 kg, continuous 2,711 Wh/sol, zero survival electric heater load) vs. Extended Solar Wings (+14.5 kg, 475 Wh/sol winter) against the 205.0 kg mass threshold.",
    environment: {
      solarScenario: "winter_solstice",
      solarInsolationWhPerSol: 350,
      opticalDepthTau: 1.5,
      maxTerrainSlopeDeg: 12.0,
      surfaceMaterial: "Fine atmospheric dust-covered basaltic regolith",
      nightTempC: -105,
      dustDepositionRatePercentPerSol: 0.25,
    },
    demands: {
      minObstacleCapabilityCm: 25,
      minMaxSlopeDeg: 12.0,
      flotationRequired: false,
      minEnergyMarginWhPerSol: 50,
      primaryScienceDisciplines: ["petrology", "mineralogy"],
      minScienceScore: 60,
      minDownlinkKbps: 28.8,
      targetRoverMassKg: 205.0,
    },
    weights: {
      mass: 0.25,
      energy: 0.4,
      mobility: 0.1,
      science: 0.15,
      telecom: 0.1,
      scienceDisciplineWeights: {
        petrology: 0.25,
        mineralogy: 0.25,
        astrobiology: 0.25,
        stratigraphy: 0.25,
      },
    },
    recommendedComponentIds: [
      "power_mmrtg",
      "power_solar_extended",
      "wheels_compliant",
      "science_athena_baseline",
      "telecom_phased_array",
    ],
    briefingDirectives: [
      "Prioritize electrical and thermal survival above all other mission parameters. Net daily energy margin must remain positive under extreme dust and low-Sun angles.",
      "If utilizing nuclear MMRTG power, carefully manage mass trade-offs in mobility and science to respect the 205.0 kg simulation threshold.",
      "Ensure survival heaters remain powered during -105 °C nighttime freezes.",
    ],
  },

  // ---------------------------------------------------------------------------
  // REFERENCE SCENARIO: SPIRIT MER-A FLIGHT RECREATION
  // ---------------------------------------------------------------------------
  spirit_baseline: {
    id: "spirit_baseline",
    title: "Spirit MER-A Flight Baseline Recreation",
    code: "MSN-HIST-REF",
    subtitle: "Historical 174.0 kg Flight Hardware Verification",
    location: "Gusev Crater (14.57° S, 175.47° E)",
    solWindow: "Sol 0 – 90 Primary Mission",
    historicalContext:
      "The historical benchmark configuration flown by NASA/JPL. Demonstrates how JPL engineers balanced the 174.0 kg flight rover mass, Delta II launch limits, and 90-sol mission success criteria.",
    verifiedFact:
      "NASA/JPL Landing Press Kit (January 2004, p. 5) documents the flight rover mass as 174 kg. Landed January 4, 2004, and operated for 2,210 sols (over 6 years).",
    sourceReference:
      "NASA/JPL Mars Exploration Rover Landing Press Kit (January 2004)",
    simulationNote:
      "Educational reference benchmark: Evaluates how the historical 2004 flight choices perform across environmental scenarios. Verifies the 174.0 kg Spirit baseline.",
    environment: {
      solarScenario: "clean_summer_perihelion",
      solarInsolationWhPerSol: 900,
      opticalDepthTau: 0.3,
      maxTerrainSlopeDeg: 20.0,
      surfaceMaterial: "Gusev Crater basaltic lava plain with moderate rock coverage",
      nightTempC: -80,
      dustDepositionRatePercentPerSol: 0.14,
    },
    demands: {
      minObstacleCapabilityCm: 25,
      minMaxSlopeDeg: 20.0,
      flotationRequired: false,
      minEnergyMarginWhPerSol: 300,
      primaryScienceDisciplines: ["petrology", "mineralogy"],
      minScienceScore: 65,
      minDownlinkKbps: 28.8,
      targetRoverMassKg: 174.0,
    },
    weights: {
      mass: 0.25,
      energy: 0.25,
      mobility: 0.2,
      science: 0.2,
      telecom: 0.1,
      scienceDisciplineWeights: {
        petrology: 0.4,
        mineralogy: 0.4,
        astrobiology: 0.1,
        stratigraphy: 0.1,
      },
    },
    recommendedComponentIds: [
      "wheels_standard",
      "power_solar_baseline",
      "science_athena_baseline",
      "telecom_hga_dish",
    ],
    briefingDirectives: [
      "Reconstruct the exact Spirit flight hardware configuration as launched from Cape Canaveral on June 10, 2003.",
      "Achieve the documented 174.0 kg flight rover mass with zero delta.",
      "Verify the +409 Wh/sol net energy margin under clean summer perihelion insolation.",
    ],
  },
};

export const MISSION_LIST: MissionScenario[] = Object.values(MISSION_SCENARIOS);
