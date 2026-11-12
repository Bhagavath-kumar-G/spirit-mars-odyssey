import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { builderStore, useBuilder } from "@/lib/builder-store";
import { COMPONENT_OPTIONS } from "@/lib/rover-engineering";
import {
  SURFACE_VIEW_PRESETS,
  useSurfaceStore,
} from "@/lib/surface-store";
import { surfaceTerrainHeight, surfaceTerrainSlope } from "./scene/terrain-math";

export function SurfaceControlsOverlay() {
  const {
    state,
    setSurfaceActive,
    zoomCamera,
    resetCamera,
    setViewPreset,
    setOpticalDepth,
    setSunElevation,
    setShowDeploymentBadge,
  } = useSurfaceStore();

  const { state: builderState, budget, evaluation } = useBuilder();
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Keyboard shortcuts for surface exploration
  useEffect(() => {
    if (!state.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Escape") {
        setSurfaceActive(false);
      } else if (e.key === "+" || e.key === "=") {
        zoomCamera(-2.0);
      } else if (e.key === "-" || e.key === "_") {
        zoomCamera(2.0);
      } else if (e.key === "r" || e.key === "R") {
        resetCamera();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isActive, setSurfaceActive, zoomCamera, resetCamera]);

  if (!state.isActive) return null;

  const [tx, , tz] = state.cameraTarget;
  const targetElevation = surfaceTerrainHeight(tx, tz);
  const targetSlopeDeg = (surfaceTerrainSlope(tx, tz) * 180) / Math.PI;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none select-none font-mono">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & TELEMETRY BAR                                 */}
      {/* ------------------------------------------------------------- */}
      <header className="pointer-events-auto p-3 md:p-5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-bold tracking-wider uppercase shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>NASA / JPL-CALTECH</span>
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-bold text-white tracking-wide uppercase">
              Mars Surface Operations · Gusev Crater
            </h1>
            <p className="text-[10px] text-zinc-400 hidden sm:block">
              Stage 3.4-C Configured Rover Surface Deployment · Hardware Preserved
            </p>
          </div>
        </div>

        {/* Real-time Environment Telemetry Badges */}
        <div className="flex items-center gap-2 text-[11px]">
          <div className="px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-700/70 text-zinc-300">
            <span className="text-zinc-500 mr-1.5">COORD</span>
            <span className="text-cyan-400 font-bold">
              X: {tx >= 0 ? `+${tx.toFixed(1)}` : tx.toFixed(1)}m, Z: {tz >= 0 ? `+${tz.toFixed(1)}` : tz.toFixed(1)}m
            </span>
          </div>

          <div className="px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-700/70 text-zinc-300 hidden md:block">
            <span className="text-zinc-500 mr-1.5">ELEV</span>
            <span className="text-emerald-400 font-bold">{targetElevation.toFixed(2)} m</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-700/70 text-zinc-300 hidden lg:block">
            <span className="text-zinc-500 mr-1.5">SLOPE</span>
            <span className="text-amber-400 font-bold">{targetSlopeDeg.toFixed(1)}°</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-700/70 text-zinc-300">
            <span className="text-zinc-500 mr-1.5">DUST τ</span>
            <span className="text-orange-400 font-bold">{state.opticalDepthTau.toFixed(2)}</span>
          </div>

          {/* Hardware Manifest Toggle */}
          <button
            type="button"
            onClick={() => setShowDeploymentBadge(!state.showDeploymentBadge)}
            className={cn(
              "px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 border",
              state.showDeploymentBadge
                ? "bg-orange-500/20 text-orange-300 border-orange-500/50"
                : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700/70",
            )}
            title="Toggle Deployed Rover Hardware Manifest"
          >
            <span>📋</span>
            <span className="hidden sm:inline">Manifest</span>
          </button>

          {/* Return buttons */}
          <button
            type="button"
            onClick={() => {
              setSurfaceActive(false);
              builderStore.setOpen(true);
            }}
            className="px-3 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 transition-colors flex items-center gap-1.5"
            title="Return to Cleanroom Workshop"
          >
            <span>🛠️</span>
            <span className="hidden sm:inline">Workshop</span>
          </button>

          <button
            type="button"
            onClick={() => setSurfaceActive(false)}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Exit to Story Scroll (Esc)"
          >
            ✕
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. ROVER HARDWARE MANIFEST / DEPLOYMENT CONFIRMATION CARD     */}
      {/* ------------------------------------------------------------- */}
      {state.showDeploymentBadge && (
        <div className="pointer-events-auto absolute left-3 md:left-5 top-20 max-w-[340px] sm:max-w-[380px] w-full bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-2xl text-xs z-20">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                SURFACE DEPLOYED
              </span>
              <span className="text-white font-bold text-xs">
                MER-A Hardware Manifest
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDeploymentBadge(false)}
              className="text-zinc-500 hover:text-white text-xs p-1"
              title="Dismiss Manifest"
            >
              ✕
            </button>
          </div>

          {/* Configured Hardware List */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-start justify-between p-1.5 rounded bg-zinc-900/60 border border-zinc-800/60">
              <div>
                <span className="text-[10px] text-zinc-500 block">MOBILITY</span>
                <span className="text-zinc-200 font-semibold">{COMPONENT_OPTIONS[builderState.selected.mobility]?.name}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                {COMPONENT_OPTIONS[builderState.selected.mobility]?.code}
              </span>
            </div>

            <div className="flex items-start justify-between p-1.5 rounded bg-zinc-900/60 border border-zinc-800/60">
              <div>
                <span className="text-[10px] text-zinc-500 block">POWER</span>
                <span className="text-zinc-200 font-semibold">{COMPONENT_OPTIONS[builderState.selected.power]?.name}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                {COMPONENT_OPTIONS[builderState.selected.power]?.code}
              </span>
            </div>

            <div className="flex items-start justify-between p-1.5 rounded bg-zinc-900/60 border border-zinc-800/60">
              <div>
                <span className="text-[10px] text-zinc-500 block">SCIENCE</span>
                <span className="text-zinc-200 font-semibold">{COMPONENT_OPTIONS[builderState.selected.science]?.name}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                {COMPONENT_OPTIONS[builderState.selected.science]?.code}
              </span>
            </div>

            <div className="flex items-start justify-between p-1.5 rounded bg-zinc-900/60 border border-zinc-800/60">
              <div>
                <span className="text-[10px] text-zinc-500 block">TELECOM</span>
                <span className="text-zinc-200 font-semibold">{COMPONENT_OPTIONS[builderState.selected.telecom]?.name}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                {COMPONENT_OPTIONS[builderState.selected.telecom]?.code}
              </span>
            </div>
          </div>

          {/* Engineering Metrics Row */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] border-t border-zinc-800/70">
            <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-center">
              <span className="text-zinc-500 block">MASS</span>
              <span className="font-bold text-white">{budget.totalMassKg.toFixed(1)} kg</span>
            </div>
            <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-center">
              <span className="text-zinc-500 block">POWER GEN</span>
              <span className="font-bold text-emerald-400">{budget.powerGenWhPerSol} Wh</span>
            </div>
            <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-center">
              <span className="text-zinc-500 block">RATING</span>
              <span className="font-bold text-cyan-400">{evaluation.compositeScore}/100</span>
            </div>
          </div>

          {/* Quick Card Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setViewPreset("rover")}
              className="flex-1 py-1.5 rounded bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-center text-[11px] font-semibold transition-colors"
            >
              🔍 Focus Rover
            </button>
            <button
              type="button"
              onClick={() => {
                setSurfaceActive(false);
                builderStore.setOpen(true);
              }}
              className="flex-1 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-center text-[11px] transition-colors"
            >
              🛠️ Cleanroom
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. RIGHT-SIDE EXPLORATION & ENVIRONMENT CONTROLLER            */}
      {/* ------------------------------------------------------------- */}
      <div className="pointer-events-auto absolute right-3 md:right-5 top-20 flex flex-col items-end gap-2 max-w-[280px] sm:max-w-[320px]">
        {/* Toggle Collapse Button for Mobile / Clean View */}
        <button
          type="button"
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="px-2.5 py-1 rounded bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md"
        >
          <span>{isPanelCollapsed ? "⚙️ Show Controls" : "▲ Hide Controls"}</span>
        </button>

        {!isPanelCollapsed && (
          <div className="w-full bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-xl p-3.5 space-y-3.5 shadow-2xl text-xs">
            {/* Viewpoint Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Geological Vistas</span>
                <span className="text-zinc-500 text-[9px] font-normal">Select POV</span>
              </label>

              <div className="grid grid-cols-1 gap-1">
                {SURFACE_VIEW_PRESETS.map((p) => {
                  const isSelected = state.activePresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setViewPreset(p.id)}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded text-[11px] transition-all flex items-center justify-between",
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-semibold"
                          : "bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80",
                      )}
                    >
                      <span>{p.name}</span>
                      {isSelected && <span className="text-cyan-400 text-[10px]">●</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orbit & Zoom Direct Controls */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Camera Optics</span>
                <span className="text-zinc-500">{state.cameraDistance.toFixed(1)}m dist</span>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => zoomCamera(-3.0)}
                  className="flex-1 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-center text-xs font-bold transition-colors"
                  title="Zoom In (+)"
                >
                  + Zoom In
                </button>
                <button
                  type="button"
                  onClick={() => zoomCamera(3.0)}
                  className="flex-1 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-center text-xs font-bold transition-colors"
                  title="Zoom Out (-)"
                >
                  − Zoom Out
                </button>
                <button
                  type="button"
                  onClick={resetCamera}
                  className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/80 text-center text-xs transition-colors"
                  title="Reset Camera (R)"
                >
                  ↺
                </button>
              </div>
            </div>

            {/* Environmental Dust Opacity (Tau) Slider */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[10px]">
                <span className="uppercase font-bold tracking-wider text-zinc-400">Atmospheric Dust (τ)</span>
                <span className="text-orange-400 font-bold">{state.opticalDepthTau.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="1.40"
                step="0.05"
                value={state.opticalDepthTau}
                onChange={(e) => setOpticalDepth(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>Clear Sky (0.2)</span>
                <span>Dust Storm (1.4)</span>
              </div>
            </div>

            {/* Sun Solar Elevation Slider */}
            <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[10px]">
                <span className="uppercase font-bold tracking-wider text-zinc-400">Sun Elevation</span>
                <span className="text-amber-400 font-bold">{Math.round(state.sunElevationDeg)}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="75"
                step="1"
                value={state.sunElevationDeg}
                onChange={(e) => setSunElevation(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>Low Sun / Dawn (10°)</span>
                <span>Noon (75°)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM INTERACTION GUIDELINES BAR                          */}
      {/* ------------------------------------------------------------- */}
      <footer className="pointer-events-auto absolute bottom-3 left-3 right-3 md:left-6 md:right-6 flex flex-wrap items-center justify-between gap-2 p-2.5 md:p-3 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold">
            CONTROLS
          </span>
          <span className="hidden sm:inline">
            <strong className="text-zinc-200">Left-Drag / Touch:</strong> Orbit 360° ·{" "}
            <strong className="text-zinc-200">Right-Drag:</strong> Pan Terrain ·{" "}
            <strong className="text-zinc-200">Wheel / Pinch:</strong> Zoom ·{" "}
            <strong className="text-zinc-200">[R]:</strong> Reset
          </span>
          <span className="sm:hidden">
            Drag to orbit · Pinch to zoom
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[10px] hidden md:inline">
            Stage 3.4-D 6-Wheel Driving Simulation arriving next
          </span>
          <button
            type="button"
            onClick={() => {
              setSurfaceActive(false);
              builderStore.setOpen(true);
            }}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            ← Back to Cleanroom
          </button>
        </div>
      </footer>
    </div>
  );
}

