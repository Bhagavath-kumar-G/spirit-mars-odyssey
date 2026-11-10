// Pure mathematical and systems engineering calculation engine for the Rover Workshop
// Strictly distinguishes verified NASA flight data from simulation trade estimates

export type SubsystemCategory = "mobility" | "power" | "science" | "telecom";

export type AuthenticityBadge =
  | "SPIRIT FLIGHT HARDWARE"
  | "NASA-INSPIRED ALTERNATIVE"
  | "FICTIONAL SIMULATION";

export type SolarScenario =
  | "clean_summer_perihelion"
  | "mid_mission_nominal"
  | "winter_solstice"
  | "severe_dust_storm";

export interface ScienceRatings {
  petrology: number; // 0..100 (Simulation Rating)
  mineralogy: number;
  astrobiology: number;
  stratigraphy: number;
}

export interface TelecomRates {
  directToEarthKbps: number; // X-band direct to Earth DSN
  directToEarthRange: string; // e.g. "3.5–12.0 kbps (28.8 peak)"
  uhfOrbiterRelayKbps: number; // UHF relay to orbiter
  uhfRelayRange: string; // e.g. "32–128 kbps"
}

export interface ComponentOption {
  id: string;
  category: SubsystemCategory;
  name: string;
  code: string;
  subtitle: string;
  authenticity: AuthenticityBadge;
  description: string;
  verifiedFact: string;
  sourceReference: string;
  simulationNote?: string;
  massDeltaKg: number; // kg delta relative to baseline 174.0 kg
  powerDrawWatts: number; // operating power draw in Watts (W)
  powerGenWhPerSol: number; // daily generation in Wh/sol (clean summer baseline)
  telecomRates?: TelecomRates;
  obstacleCapabilityCm: number; // ground obstacle negotiation height
  chassisGroundClearanceCm: number; // belly clearance above terrain
  operationalSlopeRange: string; // e.g. "15°–20° nominal (31.2° record)"
  maxSlopeDeg: number; // nominal operational design limit
  scienceRating: ScienceRatings;
  incompatibleWith?: string[];
  requires?: string[];
}

// -------------------------------------------------------------
// Verified NASA Flight Constants
// -------------------------------------------------------------
// NASA/JPL Mars Exploration Rover Landing Press Kit (January 2004, p. 5): 174 kg flight rover mass
export const BASELINE_ROVER_MASS_KG = 174.0;

// NASA MER Environmental Impact Statement (December 2002) proposed design mass reference
export const HISTORICAL_PROPOSED_DESIGN_MASS_KG = 185.0;

// Simulation Mass Threshold for interactive workshop trade studies (educational gameplay limit)
export const SIMULATION_MASS_THRESHOLD_KG = 205.0;
export const SIMULATION_AIRBAG_LIMIT_KG = 205.0; // Backwards-compatible alias

// Peak clean summer insolation at 1.5 AU (Stella et al. 2005)
export const BASELINE_SOLAR_OUTPUT_WH_SOL = 900;

// R. A. Lindemann and D. B. Bickler, IEEE Aerospace Conf. (2005)
export const BASELINE_WHEEL_DIAMETER_CM = 25; // 25 cm (10 in) Al 7075-T6
export const BASELINE_GROUND_CLEARANCE_CM = 30; // 30 cm belly clearance

// Operational hazard rule: terrain features taller than 20 cm were avoided operationally (JPL 2005)
export const BASELINE_AUTONAV_AVOIDANCE_CM = 20;

// Documented nominal slope limit and traversal record (Arvidson et al. 2008)
export const BASELINE_NOMINAL_SLOPE_DEG = 20.0;
export const BASELINE_RECORD_SLOPE_DEG = 31.2;

// Martian Sol Duration: 24h 39m 35s = 24.65 hours
export const MARTIAN_SOL_HOURS = 24.65;

// Continuous Avionics Hotel Load: 12W continuous over 24.65h = 295.8 Wh/sol
export const BASELINE_AVIONICS_HOTEL_WH_SOL = 296;

// Nighttime Electric Survival Heater Load (for solar configurations): 80 Wh/night
export const BASELINE_ELECTRIC_HEAT_WH_SOL = 80;

// Operational duty cycles (hours per sol) - Simulation Assumptions
export const DUTY_HOURS_MOBILITY = 1.5;
export const DUTY_HOURS_SCIENCE = 1.0;
export const DUTY_HOURS_TELECOM = 0.5;

// -------------------------------------------------------------
// Solar Generation Scenarios
// -------------------------------------------------------------
export const SOLAR_SCENARIOS: Record<
  SolarScenario,
  {
    name: string;
    classification: "NASA Historical Benchmark" | "Simulation Input Scenario";
    baselineSolarWhPerSol: number;
    extendedSolarWhPerSol: number;
    description: string;
  }
> = {
  clean_summer_perihelion: {
    name: "Clean Summer Perihelion (Early Mission)",
    classification: "NASA Historical Benchmark",
    baselineSolarWhPerSol: 900,
    extendedSolarWhPerSol: 1215,
    description:
      "Peak energy generated under clean noon southern summer conditions at 1.5 AU in Gusev Crater (NASA MER Landing Press Kit, Jan 2004, p. 19; Stella et al., IEEE 2005, p. 626).",
  },
  mid_mission_nominal: {
    name: "Mid-Mission Dust-Settled Nominal",
    classification: "NASA Historical Benchmark",
    baselineSolarWhPerSol: 600,
    extendedSolarWhPerSol: 810,
    description:
      "Nominal operational telemetry before severe seasonal dust deposition (NASA JPL MER Surface Operations Summaries).",
  },
  winter_solstice: {
    name: "Winter Solstice (Low Insolation)",
    classification: "Simulation Input Scenario",
    baselineSolarWhPerSol: 350,
    extendedSolarWhPerSol: 475,
    description:
      "Simulation scenario representing reduced solar elevation and oblique light in southern winter.",
  },
  severe_dust_storm: {
    name: "Severe Dust Storm (Survival Floor)",
    classification: "Simulation Input Scenario",
    baselineSolarWhPerSol: 140,
    extendedSolarWhPerSol: 190,
    description:
      "Simulation scenario modeling high atmospheric dust opacity (tau > 1.5) near survival heating threshold.",
  },
};

export const COMPONENT_OPTIONS: Record<string, ComponentOption> = {
  // -------------------------------------------------------------
  // MOBILITY SUBSYSTEM (WHEELS & SUSPENSION)
  // -------------------------------------------------------------
  wheels_standard: {
    id: "wheels_standard",
    category: "mobility",
    name: "Standard Cleated Aluminum Wheels",
    code: "MOB-STD-25",
    subtitle: "25 cm Diameter · Spiral Cleats in Al 7075-T6",
    authenticity: "SPIRIT FLIGHT HARDWARE",
    description:
      "NASA flight hardware configuration. Six independently driven 25 cm wheels machined from solid Al 7075-T6 billets with spiral grousers, mounted on a differential rocker-bogie passive linkage.",
    verifiedFact:
      "Documented traversal achievement: Ascended a steep 31.2° rocky slope on Husband Hill (Columbia Hills, Sol 618) without slipping or tipping.",
    sourceReference:
      "R. A. Lindemann and D. B. Bickler, 'Mars Exploration Rover Mobility Development', IEEE Aerospace Conference, 2005",
    massDeltaKg: 0,
    powerDrawWatts: 45,
    powerGenWhPerSol: 0,
    obstacleCapabilityCm: 25,
    chassisGroundClearanceCm: 30,
    operationalSlopeRange: "15°–20° nominal (31.2° record)",
    maxSlopeDeg: 20.0,
    scienceRating: { petrology: 90, mineralogy: 85, astrobiology: 40, stratigraphy: 45 },
  },
  wheels_heavy: {
    id: "wheels_heavy",
    category: "mobility",
    name: "Heavy-Traction Deep-Sand Wheels",
    code: "MOB-HVY-32",
    subtitle: "32 cm Widened Diameter · High-Flotation Chevron Grousers",
    authenticity: "NASA-INSPIRED ALTERNATIVE",
    description:
      "Enlarged 32 cm wheels with aggressive chevron grousers and elevated bogie brackets, engineered for maximum flotation across loose Martian sand dunes.",
    verifiedFact:
      "Concept derived from NASA JPL lessons learned after Spirit's 2009 entrapment in soft sulfate sand at 'Troy'.",
    sourceReference: "NASA JPL Mars Exploration Rover Status / MSL Wheel Flotation Studies",
    simulationNote:
      "Simulation trade estimate: +7.2 kg mass, elevates belly clearance from 30.0 cm to 33.5 cm, nominal slope ~22°.",
    massDeltaKg: 7.2,
    powerDrawWatts: 60,
    powerGenWhPerSol: 0,
    obstacleCapabilityCm: 32,
    chassisGroundClearanceCm: 33.5,
    operationalSlopeRange: "20°–22° nominal (simulation estimate)",
    maxSlopeDeg: 22.0,
    scienceRating: { petrology: 90, mineralogy: 85, astrobiology: 45, stratigraphy: 50 },
  },
  wheels_compliant: {
    id: "wheels_compliant",
    category: "mobility",
    name: "Titanium Mesh Compliant Tires",
    code: "MOB-CMP-28",
    subtitle: "Non-Pneumatic Shape Memory Alloy (SMA) Mesh",
    authenticity: "NASA-INSPIRED ALTERNATIVE",
    description:
      "Radial compliant tire architecture woven from superelastic Nickel-Titanium Shape Memory Alloy. Conforms over jagged rocks without puncturing or tearing, lowering rolling resistance.",
    verifiedFact:
      "Developed by NASA Glenn Research Center and Goodyear as next-generation extraterrestrial mobility technology.",
    sourceReference: "NASA Glenn Research Center Spring Tire Technology Project (2017)",
    simulationNote:
      "Simulation trade estimate: +4.8 kg mass, 28 cm diameter, saves ~15% driving power draw.",
    massDeltaKg: 4.8,
    powerDrawWatts: 38,
    powerGenWhPerSol: 0,
    obstacleCapabilityCm: 28,
    chassisGroundClearanceCm: 31.5,
    operationalSlopeRange: "18°–21° nominal (simulation estimate)",
    maxSlopeDeg: 21.0,
    scienceRating: { petrology: 90, mineralogy: 85, astrobiology: 45, stratigraphy: 48 },
  },

  // -------------------------------------------------------------
  // POWER SUBSYSTEM (SOLAR VS NUCLEAR)
  // -------------------------------------------------------------
  power_solar_baseline: {
    id: "power_solar_baseline",
    category: "power",
    name: "Triple-Junction GaAs Solar Array",
    code: "PWR-SOL-01",
    subtitle: "1.30 m² Photovoltaic Deck & Folding Wings",
    authenticity: "SPIRIT FLIGHT HARDWARE",
    description:
      "NASA flight hardware configuration. 1.30 m² of triple-junction Gallium Arsenide/Germanium cells delivering ~140 W clean peak power at 1.5 AU, backed by rechargeable Lithium-Ion batteries.",
    verifiedFact:
      "Delivered ~900 Wh/sol initially in southern summer; dust accumulation lowered winter output to ~350 Wh/sol until Sol 420 dust devils cleaned the arrays.",
    sourceReference:
      "P. Stella et al., 'Performance of the Mars Exploration Rover Solar Arrays', 31st IEEE Photovoltaic Specialists Conference, 2005",
    simulationNote:
      "Scenario-based output: 900 Wh/sol clean summer peak; 600 Wh/sol dust-settled; 350 Wh/sol winter; 140 Wh/sol storm.",
    massDeltaKg: 0,
    powerDrawWatts: 0,
    powerGenWhPerSol: 900,
    obstacleCapabilityCm: 0,
    chassisGroundClearanceCm: 0,
    operationalSlopeRange: "",
    maxSlopeDeg: 0,
    scienceRating: { petrology: 90, mineralogy: 85, astrobiology: 40, stratigraphy: 45 },
  },
  power_solar_extended: {
    id: "power_solar_extended",
    category: "power",
    name: "High-Latitude Extended Solar Wings",
    code: "PWR-SOL-EXT",
    subtitle: "1.75 m² Expanded Area · Dual Auxiliary Folding Flaps",
    authenticity: "NASA-INSPIRED ALTERNATIVE",
    description:
      "Expanded solar array with auxiliary lateral wing flaps (+35% surface area), engineered to harvest low-angle winter sunlight in sub-polar Martian latitudes.",
    verifiedFact:
      "Evaluated in JPL mission extension trade studies to offset winter solar insolation declines.",
    sourceReference: "JPL Mars Exploration Rover Extended Mission Architecture Studies",
    simulationNote:
      "Simulation trade estimate: Generates 1,215 Wh/sol clean summer peak (810 dust-settled, 475 winter); +14.5 kg mass.",
    massDeltaKg: 14.5,
    powerDrawWatts: 0,
    powerGenWhPerSol: 1215,
    obstacleCapabilityCm: 0,
    chassisGroundClearanceCm: 0,
    operationalSlopeRange: "",
    maxSlopeDeg: 0,
    scienceRating: { petrology: 90, mineralogy: 85, astrobiology: 50, stratigraphy: 50 },
  },
  power_mmrtg: {
    id: "power_mmrtg",
    category: "power",
    name: "Nuclear MMRTG Generator",
    code: "PWR-NUC-RTG",
    subtitle: "Radioisotope Thermoelectric · Continuous 110W Electrical",
    authenticity: "NASA-INSPIRED ALTERNATIVE",
    description:
      "Multi-Mission Radioisotope Thermoelectric Generator converting heat from 4.8 kg of Plutonium-238 dioxide into continuous 110 W electrical power (beginning of life) and ~2,000 W thermal heating.",
    verifiedFact:
      "Flown on NASA's Curiosity (MSL) and Perseverance (Mars 2020) rovers. Complete generator assembly has a mass of about 45 kg (99 lb). Was never flown on Spirit.",
    sourceReference: "NASA Mars 2020 / Perseverance Launch Press Kit (July 2020, 'Power', p. 26)",
    simulationNote:
      "Simulation trade estimate: Idealized gross output of 2,711 Wh/sol (110W × 24.65h Martian sol); +45.0 kg mass challenges the simulation mass threshold.",
    massDeltaKg: 45.0,
    powerDrawWatts: 0,
    powerGenWhPerSol: 2711,
    obstacleCapabilityCm: 0,
    chassisGroundClearanceCm: 0,
    operationalSlopeRange: "",
    maxSlopeDeg: 0,
    scienceRating: { petrology: 95, mineralogy: 95, astrobiology: 85, stratigraphy: 80 },
  },

  // -------------------------------------------------------------
  // SCIENCE PAYLOAD SUBSYSTEM
  // -------------------------------------------------------------
  science_athena_baseline: {
    id: "science_athena_baseline",
    category: "science",
    name: "Athena Contact Petrology Suite",
    code: "SCI-ATH-01",
    subtitle: "RAT Grinder · APXS · Mössbauer · MI Macro Imager",
    authenticity: "SPIRIT FLIGHT HARDWARE",
    description:
      "NASA flight hardware configuration. 5-DOF titanium articulating arm carrying the Rock Abrasion Tool (45 mm diamond grinder), APXS X-ray spectrometer, Mössbauer spectrometer, and Microscopic Imager.",
    verifiedFact:
      "Executed over 2,000 contact placements and ground rock interiors across Columbia Hills, discovering aqueous alteration and ~90% silica deposits.",
    sourceReference:
      "S. W. Squyres et al., 'The Athena Mars Rover Science Payload', Science, 305(5685), 794–799, 2004",
    massDeltaKg: 0,
    powerDrawWatts: 30,
    powerGenWhPerSol: 0,
    obstacleCapabilityCm: 0,
    chassisGroundClearanceCm: 0,
    operationalSlopeRange: "",
    maxSlopeDeg: 0,
    scienceRating: { petrology: 95, mineralogy: 90, astrobiology: 45, stratigraphy: 45 },
  },
  science_coring_drill: {
    id: "science_coring_drill",
    category: "science",
    name: "Astrobiology Coring Drill & Carousel",
    code: "SCI-COR-BIO",
    subtitle: "Rotary-Percussive Core Drill · Sample Caching Mechanism",
    authenticity: "NASA-INSPIRED ALTERNATIVE",
    description:
      "Heavy rotary-percussive coring drill and sample caching carousel capable of extracting pristine 5 cm rock core cylinders and sealing them in titanium tubes for biosignature detection.",
    verifiedFact:
      "Architecture modeled after the core sampling and caching system developed for NASA's Perseverance rover in Jezero Crater.",
    sourceReference: "NASA Mars 2020 Mission / Perseverance Sampling and Caching System",
    simulationNote:
      "Simulation trade estimate: High power draw (85 W during drilling); extended daily drilling requires Extended Solar Wings or MMRTG under workshop simulation rules.",
    massDeltaKg: 11.8,
    powerDrawWatts: 85,
    powerGenWhPerSol: 0,
    obstacleCapabilityCm: 0,
    chassisGroundClearanceCm: 0,
    operationalSlopeRange: "",
    maxSlopeDeg: 0,
    scienceRating: { petrology: 85, mineralogy: 85, astrobiology: 95, stratigraphy: 80 },
    requires: ["power_mmrtg", "power_solar_extended"],
  },
  science_subsurface_radar: {
    id: "science_subsurface_radar",
    category: "science",
    name: "Deep Subsurface Sounding Radar (GPR)",
    code: "SCI-GPR-RAD",
    subtitle: "Ground-Penetrating Polarimetric Radar Antenna",
    authenticity: "NASA-INSPIRED ALTERNATIVE",
    description:
      "Under-chassis polarimetric ground-penetrating radar sounding structural bedrock horizons, subsurface volcanic layers, and buried ice features down to 10 meters depth.",
    verifiedFact:
      "Derived from the RIMFAX ground-penetrating radar instrument architecture developed for Martian subsurface sounding.",
    sourceReference:
      "S. E. Hamran et al., 'Radar Imager for Mars' Subsurface Experiment (RIMFAX)', Space Science Reviews, 2020",
    simulationNote:
      "Simulation trade estimate: +5.4 kg mass; provides 100/100 stratigraphy mapping capability.",
    massDeltaKg: 5.4,
    powerDrawWatts: 25,
    powerGenWhPerSol: 0,
    obstacleCapabilityCm: 0,
    chassisGroundClearanceCm: 0,
    operationalSlopeRange: "",
    maxSlopeDeg: 0,
    scienceRating: { petrology: 55, mineralogy: 60, astrobiology: 65, stratigraphy: 100 },
  },

  // -------------------------------------------------------------
  // TELECOMMUNICATIONS SUBSYSTEM
  // -------------------------------------------------------------
  telecom_hga_dish: {
    id: "telecom_hga_dish",
    category: "telecom",
    name: "0.28m Steerable Flat-Panel Array",
    code: "COM-HGA-28",
    subtitle: "2-Axis Gimbal · X-Band DSN Direct + UHF Orbiter Relay",
    authenticity: "SPIRIT FLIGHT HARDWARE",
    description:
      "NASA flight hardware configuration. 0.28-meter steerable flat-panel slotted waveguide array operating in deep-space X-band (7.1–8.4 GHz), delivering direct-to-Earth telemetry to 70 m DSN stations, plus UHF orbiter relay.",
    verifiedFact:
      "Direct-to-Earth X-band provided 3.5–12.0 kbps nominal (up to 28.8 kbps peak at 70m DSN). UHF relay to Odyssey/MGS provided 32–128 kbps, returning >85% of all mission data.",
    sourceReference:
      "J. Taylor et al., 'Mars Exploration Rover Telecommunications System Design', DESCANSO Series, NASA JPL, 2005",
    massDeltaKg: 0,
    powerDrawWatts: 35,
    powerGenWhPerSol: 0,
    telecomRates: {
      directToEarthKbps: 28.8,
      directToEarthRange: "3.5–12.0 kbps nominal (28.8 kbps peak)",
      uhfOrbiterRelayKbps: 128.0,
      uhfRelayRange: "32–128 kbps via Odyssey/MGS",
    },
    obstacleCapabilityCm: 0,
    chassisGroundClearanceCm: 0,
    operationalSlopeRange: "",
    maxSlopeDeg: 0,
    scienceRating: { petrology: 90, mineralogy: 85, astrobiology: 45, stratigraphy: 45 },
  },
  telecom_high_gain_extended: {
    id: "telecom_high_gain_extended",
    category: "telecom",
    name: "0.42m Deep Space High-Gain Dish",
    code: "COM-HGA-42",
    subtitle: "High-Aperture Parabolic Reflector · Dual Feed Horn",
    authenticity: "NASA-INSPIRED ALTERNATIVE",
    description:
      "Expanded 0.42-meter high-aperture parabolic dish with dual feed horn on heavy-duty 2-axis gimbal, doubling direct-to-Earth telemetry bandwidth.",
    verifiedFact:
      "Studied in JPL deep space communications design architectures for long-range high-bandwidth surface missions.",
    sourceReference: "NASA JPL Deep Space Communications Architecture Studies",
    simulationNote:
      "Simulation trade estimate: 24.0–57.6 kbps direct to Earth DSN; 128 kbps UHF relay; +4.6 kg mass.",
    massDeltaKg: 4.6,
    powerDrawWatts: 48,
    powerGenWhPerSol: 0,
    telecomRates: {
      directToEarthKbps: 57.6,
      directToEarthRange: "24.0–57.6 kbps direct to Earth DSN",
      uhfOrbiterRelayKbps: 128.0,
      uhfRelayRange: "128 kbps via orbiter relay",
    },
    obstacleCapabilityCm: 0,
    chassisGroundClearanceCm: 0,
    operationalSlopeRange: "",
    maxSlopeDeg: 0,
    scienceRating: { petrology: 90, mineralogy: 85, astrobiology: 50, stratigraphy: 50 },
  },
  telecom_phased_array: {
    id: "telecom_phased_array",
    category: "telecom",
    name: "Solid-State Hexagonal Phased Array",
    code: "COM-PHS-HEX",
    subtitle: "Electronically Steered Array · Zero Moving Parts",
    authenticity: "FICTIONAL SIMULATION",
    description:
      "Advanced solid-state flat-panel phased array antenna steering radio beams electronically without gimbals or motors, eliminating mechanical pointing failure risks in abrasive Martian dust.",
    verifiedFact:
      "Conceptual advanced space telecommunications technology evaluated to eliminate mechanical actuator wear in dusty environments.",
    sourceReference: "NASA Space Technology Mission Directorate / Advanced Communications R&D",
    simulationNote:
      "Simulation trade estimate: 50.0–100.0 kbps direct to Earth; +2.8 kg mass; higher active power draw.",
    massDeltaKg: 2.8,
    powerDrawWatts: 55,
    powerGenWhPerSol: 0,
    telecomRates: {
      directToEarthKbps: 100.0,
      directToEarthRange: "50.0–100.0 kbps electronic beam steering",
      uhfOrbiterRelayKbps: 256.0,
      uhfRelayRange: "256 kbps multi-beam orbiter relay",
    },
    obstacleCapabilityCm: 0,
    chassisGroundClearanceCm: 0,
    operationalSlopeRange: "",
    maxSlopeDeg: 0,
    scienceRating: { petrology: 90, mineralogy: 85, astrobiology: 55, stratigraphy: 50 },
  },
};

export const CATEGORY_OPTION_IDS: Record<SubsystemCategory, string[]> = {
  mobility: ["wheels_standard", "wheels_heavy", "wheels_compliant"],
  power: ["power_solar_baseline", "power_solar_extended", "power_mmrtg"],
  science: ["science_athena_baseline", "science_coring_drill", "science_subsurface_radar"],
  telecom: ["telecom_hga_dish", "telecom_high_gain_extended", "telecom_phased_array"],
};

export const BASELINE_SELECTIONS: Record<SubsystemCategory, string> = {
  mobility: "wheels_standard",
  power: "power_solar_baseline",
  science: "science_athena_baseline",
  telecom: "telecom_hga_dish",
};

export interface EngineeringBudget {
  totalMassKg: number;
  massDeltaKg: number;
  isOverAirbagLimit: boolean; // Backwards-compatible alias
  isOverMassThreshold: boolean;
  powerGenWhPerSol: number;
  hotelLoadWhPerSol: number;
  activeLoadWhPerSol: number;
  dailyConsumptionWhPerSol: number;
  netEnergyMarginWhPerSol: number;
  obstacleCapabilityCm: number;
  chassisGroundClearanceCm: number;
  operationalSlopeRange: string;
  maxSlopeDeg: number;
  telecomRates: TelecomRates;
  scienceOverallScore: number;
  ratings: ScienceRatings;
  compatibilityWarnings: string[];
  isReviewPassed: boolean;
}

// -------------------------------------------------------------
// Pure Systems Engineering Calculation Functions
// -------------------------------------------------------------

/**
 * 1. Configuration mass calculation.
 * Computes total mass and delta relative to the verified 174.0 kg Spirit flight mass.
 * Evaluates the 205.0 kg Simulation Mass Threshold (educational gameplay limit).
 */
export function calculateRoverMass(
  selected: Partial<Record<SubsystemCategory, string>>,
): {
  totalMassKg: number;
  massDeltaKg: number;
  isOverMassThreshold: boolean;
  notice?: string | undefined;
} {
  let massDelta = 0;
  for (const [cat, id] of Object.entries(selected)) {
    if (!id) continue;
    const opt = COMPONENT_OPTIONS[id];
    if (opt && opt.category === cat) {
      massDelta += opt.massDeltaKg;
    }
  }

  const totalMass = Math.round((BASELINE_ROVER_MASS_KG + massDelta) * 10) / 10;
  const isOverMassThreshold = totalMass > SIMULATION_MASS_THRESHOLD_KG;

  let notice: string | undefined;
  if (isOverMassThreshold) {
    notice = `Simulation Notice: Total rover mass (${totalMass.toFixed(1)} kg) exceeds the 205.0 kg Simulation Mass Threshold established for this workshop study. Trade-off adjustments recommended.`;
  }

  return {
    totalMassKg: totalMass,
    massDeltaKg: Math.round(massDelta * 10) / 10,
    isOverMassThreshold,
    notice,
  };
}

/**
 * 2. Idealized MMRTG gross generation calculation.
 * Formula: 110 W (beginning-of-life) * 24.65 hours (Martian sol) = 2,711.5 Wh/sol (gross).
 */
export function calculateMmrtgGrossGeneration(
  bolWatts: number = 110,
  solHours: number = MARTIAN_SOL_HOURS,
): number {
  return Math.floor(bolWatts * solHours); // 110 * 24.65 = 2,711.5 -> 2,711 Wh/sol
}

/**
 * 3. Solar & MMRTG Energy Generation Scenarios.
 * Computes daily generated electrical energy in Wh/sol.
 */
export function calculateEnergyGeneration(
  powerOptionId: string = "power_solar_baseline",
  scenario: SolarScenario = "clean_summer_perihelion",
): {
  powerGenWhPerSol: number;
  generationNote: string;
  isIdealizedGross: boolean;
  classification: string;
} {
  if (powerOptionId === "power_mmrtg") {
    const grossWh = calculateMmrtgGrossGeneration(110, MARTIAN_SOL_HOURS);
    return {
      powerGenWhPerSol: grossWh,
      generationNote:
        "Continuous 24/7 generation independent of solar illumination or dust opacity. Modeled as beginning-of-life continuous 110 W electrical output.",
      isIdealizedGross: true,
      classification: "NASA-INSPIRED ALTERNATIVE",
    };
  }

  const scen = SOLAR_SCENARIOS[scenario] ?? SOLAR_SCENARIOS.clean_summer_perihelion;
  const isExtended = powerOptionId === "power_solar_extended";
  const genWh = isExtended ? scen.extendedSolarWhPerSol : scen.baselineSolarWhPerSol;

  return {
    powerGenWhPerSol: genWh,
    generationNote: `${scen.name}: ${scen.description}`,
    isIdealizedGross: false,
    classification: isExtended ? "NASA-INSPIRED ALTERNATIVE" : "SPIRIT FLIGHT HARDWARE",
  };
}

/**
 * 4. Continuous Hotel Consumption.
 * Computes base avionics idle draw over 24.65 h Martian sol and nighttime electric survival heating.
 */
export function calculateContinuousHotelLoad(powerOptionId: string = "power_solar_baseline"): {
  avionicsWhPerSol: number;
  survivalHeaterWhPerSol: number;
  totalHotelWhPerSol: number;
  thermalCreditApplied: boolean;
} {
  const avionicsWh = BASELINE_AVIONICS_HOTEL_WH_SOL; // 296 Wh/sol (12W * 24.65h)
  const isNuclear = powerOptionId === "power_mmrtg";
  // Simplified simulation assumption: MMRTG waste thermal heat eliminates the 80 Wh electric survival heater load
  const heaterWh = isNuclear ? 0 : BASELINE_ELECTRIC_HEAT_WH_SOL;

  return {
    avionicsWhPerSol: avionicsWh,
    survivalHeaterWhPerSol: heaterWh,
    totalHotelWhPerSol: avionicsWh + heaterWh,
    thermalCreditApplied: isNuclear,
  };
}

/**
 * 5. Active Operational Energy Consumption.
 * Computes energy draw using operating draws (W) and specific duty cycles (hours/sol).
 */
export function calculateActiveOperationalLoad(
  selected: Partial<Record<SubsystemCategory, string>>,
  dutyCycles: { mobilityHours?: number; scienceHours?: number; telecomHours?: number } = {},
): {
  mobilityWh: number;
  scienceWh: number;
  telecomWh: number;
  totalActiveWhPerSol: number;
} {
  const mobOpt = selected.mobility ? COMPONENT_OPTIONS[selected.mobility] : undefined;
  const sciOpt = selected.science ? COMPONENT_OPTIONS[selected.science] : undefined;
  const comOpt = selected.telecom ? COMPONENT_OPTIONS[selected.telecom] : undefined;

  const mobWatts = mobOpt?.powerDrawWatts ?? 45;
  const sciWatts = sciOpt?.powerDrawWatts ?? 30;
  const comWatts = comOpt?.powerDrawWatts ?? 35;

  const mobHours = dutyCycles.mobilityHours ?? DUTY_HOURS_MOBILITY;
  const sciHours = dutyCycles.scienceHours ?? DUTY_HOURS_SCIENCE;
  const comHours = dutyCycles.telecomHours ?? DUTY_HOURS_TELECOM;

  const unroundedMobilityWh = mobWatts * mobHours;
  const unroundedScienceWh = sciWatts * sciHours;
  const unroundedTelecomWh = comWatts * comHours;
  // Calculate active operational load using unrounded intermediate values, rounding only the final aggregate result
  const totalActiveWhPerSol = Math.round(
    unroundedMobilityWh + unroundedScienceWh + unroundedTelecomWh,
  );

  return {
    mobilityWh: Math.round(unroundedMobilityWh * 10) / 10,
    scienceWh: Math.round(unroundedScienceWh * 10) / 10,
    telecomWh: Math.round(unroundedTelecomWh * 10) / 10,
    totalActiveWhPerSol,
  };
}

/**
 * 6. Net Daily Energy Margin.
 * Evaluates net balance: Generation - Consumption.
 */
export function calculateNetDailyEnergyMargin(
  powerGenWhPerSol: number,
  hotelLoadWhPerSol: number,
  activeLoadWhPerSol: number,
): {
  dailyConsumptionWhPerSol: number;
  netEnergyMarginWhPerSol: number;
  warning?: string | undefined;
} {
  const dailyConsumption = Math.round(hotelLoadWhPerSol + activeLoadWhPerSol);
  const netMargin = Math.round(powerGenWhPerSol - dailyConsumption);

  let warning: string | undefined;
  if (netMargin < 0) {
    warning = `Critical Energy Deficit: Daily consumption (${dailyConsumption} Wh/sol) exceeds daily generation (${powerGenWhPerSol} Wh/sol) by ${Math.abs(netMargin)} Wh/sol. Battery depletion will occur.`;
  } else if (netMargin < 150) {
    warning = `Simulation Warning: Net daily energy margin (${netMargin} Wh/sol) is below the 150 Wh/sol operational safety margin. High risk during dust opacity spikes.`;
  }

  return {
    dailyConsumptionWhPerSol: dailyConsumption,
    netEnergyMarginWhPerSol: netMargin,
    warning,
  };
}

/**
 * 7. Science Discipline Scoring & Aggregate Score.
 * Computes discipline ratings across Petrology, Mineralogy, Astrobiology, and Stratigraphy.
 * Aggregate score is unweighted arithmetic mean.
 */
export function calculateScienceRatings(
  selected: Partial<Record<SubsystemCategory, string>>,
): {
  ratings: ScienceRatings;
  overallScore: number;
} {
  const ratings: ScienceRatings = { petrology: 0, mineralogy: 0, astrobiology: 0, stratigraphy: 0 };

  for (const [cat, id] of Object.entries(selected)) {
    if (!id) continue;
    const opt = COMPONENT_OPTIONS[id];
    if (opt && opt.category === cat) {
      ratings.petrology = Math.max(ratings.petrology, opt.scienceRating.petrology);
      ratings.mineralogy = Math.max(ratings.mineralogy, opt.scienceRating.mineralogy);
      ratings.astrobiology = Math.max(ratings.astrobiology, opt.scienceRating.astrobiology);
      ratings.stratigraphy = Math.max(ratings.stratigraphy, opt.scienceRating.stratigraphy);
    }
  }

  const overallScore = Math.round(
    (ratings.petrology + ratings.mineralogy + ratings.astrobiology + ratings.stratigraphy) / 4,
  );

  return { ratings, overallScore };
}

/**
 * 8. Compatibility and Simulation Rule Notices.
 */
export function evaluateCompatibilityAndNotices(
  selected: Partial<Record<SubsystemCategory, string>>,
  totalMassKg: number,
  netEnergyMarginWhPerSol: number,
): string[] {
  const warnings: string[] = [];

  // 1. Simulation Mass Threshold notice
  if (totalMassKg > SIMULATION_MASS_THRESHOLD_KG) {
    warnings.push(
      `Simulation Notice: Total rover mass (${totalMassKg.toFixed(1)} kg) exceeds the 205.0 kg Simulation Mass Threshold established for this workshop study. Trade-off adjustments recommended.`,
    );
  }

  // 2. Coring drill simulation compatibility rule
  if (selected.science === "science_coring_drill") {
    const power = selected.power ?? "power_solar_baseline";
    if (power === "power_solar_baseline") {
      warnings.push(
        "Simulation Rule: Extended daily coring operations draw substantial cumulative energy (85 W). Under workshop study rules, sustained daily drilling requires an upgraded power source (High-Latitude Extended Solar Wings or Nuclear MMRTG).",
      );
    }
  }

  // 3. Energy margin warnings
  if (netEnergyMarginWhPerSol < 0) {
    warnings.push(
      `Critical Energy Deficit: Daily power consumption exceeds generation by ${Math.abs(netEnergyMarginWhPerSol)} Wh/sol. Battery depletion will occur.`,
    );
  } else if (netEnergyMarginWhPerSol < 150) {
    warnings.push(
      "Simulation Warning: Net daily energy margin is below 150 Wh/sol. High risk of battery depletion during winter or high dust opacity scenarios.",
    );
  }

  return warnings;
}

/**
 * 9. Comprehensive Systems Engineering Budget Evaluator.
 * Aggregates all calculations for the workshop HUD and Rover Engineering Review.
 * Handles missing/invalid selections safely by defaulting to Spirit flight baseline components.
 */
export function calculateEngineeringBudget(
  selected: Record<SubsystemCategory, string>,
  scenario: SolarScenario = "clean_summer_perihelion",
): EngineeringBudget {
  // Validate and sanitize selections
  const safeSelected: Record<SubsystemCategory, string> = {
    mobility: COMPONENT_OPTIONS[selected.mobility]?.category === "mobility"
      ? selected.mobility
      : BASELINE_SELECTIONS.mobility,
    power: COMPONENT_OPTIONS[selected.power]?.category === "power"
      ? selected.power
      : BASELINE_SELECTIONS.power,
    science: COMPONENT_OPTIONS[selected.science]?.category === "science"
      ? selected.science
      : BASELINE_SELECTIONS.science,
    telecom: COMPONENT_OPTIONS[selected.telecom]?.category === "telecom"
      ? selected.telecom
      : BASELINE_SELECTIONS.telecom,
  };

  const massResult = calculateRoverMass(safeSelected);
  const genResult = calculateEnergyGeneration(safeSelected.power, scenario);
  const hotelResult = calculateContinuousHotelLoad(safeSelected.power);
  const activeResult = calculateActiveOperationalLoad(safeSelected);
  const marginResult = calculateNetDailyEnergyMargin(
    genResult.powerGenWhPerSol,
    hotelResult.totalHotelWhPerSol,
    activeResult.totalActiveWhPerSol,
  );
  const scienceResult = calculateScienceRatings(safeSelected);

  // Mobility metrics from selected mobility option
  const mobOpt = COMPONENT_OPTIONS[safeSelected.mobility] ?? COMPONENT_OPTIONS["wheels_standard"];
  const obstacle = mobOpt && mobOpt.obstacleCapabilityCm > 0 ? mobOpt.obstacleCapabilityCm : BASELINE_WHEEL_DIAMETER_CM;
  const groundClearance = mobOpt && mobOpt.chassisGroundClearanceCm > 0 ? mobOpt.chassisGroundClearanceCm : BASELINE_GROUND_CLEARANCE_CM;
  const slope = mobOpt && mobOpt.maxSlopeDeg > 0 ? mobOpt.maxSlopeDeg : BASELINE_NOMINAL_SLOPE_DEG;
  const slopeRange = mobOpt?.operationalSlopeRange || "15°–20° nominal (31.2° record)";

  // Telecom rates from selected telecom option
  const comOpt = COMPONENT_OPTIONS[safeSelected.telecom] ?? COMPONENT_OPTIONS["telecom_hga_dish"];
  const telecomRates = comOpt?.telecomRates ?? {
    directToEarthKbps: 28.8,
    directToEarthRange: "3.5–12.0 kbps nominal (28.8 kbps peak)",
    uhfOrbiterRelayKbps: 128.0,
    uhfRelayRange: "32–128 kbps via Odyssey/MGS",
  };

  const compatibilityWarnings = evaluateCompatibilityAndNotices(
    safeSelected,
    massResult.totalMassKg,
    marginResult.netEnergyMarginWhPerSol,
  );

  const isReviewPassed = !massResult.isOverMassThreshold && compatibilityWarnings.length === 0;

  return {
    totalMassKg: massResult.totalMassKg,
    massDeltaKg: massResult.massDeltaKg,
    isOverAirbagLimit: massResult.isOverMassThreshold,
    isOverMassThreshold: massResult.isOverMassThreshold,
    powerGenWhPerSol: genResult.powerGenWhPerSol,
    hotelLoadWhPerSol: hotelResult.totalHotelWhPerSol,
    activeLoadWhPerSol: activeResult.totalActiveWhPerSol,
    dailyConsumptionWhPerSol: marginResult.dailyConsumptionWhPerSol,
    netEnergyMarginWhPerSol: marginResult.netEnergyMarginWhPerSol,
    obstacleCapabilityCm: obstacle,
    chassisGroundClearanceCm: groundClearance,
    operationalSlopeRange: slopeRange,
    maxSlopeDeg: slope,
    telecomRates,
    scienceOverallScore: scienceResult.overallScore,
    ratings: scienceResult.ratings,
    compatibilityWarnings,
    isReviewPassed,
  };
}
