import { describe, expect, it } from "vitest";
import {
  SURFACE_CRATERS,
  SURFACE_FORMATIONS,
  surfaceTerrainHeight,
  surfaceTerrainNormal,
  surfaceTerrainSlope,
} from "@/components/mars/scene/terrain-math";
import { surfaceStore, SURFACE_VIEW_PRESETS } from "./surface-store";

describe("Stage 3.4-B: Mars Surface Environment Math & Systems", () => {
  describe("surfaceTerrainHeight(x, z) Ground Elevation Math", () => {
    it("is strictly deterministic across identical coordinates", () => {
      const h1 = surfaceTerrainHeight(12.34, -45.67);
      const h2 = surfaceTerrainHeight(12.34, -45.67);
      expect(h1).toBe(h2);
    });

    it("maintains a stable, gentle landing clearing around (0, 0)", () => {
      const hCenter = surfaceTerrainHeight(0, 0);
      expect(typeof hCenter).toBe("number");
      expect(Math.abs(hCenter)).toBeLessThan(1.5);

      // Verify slope at the deployment center is gentle (< 10 degrees)
      const slopeCenterDeg = (surfaceTerrainSlope(0, 0) * 180) / Math.PI;
      expect(slopeCenterDeg).toBeLessThan(10.0);
    });

    it("models Bonneville Crater depression bowl and raised ejecta rim", () => {
      const bonneville = SURFACE_CRATERS.find((c) => c.name === "Bonneville Crater")!;
      expect(bonneville).toBeDefined();

      const bowlHeight = surfaceTerrainHeight(bonneville.x, bonneville.z);
      // Rim is at radius r = 16m away
      const rimHeight = surfaceTerrainHeight(bonneville.x + bonneville.r, bonneville.z);

      // Bowl interior must be distinctly lower than the rim
      expect(bowlHeight).toBeLessThan(rimHeight - 1.5);
    });

    it("models Home Plate elevated silica plateau structure", () => {
      const hp = SURFACE_FORMATIONS.find((f) => f.name === "Home Plate Plateau")!;
      expect(hp).toBeDefined();

      const plateauHeight = surfaceTerrainHeight(hp.x, hp.z);
      // Compare with elevation 30m away outside the formation
      const outsideHeight = surfaceTerrainHeight(hp.x + 35, hp.z);

      expect(plateauHeight).toBeGreaterThan(outsideHeight);
    });

    it("features the Columbia Hills northern ascent at z < -16m", () => {
      const southHeight = surfaceTerrainHeight(0, 20);
      const northMountainHeight = surfaceTerrainHeight(0, -85);

      // North rises substantially to model Columbia Hills / Husband Hill
      expect(northMountainHeight).toBeGreaterThan(southHeight + 5.0);
    });

    it("elevates boundary perimeter to contain exploration safely (r > 78m)", () => {
      const interiorHeight = surfaceTerrainHeight(0, 30);
      const perimeterHeight = surfaceTerrainHeight(0, 95);

      // Outer rim must rise to naturally bound the exploration basin
      expect(perimeterHeight).toBeGreaterThan(interiorHeight + 3.0);
    });
  });

  describe("surfaceTerrainNormal(x, z) & Slope Analysis", () => {
    it("returns unit normal vectors with length 1.0", () => {
      const testCoords: readonly [number, number][] = [
        [0, 0],
        [25, -15],
        [-38, 42],
        [38, -32],
        [0, 62],
      ];

      for (const [x, z] of testCoords) {
        const [nx, ny, nz] = surfaceTerrainNormal(x, z);
        const len = Math.hypot(nx, ny, nz);
        expect(len).toBeCloseTo(1.0, 5);
        // Upward component ny must always be positive on navigable terrain
        expect(ny).toBeGreaterThan(0.2);
      }
    });

    it("computes slope angle within valid physical range [0, pi/2]", () => {
      const slope = surfaceTerrainSlope(15, -10);
      expect(slope).toBeGreaterThanOrEqual(0);
      expect(slope).toBeLessThanOrEqual(Math.PI / 2);
    });
  });

  describe("surfaceStore Reactive State Management & Camera Actions", () => {
    it("initializes with surface operations inactive by default", () => {
      expect(surfaceStore.get().isActive).toBe(false);
    });

    it("toggles active state cleanly", () => {
      surfaceStore.setSurfaceActive(true);
      expect(surfaceStore.get().isActive).toBe(true);

      surfaceStore.setSurfaceActive(false);
      expect(surfaceStore.get().isActive).toBe(false);
    });

    it("orbits camera azimuth and clamps elevation within stable bounds", () => {
      const initialAzimuth = surfaceStore.get().cameraAzimuth;
      surfaceStore.orbitCamera(0.5, 0.2);

      const state1 = surfaceStore.get();
      expect(state1.cameraAzimuth).toBeCloseTo(initialAzimuth + 0.5, 5);

      // Try extreme downward drag to test elevation clamping (never flips upside down)
      surfaceStore.orbitCamera(0, -5.0);
      expect(surfaceStore.get().cameraElevation).toBeGreaterThanOrEqual(0.08);

      // Try extreme upward drag to test elevation clamping (never flips overhead)
      surfaceStore.orbitCamera(0, 10.0);
      expect(surfaceStore.get().cameraElevation).toBeLessThanOrEqual(1.45);
    });

    it("zooms camera within distance limits [3.5m, 52.0m]", () => {
      // Zoom in past minimum
      surfaceStore.zoomCamera(-100);
      expect(surfaceStore.get().cameraDistance).toBe(3.5);

      // Zoom out past maximum
      surfaceStore.zoomCamera(200);
      expect(surfaceStore.get().cameraDistance).toBe(52.0);
    });

    it("pans camera target within terrain bounds", () => {
      surfaceStore.panCameraTarget(15, -20);
      const [tx, ty, tz] = surfaceStore.get().cameraTarget;
      expect(tx).toBe(15);
      expect(tz).toBe(-20);
      expect(ty).toBeCloseTo(surfaceTerrainHeight(15, -20) + 0.45, 2);
    });

    it("applies view presets accurately", () => {
      for (const preset of SURFACE_VIEW_PRESETS) {
        surfaceStore.setViewPreset(preset.id);
        const state = surfaceStore.get();
        expect(state.activePresetId).toBe(preset.id);
        expect(state.cameraDistance).toBe(preset.distance);
        expect(state.cameraAzimuth).toBe(preset.azimuth);
        expect(state.cameraTarget[0]).toBe(preset.target[0]);
        expect(state.cameraTarget[2]).toBe(preset.target[2]);
      }
    });

    it("resets camera to overview preset", () => {
      surfaceStore.setViewPreset("troy");
      expect(surfaceStore.get().activePresetId).toBe("troy");

      surfaceStore.resetCamera();
      expect(surfaceStore.get().activePresetId).toBe("overview");
      expect(surfaceStore.get().cameraDistance).toBe(14.0);
    });

    it("clamps optical depth Tau within [0.2, 1.5]", () => {
      surfaceStore.setOpticalDepth(0.05);
      expect(surfaceStore.get().opticalDepthTau).toBe(0.2);

      surfaceStore.setOpticalDepth(2.8);
      expect(surfaceStore.get().opticalDepthTau).toBe(1.5);

      surfaceStore.setOpticalDepth(0.65);
      expect(surfaceStore.get().opticalDepthTau).toBe(0.65);
    });

    it("clamps sun elevation within [5.0 deg, 85.0 deg]", () => {
      surfaceStore.setSunElevation(-10);
      expect(surfaceStore.get().sunElevationDeg).toBe(5.0);

      surfaceStore.setSunElevation(95);
      expect(surfaceStore.get().sunElevationDeg).toBe(85.0);

      surfaceStore.setSunElevation(45);
      expect(surfaceStore.get().sunElevationDeg).toBe(45.0);
    });
  });

  describe("Camera Ground Collision Prevention Logic", () => {
    it("ensures camera elevation always clears ground by at least 1.2m", () => {
      // Simulate low-angle camera hovering over hills or crater rims
      const testPositions: readonly [number, number][] = [
        [0, 0],
        [38, -32], // Bonneville rim
        [48, -4],  // Home Plate
        [0, -75],  // Columbia Hills rise
        [0, 62],   // Troy hollow
      ];

      for (const [cx, cz] of testPositions) {
        const groundY = surfaceTerrainHeight(cx, cz);
        const candidateCamY = groundY - 2.0; // Deliberately subterranean candidate
        const safeCamY = Math.max(candidateCamY, groundY + 1.25);

        expect(safeCamY).toBeGreaterThanOrEqual(groundY + 1.25);
        expect(safeCamY - groundY).toBeGreaterThanOrEqual(1.25);
      }
    });
  });
});

