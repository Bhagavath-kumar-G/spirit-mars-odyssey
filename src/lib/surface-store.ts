import { useSyncExternalStore } from "react";
import { surfaceTerrainHeight } from "@/components/mars/scene/terrain-math";

export type SurfaceCameraMode = "orbit" | "firstPerson" | "topDown";

export interface SurfaceViewPreset {
  id: string;
  name: string;
  target: [number, number, number];
  distance: number;
  azimuth: number;
  elevation: number;
  description: string;
}

export const SURFACE_VIEW_PRESETS: readonly SurfaceViewPreset[] = [
  {
    id: "rover",
    name: "Deployed Rover Close-up",
    target: [0, 0.45, 0],
    distance: 6.8,
    azimuth: 0.62,
    elevation: 0.32,
    description: "Heroic technical inspection framing of the configured rover on Mars.",
  },
  {
    id: "overview",
    name: "Landing Site Overview",
    target: [0, 0.45, 0],
    distance: 14.0,
    azimuth: 0.78,
    elevation: 0.38,
    description: "Columbia Memorial Station landing coordinates and deployment clearing.",
  },
  {
    id: "hills",
    name: "Columbia Hills Vista",
    target: [0, 8.5, -45],
    distance: 28.0,
    azimuth: 3.14,
    elevation: 0.28,
    description: "Looking north toward Husband Hill and the ascending alpine ridges.",
  },
  {
    id: "bonneville",
    name: "Bonneville Crater Rim",
    target: [38, 1.2, -32],
    distance: 22.0,
    azimuth: 2.1,
    elevation: 0.45,
    description: "200-meter-class impact crater with basaltic ejecta blankets.",
  },
  {
    id: "homePlate",
    name: "Home Plate Plateau",
    target: [48, 2.8, -4],
    distance: 18.0,
    azimuth: 4.8,
    elevation: 0.35,
    description: "Elevated volcanic layered plateau rich in opaline silica deposits.",
  },
  {
    id: "troy",
    name: "Troy Sulfate Hollow",
    target: [0, 0.2, 62],
    distance: 20.0,
    azimuth: 0.2,
    elevation: 0.42,
    description: "Deceptive sulfate drift zone where Spirit fought high wheel slippage.",
  },
];

export interface RoverSurfacePose {
  x: number;
  y: number;
  z: number;
  heading: number; // yaw angle in radians
  pitch: number;   // pitch angle in radians
  roll: number;    // roll angle in radians
}

export interface SurfaceOperationsState {
  isActive: boolean;
  cameraMode: SurfaceCameraMode;
  cameraTarget: [number, number, number];
  cameraDistance: number;
  cameraAzimuth: number;
  cameraElevation: number;
  opticalDepthTau: number;
  sunElevationDeg: number;
  activePresetId: string;

  // Stage 3.4-C: Rover Surface Deployment State
  roverPose: RoverSurfacePose;
  isDeploying: boolean;
  showDeploymentBadge: boolean;
}

const INITIAL_STATE: SurfaceOperationsState = {
  isActive: false,
  cameraMode: "orbit",
  cameraTarget: [0, 0.45, 0],
  cameraDistance: 14.0,
  cameraAzimuth: 0.78,
  cameraElevation: 0.38,
  opticalDepthTau: 0.45,
  sunElevationDeg: 38.0,
  activePresetId: "overview",
  roverPose: {
    x: 0,
    y: 0,
    z: 0,
    heading: 0,
    pitch: 0,
    roll: 0,
  },
  isDeploying: false,
  showDeploymentBadge: false,
};

class SurfaceStore {
  private state: SurfaceOperationsState = { ...INITIAL_STATE };
  private listeners = new Set<() => void>();

  public get = (): SurfaceOperationsState => this.state;

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify = (): void => {
    this.listeners.forEach((listener) => listener());
  };

  public setSurfaceActive = (active: boolean): void => {
    if (this.state.isActive === active) return;
    this.state = {
      ...this.state,
      isActive: active,
    };
    this.notify();
  };

  public setCameraMode = (mode: SurfaceCameraMode): void => {
    if (this.state.cameraMode === mode) return;
    this.state = {
      ...this.state,
      cameraMode: mode,
    };
    this.notify();
  };

  public orbitCamera = (deltaAzimuth: number, deltaElevation: number): void => {
    const newAzimuth = (this.state.cameraAzimuth + deltaAzimuth) % (Math.PI * 2);
    // Clamp elevation between ~0.08 rad (~5 deg) and ~1.45 rad (~83 deg) to prevent flipping
    const newElevation = Math.max(0.08, Math.min(1.45, this.state.cameraElevation + deltaElevation));
    this.state = {
      ...this.state,
      cameraAzimuth: newAzimuth,
      cameraElevation: newElevation,
      activePresetId: "custom",
    };
    this.notify();
  };

  public zoomCamera = (deltaDistance: number): void => {
    // Clamp zoom distance between 3.5m and 52m
    const newDistance = Math.max(3.5, Math.min(52.0, this.state.cameraDistance + deltaDistance));
    this.state = {
      ...this.state,
      cameraDistance: newDistance,
      activePresetId: "custom",
    };
    this.notify();
  };

  public panCameraTarget = (deltaX: number, deltaZ: number): void => {
    const nx = Math.max(-85, Math.min(85, this.state.cameraTarget[0] + deltaX));
    const nz = Math.max(-85, Math.min(85, this.state.cameraTarget[2] + deltaZ));
    const ny = surfaceTerrainHeight(nx, nz) + 0.45;
    this.state = {
      ...this.state,
      cameraTarget: [nx, ny, nz],
      activePresetId: "custom",
    };
    this.notify();
  };

  public setCameraTarget = (x: number, y: number, z: number): void => {
    this.state = {
      ...this.state,
      cameraTarget: [x, y, z],
      activePresetId: "custom",
    };
    this.notify();
  };

  public setViewPreset = (presetId: string): void => {
    const preset = SURFACE_VIEW_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    this.state = {
      ...this.state,
      cameraTarget: [...preset.target],
      cameraDistance: preset.distance,
      cameraAzimuth: preset.azimuth,
      cameraElevation: preset.elevation,
      activePresetId: preset.id,
    };
    this.notify();
  };

  public resetCamera = (): void => {
    this.setViewPreset("overview");
  };

  public deployRover = (customPose?: Partial<RoverSurfacePose>): void => {
    const rx = customPose?.x ?? 0;
    const rz = customPose?.z ?? 0;
    const groundY = surfaceTerrainHeight(rx, rz);
    const ry = customPose?.y ?? groundY + 0.15;
    const rHeading = customPose?.heading ?? 0;

    const newPose: RoverSurfacePose = {
      x: rx,
      y: ry,
      z: rz,
      heading: rHeading,
      pitch: customPose?.pitch ?? 0,
      roll: customPose?.roll ?? 0,
    };

    this.state = {
      ...this.state,
      isActive: true,
      isDeploying: true,
      showDeploymentBadge: true,
      activePresetId: "rover",
      cameraTarget: [rx, ry + 0.35, rz],
      cameraDistance: 6.8,
      cameraAzimuth: 0.62,
      cameraElevation: 0.32,
      roverPose: newPose,
    };
    this.notify();
  };

  public endDeploymentIntro = (): void => {
    if (!this.state.isDeploying) return;
    this.state = {
      ...this.state,
      isDeploying: false,
    };
    this.notify();
  };

  public setShowDeploymentBadge = (show: boolean): void => {
    if (this.state.showDeploymentBadge === show) return;
    this.state = {
      ...this.state,
      showDeploymentBadge: show,
    };
    this.notify();
  };

  public updateRoverPose = (poseUpdate: Partial<RoverSurfacePose>): void => {
    this.state = {
      ...this.state,
      roverPose: {
        ...this.state.roverPose,
        ...poseUpdate,
      },
    };
    this.notify();
  };

  public setOpticalDepth = (tau: number): void => {
    const clamped = Math.max(0.2, Math.min(1.5, tau));
    this.state = {
      ...this.state,
      opticalDepthTau: clamped,
    };
    this.notify();
  };

  public setSunElevation = (deg: number): void => {
    const clamped = Math.max(5.0, Math.min(85.0, deg));
    this.state = {
      ...this.state,
      sunElevationDeg: clamped,
    };
    this.notify();
  };
}

export const surfaceStore = new SurfaceStore();

export function useSurfaceStore(): {
  state: SurfaceOperationsState;
  setSurfaceActive: (active: boolean) => void;
  setCameraMode: (mode: SurfaceCameraMode) => void;
  orbitCamera: (deltaAzimuth: number, deltaElevation: number) => void;
  zoomCamera: (deltaDistance: number) => void;
  panCameraTarget: (deltaX: number, deltaZ: number) => void;
  setCameraTarget: (x: number, y: number, z: number) => void;
  setViewPreset: (presetId: string) => void;
  resetCamera: () => void;
  setOpticalDepth: (tau: number) => void;
  setSunElevation: (deg: number) => void;
  deployRover: (customPose?: Partial<RoverSurfacePose>) => void;
  endDeploymentIntro: () => void;
  setShowDeploymentBadge: (show: boolean) => void;
  updateRoverPose: (poseUpdate: Partial<RoverSurfacePose>) => void;
} {
  const state = useSyncExternalStore(surfaceStore.subscribe, surfaceStore.get, surfaceStore.get);
  return {
    state,
    setSurfaceActive: surfaceStore.setSurfaceActive,
    setCameraMode: surfaceStore.setCameraMode,
    orbitCamera: surfaceStore.orbitCamera,
    zoomCamera: surfaceStore.zoomCamera,
    panCameraTarget: surfaceStore.panCameraTarget,
    setCameraTarget: surfaceStore.setCameraTarget,
    setViewPreset: surfaceStore.setViewPreset,
    resetCamera: surfaceStore.resetCamera,
    setOpticalDepth: surfaceStore.setOpticalDepth,
    setSunElevation: surfaceStore.setSunElevation,
    deployRover: surfaceStore.deployRover,
    endDeploymentIntro: surfaceStore.endDeploymentIntro,
    setShowDeploymentBadge: surfaceStore.setShowDeploymentBadge,
    updateRoverPose: surfaceStore.updateRoverPose,
  };
}

