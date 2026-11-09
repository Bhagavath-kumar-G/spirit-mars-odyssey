// Reactive state store for interactive 3D component inspection
// Uses React's built-in useSyncExternalStore pattern for reactive UI updates
import { useSyncExternalStore } from "react";

export type SubsystemSpec = {
  label: string;
  value: string;
};

export type SubsystemAnomaly = {
  title: string;
  sol: number;
  date: string;
  classification: string;
  observedSymptom: string;
  causeInvestigation: string;
  operationalAdaptation: string;
  scientificDiscovery: {
    featureName: string;
    exposureSol: string;
    analysisSols: string;
    mosaicSol: string;
    trackWidth: string;
    finding: string;
    hypotheses: string;
  };
};

export type SubsystemData = {
  id: string;
  nodeKey: string;
  code: string;
  label: string;
  shortName: string;
  category: string;
  description: string;
  specs: SubsystemSpec[];
  history: string;
  anomaly?: SubsystemAnomaly;
  cameraFocusOffset: [number, number, number];
  cameraOffset: [number, number, number];
};

/**
 * NASA/JPL flight hardware specifications and verified mission records.
 * All specifications and historical milestones are derived directly from
 * primary NASA/JPL mission documentation and peer-reviewed Athena team publications.
 */
export const INSPECTION_SUBSYSTEMS: Record<string, SubsystemData> = {
  chassis: {
    id: "chassis",
    nodeKey: "chassis",
    code: "MER-AVN-01",
    label: "Warm Electronics Box (WEB)",
    shortName: "WEB Chassis",
    category: "Avionics & Thermal Enclosure",
    description:
      "The insulated central chassis protecting the rover's core computing hardware, power electronics, and lithium-ion battery system. Encased in a sealed composite honeycomb enclosure with silica aerogel blanket insulation and gold-film exterior to survive nighttime Martian surface drops to -105°C.",
    specs: [
      { label: "Core Processor", value: "BAE RAD6000 32-bit RISC @ 20 MHz" },
      { label: "Memory Architecture", value: "128 MB DRAM · 256 MB Flash · 3 MB EEPROM" },
      { label: "Operating System", value: "Wind River VxWorks RTOS" },
      { label: "Thermal Control", value: "Silica Aerogel Blanket · 8 RHUs (Pu-238, ~1W each)" },
      { label: "Total Flight Mass", value: "185 kg (408 lb) total rover flight weight" },
    ],
    history:
      "Designed for a 90-sol nominal surface mission; operated continuously for over 2,210 sols from January 2004 until thermal depletion in March 2010.",
    cameraFocusOffset: [0, 0.45, 0],
    cameraOffset: [0, 0.35, 1.6],
  },
  solar: {
    id: "solar",
    nodeKey: "solar",
    code: "MER-PWR-02",
    label: "Triple-Junction GaAs Solar Array",
    shortName: "Solar Array",
    category: "Photovoltaic Power Subsystem",
    description:
      "1.3 square meters of triple-junction Gallium Arsenide/Germanium (GaAs/Ge) solar cells mounted across the top deck and folding wings. Designed to generate up to 140 watts and 900 watt-hours of electrical energy per Martian sol under clean noon conditions at 1.5 AU.",
    specs: [
      { label: "Active Photovoltaic Area", value: "1.3 m² triple-junction GaAs/Ge cells" },
      { label: "Nominal Peak Generation", value: "~140 W (clean cell peak at noon, 1.5 AU)" },
      { label: "Rechargeable Energy Storage", value: "Two 8-Ah sealed rechargeable Lithium-Ion batteries" },
      { label: "Dust Deposition Loss", value: "Nominally 0.2%–0.3% loss of output per sol" },
    ],
    history:
      "In March 2005 (Sol 420) and later on Sol 481, Martian convective dust devils swept directly across Spirit's array, lifting dust mantles and boosting daily energy output from ~350 Wh back up to over 800 Wh.",
    cameraFocusOffset: [0, 1.15, -0.15],
    cameraOffset: [0.35, 0.75, 1.45],
  },
  hga: {
    id: "hga",
    nodeKey: "hga",
    code: "MER-COM-03",
    label: "High-Gain Steerable Antenna (HGA)",
    shortName: "HGA Dish",
    category: "Deep Space Telecommunications",
    description:
      "A 0.28-meter steerable parabolic dish antenna operating on deep-space X-band frequencies (7.1–8.4 GHz). Articulated by a 2-axis (elevation over azimuth) gimbal mechanism to point directly toward Earth and transmit telemetry and images to NASA's Deep Space Network.",
    specs: [
      { label: "Reflector Architecture", value: "0.28 m steerable parabolic reflector" },
      { label: "RF Frequency Band", value: "Deep Space X-Band (7.1–8.4 GHz uplink/downlink)" },
      { label: "Gimbal Articulation", value: "2-Axis (Elevation over Azimuth) mechanism" },
      { label: "Direct-to-Earth Data Rate", value: "Up to 28.8 kbps to NASA DSN 70 m antennas" },
      { label: "Orbiter Relay Support", value: "UHF relay via 2001 Mars Odyssey & MGS (128 kbps)" },
    ],
    history:
      "Broadcasted telemetry and high-rate science frames directly to Earth and via Mars Odyssey across the mission, delivering over 124,000 raw frames from Gusev Crater.",
    cameraFocusOffset: [0.55, 1.25, -0.2],
    cameraOffset: [0.6, 0.35, 1.2],
  },
  mast: {
    id: "mast",
    nodeKey: "mast",
    code: "MER-OPT-04",
    label: "Pancam Mast Assembly (PMA)",
    shortName: "Camera Mast",
    category: "Remote Sensing & Optical Mast",
    description:
      "A 1.5-meter periscopic mast elevating the rover's optical vision to human eye height. Constructed from beryllium-wound composite tubing with 360-degree continuous azimuth rotation and ±90-degree elevation pointing capability.",
    specs: [
      { label: "Optical Elevation", value: "1.5 m (4.9 ft) above ground level" },
      { label: "Pointing Range", value: "360° continuous Azimuth · ±90° Elevation tilt" },
      { label: "Core Structure", value: "Beryllium-wound composite tubing" },
      { label: "Integrated Navcams", value: "Stereo wide-angle cameras with 45° field of view" },
    ],
    history:
      "Stowed horizontally during interplanetary cruise; pyrotechnically released and erected upright on Sol 3 inside Gusev Crater.",
    cameraFocusOffset: [0, 1.25, 0.2],
    cameraOffset: [0.3, 0.25, 1.35],
  },
  pancam: {
    id: "pancam",
    nodeKey: "pancam",
    code: "MER-IMG-05",
    label: "Panoramic Multispectral Camera (Pancam)",
    shortName: "Pancam Stereo",
    category: "Multispectral Science Imaging",
    description:
      "Stereoscopic high-resolution multispectral camera system consisting of two optical heads separated by a 30-centimeter baseline. Uses a Mitel 1024×2048 frame-transfer CCD with a 1024×1024 active imaging area and dual 8-position filter wheels covering 400 nm to 1100 nm.",
    specs: [
      { label: "CCD Architecture", value: "1024×2048 Mitel frame-transfer CCD (1024×1024 active)" },
      { label: "Optics & Aperture", value: "38 mm focal length · f/20 aperture" },
      { label: "Stereo Baseline", value: "30 cm separation (matching human stereoscopic depth)" },
      { label: "Spectral Coverage", value: "400 nm to 1100 nm across 16 geological & solar filters" },
    ],
    history:
      "Captured the historic 'Two Worlds, One Sun' twilight panorama on Sol 489, documenting the pale blue glow of Martian sunset across Gusev Crater.",
    cameraFocusOffset: [-0.32, 1.7, 0.25],
    cameraOffset: [-0.2, 0.15, 0.95],
  },
  arm: {
    id: "arm",
    nodeKey: "arm",
    code: "MER-ARM-06",
    label: "Instrument Deployment Device (IDD)",
    shortName: "Robotic Arm",
    category: "5-DOF Articulating Manipulator",
    description:
      "A 5-degree-of-freedom articulating titanium manipulator arm designed to place the 4.2 kg science turret against surface rock and soil targets with sub-millimeter positioning accuracy.",
    specs: [
      { label: "Kinematic Architecture", value: "5-DOF (Shoulder Az/El, Elbow, Wrist, Turret)" },
      { label: "Working Reach", value: "1.0 m (3.3 ft) reach envelope" },
      { label: "Turret Payload", value: "4.2 kg analytical instrument suite" },
      { label: "Actuator Types", value: "Aerospace brushless DC servomotors with optical encoders" },
    ],
    history:
      "Conducted over 2,000 delicate contact sensor placements on rock targets across the Columbia Hills, including targets Humphrey, Clovis, and Comanche.",
    cameraFocusOffset: [-0.25, 0.1, 0.95],
    cameraOffset: [-0.45, 0.25, 1.25],
  },
  instruments: {
    id: "instruments",
    nodeKey: "instruments",
    code: "MER-SCI-07",
    label: "Science Turret & Analytical Instruments",
    shortName: "Science Turret",
    category: "Contact Geology & Petrology",
    description:
      "Rotational end-effector turret housing four specialized contact instruments: the Rock Abrasion Tool (RAT) diamond grinder, Alpha Particle X-ray Spectrometer (APXS), Mössbauer iron mineralogy spectrometer, and Microscopic Imager (MI).",
    specs: [
      { label: "Rock Abrasion Tool (RAT)", value: "Diamond-resin cutting bits · 45 mm diameter × 5 mm depth" },
      { label: "Microscopic Imager", value: "Macro-optical lens · 31 µm/pixel spatial resolution" },
      { label: "APXS Spectrometer", value: "Curium-244 X-ray and alpha particle fluorescence analysis" },
      { label: "Mössbauer Spectrometer", value: "Cobalt-57 gamma-ray source for iron mineralogy" },
    ],
    history:
      "Ground away surface desert varnish on volcanic rocks to reveal pristine subsurface petrology, discovering aqueous alteration minerals in Gusev Crater.",
    cameraFocusOffset: [0.3, 0.1, 1.5],
    cameraOffset: [0.45, 0.25, 1.2],
  },
  suspension: {
    id: "suspension",
    nodeKey: "suspension",
    code: "MER-MOB-08",
    label: "Rocker-Bogie Articulated Suspension",
    shortName: "Rocker-Bogie",
    category: "Passive Suspension & Drive Mobility",
    description:
      "A differential rocker-bogie passive suspension with no springs. Equalizes ground load across all six wheels, allowing the rover to negotiate large obstacles while maintaining chassis stability during traverse across rugged Martian terrain.",
    specs: [
      { label: "Linkage Architecture", value: "Passive Rocker-Bogie with differential crossbar" },
      { label: "Obstacle Capability", value: "Theoretically >35 cm in design testbeds; AutoNav avoided ≥20 cm" },
      { label: "Wheel System", value: "6 independently driven wheels · 25 cm diameter in Al 7075-T6" },
      { label: "Top Traverse Velocity", value: "5 cm/s (2 inches/second) on flat hard ground" },
    ],
    history:
      "Navigated steep rocky slopes ascending Husband Hill up to a 31.2° pitch, becoming the first rover to conquer an extraterrestrial mountain summit.",
    cameraFocusOffset: [0, -0.25, 0.1],
    cameraOffset: [0, 0.3, 1.8],
  },
  wheel_RF: {
    id: "wheel_RF",
    nodeKey: "wheel_RF",
    code: "MER-WHL-09",
    label: "Right-Front Drive Actuator (Sol 779 Motor Anomaly)",
    shortName: "Sol 779 Wheel",
    category: "Locomotion & Hardware Anomaly",
    description:
      "Steerable 25-centimeter cleated aluminum wheel driven by an internal DC motor and planetary reduction gearbox. On Sol 779, the drive motor experienced an open circuit and ceased rotation, prompting mission engineers to adapt Spirit's locomotion strategy.",
    specs: [
      { label: "Wheel Diameter & Material", value: "25 cm (10 inches) · Spiral Cleats in Al 7075-T6" },
      { label: "Motor Architecture", value: "Brushless DC actuator with internal planetary gearbox" },
      { label: "Nominal Drive Speed", value: "5 cm/s (2 inches/second)" },
      { label: "Post-Sol 779 Mode", value: "Locked drag configuration (Reverse 5-wheel drive)" },
    ],
    history:
      "Following the Sol 779 motor failure, Spirit drove in reverse on 5 wheels. On Sol 1150 in the Columbia Hills near Home Plate, the dragging locked wheel exposed ~90% pure amorphous silica, generating key evidence of ancient volcanic hydrothermal activity.",
    anomaly: {
      title: "Sol 779 Drive Motor Open-Circuit",
      sol: 779,
      date: "March 13, 2006",
      classification: "CRITICAL HARDWARE ANOMALY · ADAPTED OPERATION",
      observedSymptom:
        "During a planned traverse toward McCool Hill, telemetry indicated that the right-front drive actuator stopped rotating. Electrical diagnostic testing confirmed an open circuit in the drive motor windings.",
      causeInvestigation:
        "The physical root cause remains unconfirmed in situ. Hypotheses evaluated by JPL engineering teams include broken motor commutator brushes, a mechanical gear bind, or a fatigue failure in the electrical harness lead wire.",
      operationalAdaptation:
        "JPL flight controllers commanded Spirit to drive backward on its five functional wheels for all subsequent long traverses, dragging the locked right-front wheel behind the chassis.",
      scientificDiscovery: {
        featureName: "Gertrude Weise (Columbia Hills)",
        exposureSol: "Sol 1150 (March 29, 2007)",
        analysisSols: "Sols 1189 & 1190 (May 2007)",
        mosaicSol: "Sol 1202 (May 21, 2007)",
        trackWidth: "Roughly 20 cm wide disturbed wheel track",
        finding:
          "On Sol 1150, the non-rotating right-front wheel dragged through the topsoil at Gertrude Weise near Home Plate, scraping away the basaltic surface dust. In-situ APXS measurements on Sols 1189 and 1190 revealed the exposed bright soil was approximately 90% amorphous silica (SiO₂).",
        hypotheses:
          "Science team geologists proposed two primary hypotheses: (1) precipitation of silica from ancient volcanic hot springs, or (2) acidic fumarolic steam leaching that dissolved away other minerals, leaving nearly pure silica. Both hypotheses signify ancient hydrothermal activity, offering evidence relevant to models of past Martian habitability.",
      },
    },
    cameraFocusOffset: [0.85, -0.1, 0.45],
    cameraOffset: [0.85, 0.35, 1.1],
  },
};

export const ORDERED_SUBSYSTEM_IDS = [
  "chassis",
  "solar",
  "hga",
  "mast",
  "pancam",
  "arm",
  "instruments",
  "suspension",
  "wheel_RF",
] as const;

export type InspectionState = {
  inspectedPartId: string | null;
  hoveredPartId: string | null;
  isInspecting: boolean;
};

type Listener = () => void;

let state: InspectionState = {
  inspectedPartId: null,
  hoveredPartId: null,
  isInspecting: false,
};

const listeners = new Set<Listener>();

export const inspectionStore = {
  get: (): InspectionState => state,

  setInspected: (partId: string | null) => {
    state = {
      ...state,
      inspectedPartId: partId,
      isInspecting: partId !== null,
    };
    listeners.forEach((listener) => listener());
  },

  setHovered: (partId: string | null) => {
    state = {
      ...state,
      hoveredPartId: partId,
    };
    listeners.forEach((listener) => listener());
  },

  nextSubsystem: () => {
    const currentId = state.inspectedPartId;
    if (!currentId) {
      inspectionStore.setInspected(ORDERED_SUBSYSTEM_IDS[0]);
      return;
    }
    const idx = ORDERED_SUBSYSTEM_IDS.indexOf(currentId as (typeof ORDERED_SUBSYSTEM_IDS)[number]);
    const nextIdx = (idx + 1) % ORDERED_SUBSYSTEM_IDS.length;
    const nextId = ORDERED_SUBSYSTEM_IDS[nextIdx] ?? ORDERED_SUBSYSTEM_IDS[0];
    inspectionStore.setInspected(nextId);
  },

  prevSubsystem: () => {
    const currentId = state.inspectedPartId;
    if (!currentId) {
      inspectionStore.setInspected(ORDERED_SUBSYSTEM_IDS[ORDERED_SUBSYSTEM_IDS.length - 1] ?? "chassis");
      return;
    }
    const idx = ORDERED_SUBSYSTEM_IDS.indexOf(currentId as (typeof ORDERED_SUBSYSTEM_IDS)[number]);
    const prevIdx = (idx - 1 + ORDERED_SUBSYSTEM_IDS.length) % ORDERED_SUBSYSTEM_IDS.length;
    const prevId = ORDERED_SUBSYSTEM_IDS[prevIdx] ?? ORDERED_SUBSYSTEM_IDS[0];
    inspectionStore.setInspected(prevId);
  },

  close: () => {
    if (state.isInspecting || state.inspectedPartId !== null) {
      state = {
        ...state,
        inspectedPartId: null,
        isInspecting: false,
      };
      listeners.forEach((listener) => listener());
    }
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useInspection(): InspectionState {
  return useSyncExternalStore(inspectionStore.subscribe, inspectionStore.get, inspectionStore.get);
}
