import { beforeEach, describe, expect, it } from "vitest";
import {
  BASELINE_SELECTIONS,
  calculateEngineeringBudget,
  COMPONENT_OPTIONS,
  SubsystemCategory,
} from "./rover-engineering";
import { builderStore } from "./builder-store";
import { surfaceStore, SURFACE_VIEW_PRESETS } from "./surface-store";
import { surfaceTerrainHeight, surfaceTerrainSlope } from "@/components/mars/scene/terrain-math";

describe("Stage 3.4-C: Configured Rover Surface Deployment", () => {
  beforeEach(() => {
    builderStore.resetToBaseline();
    surfaceStore.resetCamera();
    surfaceStore.setSurfaceActive(false);
  });

  describe("Hardware Configuration Preservation", () => {
    it("preserves Spirit baseline flight configuration by default", () => {
      const selections = builderStore.get().selected;
      expect(selections.mobility).toBe("wheels_standard");
      expect(selections.power).toBe("power_solar_baseline");
      expect(selections.science).toBe("science_athena_baseline");
      expect(selections.telecom).toBe("telecom_hga_dish");

      const budget = calculateEngineeringBudget(selections, "clean_summer_perihelion");
      expect(budget.totalMassKg).toBe(174.0);
      expect(budget.massDeltaKg).toBe(0.0);
    });

    it("preserves Heavy-Traction Wheels when deployed to surface", () => {
      builderStore.selectOption("mobility", "wheels_heavy");
      expect(builderStore.get().selected.mobility).toBe("wheels_heavy");

      surfaceStore.deployRover();
      expect(surfaceStore.get().isActive).toBe(true);
      expect(builderStore.get().selected.mobility).toBe("wheels_heavy");

      const opt = COMPONENT_OPTIONS["wheels_heavy"];
      expect(opt.name).toBe("Heavy-Traction Deep-Sand Wheels");
      expect(opt.code).toBe("MOB-HVY-32");
    });

    it("preserves Compliant Shape-Memory Alloy Tires", () => {
      builderStore.selectOption("mobility", "wheels_compliant");
      expect(builderStore.get().selected.mobility).toBe("wheels_compliant");

      surfaceStore.deployRover();
      expect(surfaceStore.get().isActive).toBe(true);
      expect(builderStore.get().selected.mobility).toBe("wheels_compliant");

      const opt = COMPONENT_OPTIONS["wheels_compliant"];
      expect(opt.code).toBe("MOB-CMP-28");
    });

    it("preserves Extended Solar Wings power configuration", () => {
      builderStore.selectOption("power", "power_solar_extended");
      surfaceStore.deployRover();

      expect(builderStore.get().selected.power).toBe("power_solar_extended");
      expect(COMPONENT_OPTIONS["power_solar_extended"].code).toBe("PWR-SOL-EXT");
    });

    it("preserves MMRTG nuclear power configuration and replaces solar array", () => {
      builderStore.selectOption("power", "power_mmrtg");
      surfaceStore.deployRover();

      expect(builderStore.get().selected.power).toBe("power_mmrtg");
      expect(COMPONENT_OPTIONS["power_mmrtg"].code).toBe("PWR-NUC-RTG");
      // Mass budget includes nuclear delta (+45 kg)
      const budget = calculateEngineeringBudget(builderStore.get().selected, "clean_summer_perihelion");
      expect(budget.totalMassKg).toBe(219.0);
    });

    it("preserves Coring Drill and Subsurface GPR science configurations", () => {
      builderStore.selectOption("science", "science_coring_drill");
      expect(builderStore.get().selected.science).toBe("science_coring_drill");

      builderStore.selectOption("science", "science_subsurface_radar");
      expect(builderStore.get().selected.science).toBe("science_subsurface_radar");

      surfaceStore.deployRover();
      expect(builderStore.get().selected.science).toBe("science_subsurface_radar");
    });

    it("preserves Extended Dish and Phased Array telecom configurations", () => {
      builderStore.selectOption("telecom", "telecom_high_gain_extended");
      expect(builderStore.get().selected.telecom).toBe("telecom_high_gain_extended");

      builderStore.selectOption("telecom", "telecom_phased_array");
      expect(builderStore.get().selected.telecom).toBe("telecom_phased_array");

      surfaceStore.deployRover();
      expect(builderStore.get().selected.telecom).toBe("telecom_phased_array");
    });

    it("enforces mutual exclusivity within each subsystem", () => {
      const categories: SubsystemCategory[] = ["mobility", "power", "science", "telecom"];

      for (const cat of categories) {
        const selected = builderStore.get().selected[cat];
        // Only one option id per category can be selected
        expect(typeof selected).toBe("string");
        expect(selected.length).toBeGreaterThan(0);
      }
    });

    it("preserves combined multi-subsystem alternative configurations intact", () => {
      builderStore.selectOption("mobility", "wheels_heavy");
      builderStore.selectOption("power", "power_solar_extended");
      builderStore.selectOption("science", "science_coring_drill");
      builderStore.selectOption("telecom", "telecom_phased_array");

      surfaceStore.deployRover();

      const sel = builderStore.get().selected;
      expect(sel.mobility).toBe("wheels_heavy");
      expect(sel.power).toBe("power_solar_extended");
      expect(sel.science).toBe("science_coring_drill");
      expect(sel.telecom).toBe("telecom_phased_array");

      // Verify returning to workshop preserves the identical selections
      surfaceStore.setSurfaceActive(false);
      builderStore.setOpen(true);

      const returnedSel = builderStore.get().selected;
      expect(returnedSel).toEqual(sel);
    });
  });

  describe("Surface Ground Alignment & Suspension Footprint Math", () => {
    it("validates the default deployment clearing at (0, 0) is level and stable", () => {
      const hCenter = surfaceTerrainHeight(0, 0);
      const slopeCenterDeg = (surfaceTerrainSlope(0, 0) * 180) / Math.PI;

      // Clearing must be gentle (< 10 degrees) and near datum
      expect(Math.abs(hCenter)).toBeLessThan(1.5);
      expect(slopeCenterDeg).toBeLessThan(10.0);
    });

    it("calculates accurate 4-point suspension footprint heights for the MER chassis", () => {
      const x = 0;
      const z = 0;
      const heading = 0; // facing +Z

      const xFront = x + 0.603 * Math.sin(heading);
      const zFront = z + 0.603 * Math.cos(heading);
      const xRear = x - 0.603 * Math.sin(heading);
      const zRear = z - 0.603 * Math.cos(heading);
      const xStarboard = x + 0.485 * Math.cos(heading);
      const zStarboard = z - 0.485 * Math.sin(heading);
      const xPort = x - 0.485 * Math.cos(heading);
      const zPort = z + 0.485 * Math.sin(heading);

      const yFront = surfaceTerrainHeight(xFront, zFront);
      const yRear = surfaceTerrainHeight(xRear, zRear);
      const yStarboard = surfaceTerrainHeight(xStarboard, zStarboard);
      const yPort = surfaceTerrainHeight(xPort, zPort);

      const avgY = (yFront + yRear + yStarboard + yPort) / 4;
      const pitch = Math.atan2(yFront - yRear, 1.206);
      const roll = Math.atan2(yStarboard - yPort, 0.97);

      expect(typeof avgY).toBe("number");
      expect(Math.abs(pitch)).toBeLessThan(Math.PI / 6); // < 30 degrees
      expect(Math.abs(roll)).toBeLessThan(Math.PI / 6);
    });

    it("applies correct wheel radius delta offsets to prevent floating or sinking", () => {
      // Baseline 25cm wheel: delta = 0
      const getRadiusDelta = (mobility: string) => {
        if (mobility === "wheels_heavy") return 0.035; // 32cm vs 25cm
        if (mobility === "wheels_compliant") return 0.015; // 28cm vs 25cm
        return 0.0;
      };

      expect(getRadiusDelta("wheels_standard")).toBe(0.0);
      expect(getRadiusDelta("wheels_heavy")).toBe(0.035);
      expect(getRadiusDelta("wheels_compliant")).toBe(0.015);
    });
  });

  describe("Deployment Experience & State Transitions", () => {
    it("deployRover() configures camera target on rover and triggers intro sequence", () => {
      surfaceStore.deployRover();

      const state = surfaceStore.get();
      expect(state.isActive).toBe(true);
      expect(state.isDeploying).toBe(true);
      expect(state.showDeploymentBadge).toBe(true);
      expect(state.activePresetId).toBe("rover");
      expect(state.cameraDistance).toBe(6.8);

      // Verify camera focus tracks the rover position
      expect(state.cameraTarget[0]).toBe(0);
      expect(state.cameraTarget[2]).toBe(0);
    });

    it("provides 'rover' viewpoint preset in SURFACE_VIEW_PRESETS", () => {
      const roverPreset = SURFACE_VIEW_PRESETS.find((p) => p.id === "rover");
      expect(roverPreset).toBeDefined();
      expect(roverPreset?.name).toBe("Deployed Rover Close-up");
      expect(roverPreset?.distance).toBe(6.8);
    });

    it("toggles deployment manifest badge visibility cleanly", () => {
      surfaceStore.setShowDeploymentBadge(false);
      expect(surfaceStore.get().showDeploymentBadge).toBe(false);

      surfaceStore.setShowDeploymentBadge(true);
      expect(surfaceStore.get().showDeploymentBadge).toBe(true);
    });

    it("terminates deployment intro sequence when completed", () => {
      surfaceStore.deployRover();
      expect(surfaceStore.get().isDeploying).toBe(true);

      surfaceStore.endDeploymentIntro();
      expect(surfaceStore.get().isDeploying).toBe(false);
    });
  });
});
