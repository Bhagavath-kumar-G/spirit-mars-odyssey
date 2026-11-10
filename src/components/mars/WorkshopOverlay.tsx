import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useBuilder } from "@/lib/builder-store";
import {
  COMPONENT_OPTIONS,
  SIMULATION_MASS_THRESHOLD_KG,
  SOLAR_SCENARIOS,
  SolarScenario,
  SubsystemCategory,
} from "@/lib/rover-engineering";

const CATEGORIES: { id: SubsystemCategory; label: string; icon: string }[] = [
  { id: "mobility", label: "Mobility", icon: "⚙️" },
  { id: "power", label: "Power", icon: "☀️" },
  { id: "science", label: "Science", icon: "🔬" },
  { id: "telecom", label: "Telecom", icon: "📡" },
];

export function WorkshopOverlay() {
  const {
    state,
    budget,
    setOpen,
    setActiveCategory,
    setScenario,
    toggleAutoSpin,
    zoomIn,
    zoomOut,
    resetView,
    resetToBaseline,
  } = useBuilder();

  const activeOption = COMPONENT_OPTIONS[state.selected[state.activeCategory]];

  // Lock background document scroll while the workshop bay is active
  useEffect(() => {
    if (!state.isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [state.isOpen]);

  // Keyboard navigation inside workshop (Esc to close, +/- zoom, Space to toggle spin)
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture if active in an input, textarea, or select dropdown
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "+" || e.key === "=") {
        zoomIn();
      } else if (e.key === "-" || e.key === "_") {
        zoomOut();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        toggleAutoSpin();
      } else if (e.key === "r" || e.key === "R") {
        resetView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, setOpen, zoomIn, zoomOut, toggleAutoSpin, resetView]);

  if (!state.isOpen) return null;

  // Mass percentage towards simulation threshold
  const massPct = Math.min(100, Math.round((budget.totalMassKg / SIMULATION_MASS_THRESHOLD_KG) * 100));
  const currentDeg = Math.round((((state.turntableAngle * 180) / Math.PI) % 360 + 360) % 360);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none font-sans text-zinc-100">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & MISSION CONTROL BAR                              */}
      {/* ------------------------------------------------------------- */}
      <header className="pointer-events-auto flex items-center justify-between gap-4 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 px-4 py-3 rounded-xl shadow-2xl max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-sm font-bold">
            🛠️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
                NASA / JPL Engineering Workshop
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                BLDG 179 CLEANROOM
              </span>
            </div>
            <h1 className="text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-2">
              Spirit MER-A Baseline Exploration
              <span className="text-xs font-normal text-zinc-400 hidden sm:inline">
                · Interactive 3D Turntable
              </span>
            </h1>
          </div>
        </div>

        {/* Viewport Turntable Controls */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-400">
            <span>AZ:</span>
            <span className="text-cyan-400 font-semibold">{String(currentDeg).padStart(3, "0")}°</span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1">
            <button
              type="button"
              onClick={zoomIn}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-colors"
              title="Zoom In (+)"
              aria-label="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={zoomOut}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-colors"
              title="Zoom Out (-)"
              aria-label="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>
            <button
              type="button"
              onClick={toggleAutoSpin}
              className={cn(
                "p-1.5 rounded transition-colors text-xs font-mono",
                state.isAutoSpinning
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "hover:bg-zinc-800 text-zinc-400",
              )}
              title="Toggle Auto-Spin (Space)"
              aria-label="Toggle auto-spin"
            >
              {state.isAutoSpinning ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              onClick={resetView}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-colors text-xs font-mono"
              title="Reset View Angle (R)"
              aria-label="Reset view"
            >
              ↻
            </button>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/40 border border-zinc-700 hover:border-red-500/40 text-xs font-mono text-zinc-300 hover:text-red-400 transition-colors shadow-sm"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Return to Mars</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE DRAG HINT BADGE (BOTTOM CENTER)                    */}
      {/* ------------------------------------------------------------- */}
      <div className="pointer-events-none hidden md:flex justify-center w-full my-auto">
        <div className="bg-zinc-950/70 border border-zinc-800/60 px-3.5 py-1.5 rounded-full text-[11px] font-mono text-zinc-400 tracking-wide backdrop-blur-sm shadow-lg flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>DRAG ROVER TO SPIN TURNTABLE · PINCH / SCROLL TO ZOOM</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN WORKSHOP DOCK: LATERAL (DESKTOP) / BOTTOM SHEET (MOBILE)  */}
      {/* ------------------------------------------------------------- */}
      <div className="pointer-events-auto flex flex-col md:flex-row gap-4 justify-between items-end max-w-7xl mx-auto w-full">
        {/* Left Telemetry Panel: Engineering Budget & Scenario */}
        <div className="w-full md:w-80 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 p-4 rounded-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Telemetry Summary
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              HISTORICAL BASELINE
            </span>
          </div>

          {/* Mass Budget Meter */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-zinc-400">Total Rover Mass:</span>
              <span className="font-bold text-white">
                {budget.totalMassKg.toFixed(1)} kg
                <span className="text-[10px] font-normal text-zinc-500"> / 205.0 kg</span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${massPct}%` }}
              />
            </div>
          </div>

          {/* Electrical Daily Energy Balance */}
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Solar Generation:</span>
              <span className="text-cyan-400 font-semibold">{budget.powerGenWhPerSol} Wh/sol</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-[11px] pl-2 border-l border-zinc-800">
              <span>↳ Hotel Load:</span>
              <span>{budget.hotelLoadWhPerSol} Wh/sol</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-[11px] pl-2 border-l border-zinc-800">
              <span>↳ Active Load:</span>
              <span>{budget.activeLoadWhPerSol} Wh/sol</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Daily Consumption:</span>
              <span className="text-zinc-300">{budget.dailyConsumptionWhPerSol} Wh/sol</span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-1.5">
              <span className="text-zinc-400">Net Energy Margin:</span>
              <span
                className={`font-bold ${
                  budget.netEnergyMarginWhPerSol >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {budget.netEnergyMarginWhPerSol >= 0
                  ? `+${budget.netEnergyMarginWhPerSol}`
                  : budget.netEnergyMarginWhPerSol}{" "}
                Wh/sol
              </span>
            </div>
          </div>

          {/* Scenario Selector */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
              Seasonal Solar Scenario:
            </label>
            <select
              value={state.scenario}
              onChange={(e) => setScenario(e.target.value as SolarScenario)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {Object.entries(SOLAR_SCENARIOS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name} ({item.baselineSolarWhPerSol} Wh/sol)
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={resetToBaseline}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
          >
            <span>↺</span>
            <span>Reset to Spirit Baseline</span>
          </button>
        </div>

        {/* Right Panel: Category Navigation & Active Subsystem Inspection */}
        <div className="w-full md:w-96 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 p-4 rounded-xl shadow-2xl space-y-3.5">
          {/* Subsystem Category Tabs */}
          <div>
            <span className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Inspect Rover Subsystems:
            </span>
            <div className="grid grid-cols-4 gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
              {CATEGORIES.map((cat) => {
                const isActive = state.activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "flex flex-col items-center py-2 px-1 rounded-md text-xs font-mono transition-all",
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60",
                    )}
                  >
                    <span className="text-sm mb-0.5">{cat.icon}</span>
                    <span className="text-[11px]">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Subsystem Card */}
          {activeOption && (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                    {activeOption.code}
                  </span>
                  <h3 className="text-sm font-bold text-white">{activeOption.name}</h3>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  FLIGHT HARDWARE
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">{activeOption.subtitle}</p>

              <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-300 space-y-1">
                <div className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-bold shrink-0">✓</span>
                  <span className="leading-tight">{activeOption.verifiedFact}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60">
                <span className="text-zinc-400 font-medium">Ref: </span>
                {activeOption.sourceReference}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
