import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { CHALLENGE_STEPS, useBuilder } from "@/lib/builder-store";
import { surfaceStore } from "@/lib/surface-store";
import {
  getComponentRecommendation,
} from "@/lib/mission-evaluation";
import { MISSION_SCENARIOS } from "@/lib/mission-scenarios";
import {
  COMPONENT_OPTIONS,
  SIMULATION_MASS_THRESHOLD_KG,
  SOLAR_SCENARIOS,
  SolarScenario,
  SubsystemCategory,
} from "@/lib/rover-engineering";
import { MissionBriefingModal } from "./MissionBriefingModal";
import { FlightReadinessReviewModal } from "./FlightReadinessReviewModal";

interface SubsystemTab {
  id: SubsystemCategory;
  label: string;
  icon: string;
  stepNum: number;
}

const CATEGORIES: SubsystemTab[] = [
  { id: "mobility", label: "Mobility", icon: "⚙️", stepNum: 1 },
  { id: "power", label: "Power", icon: "☀️", stepNum: 2 },
  { id: "science", label: "Science", icon: "🔬", stepNum: 3 },
  { id: "telecom", label: "Telecom", icon: "📡", stepNum: 4 },
];

export function WorkshopOverlay() {
  const {
    state,
    budget,
    evaluation,
    completedCount,
    progressPercent,
    setOpen,
    setActiveCategory,
    setScenario,
    selectOption,
    toggleAutoSpin,
    zoomIn,
    zoomOut,
    resetView,
    resetToBaseline,
    // Challenge actions
    setGameMode,
    setBriefingOpen,
    setReviewOpen,
    setChallengeStep,
    nextChallengeStep,
    prevChallengeStep,
    resetChallenge,
  } = useBuilder();

  const isChallenge = state.gameMode === "challenge";
  const activeScenario =
    MISSION_SCENARIOS[state.activeMissionId] ?? MISSION_SCENARIOS.traverse_alpine;

  const activeOption = COMPONENT_OPTIONS[state.selected[state.activeCategory]];
  const categoryOptions = Object.values(COMPONENT_OPTIONS).filter(
    (opt) => opt.category === state.activeCategory,
  );

  const isBaseline =
    state.selected.mobility === "wheels_standard" &&
    state.selected.power === "power_solar_baseline" &&
    state.selected.science === "science_athena_baseline" &&
    state.selected.telecom === "telecom_hga_dish";

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
  const massPct = Math.min(
    100,
    Math.round((budget.totalMassKg / SIMULATION_MASS_THRESHOLD_KG) * 100),
  );
  const currentDeg = Math.round((((state.turntableAngle * 180) / Math.PI) % 360 + 360) % 360);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-3 md:p-6 select-none font-sans text-zinc-100">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & MISSION CONTROL BAR                              */}
      {/* ------------------------------------------------------------- */}
      <header className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 px-4 py-3 rounded-xl shadow-2xl max-w-7xl mx-auto w-full">
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
              Spirit MER-A Interactive Workshop
              <span className="text-xs font-normal text-zinc-400 hidden sm:inline">
                {isChallenge ? "· Mission Challenge" : "· Sandbox Studio"}
              </span>
            </h1>
          </div>
        </div>

        {/* Operational Mode Switcher */}
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setGameMode("sandbox")}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5",
              !isChallenge
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60",
            )}
          >
            <span>🛠️</span>
            <span>Sandbox</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setGameMode("challenge");
              if (completedCount === 0) {
                setBriefingOpen(true);
              }
            }}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5",
              isChallenge
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60",
            )}
          >
            <span>🚀</span>
            <span>Mission Challenge</span>
          </button>

          {isChallenge && (
            <>
              <button
                type="button"
                onClick={() => setBriefingOpen(true)}
                className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700 transition-colors flex items-center gap-1"
                title="View Mission Directives"
              >
                <span>📋</span>
                <span className="hidden md:inline">Briefing</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                disabled={completedCount < 4}
                className={cn(
                  "px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 font-mono text-xs",
                  completedCount === 4
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 font-bold animate-pulse"
                    : "bg-zinc-800/60 text-zinc-500 border border-zinc-800 opacity-60 cursor-not-allowed",
                )}
                title={
                  completedCount === 4
                    ? "Conduct Flight Readiness Review"
                    : "Complete all 4 subsystem objectives to unlock review"
                }
              >
                <span>📊</span>
                <span className="hidden md:inline">Review ({completedCount}/4)</span>
              </button>
            </>
          )}
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

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              surfaceStore.deployRover();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/80 hover:bg-orange-900 border border-orange-500/50 text-xs font-mono text-orange-300 hover:text-white transition-colors"
            title="Deploy to Mars Surface Operations"
          >
            <span>🪐</span>
            <span className="hidden sm:inline">Mars Surface</span>
          </button>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
            title="Return to Story (Esc)"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Return to Story</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE DRAG HINT BADGE (BOTTOM CENTER)                    */}
      {/* ------------------------------------------------------------- */}
      <div className="pointer-events-none hidden md:flex justify-center w-full my-auto">
        <div className="bg-zinc-950/70 border border-zinc-800/60 px-3.5 py-1.5 rounded-full text-[11px] font-mono text-zinc-400 tracking-wide backdrop-blur-sm shadow-lg flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            {isChallenge
              ? `MISSION CHALLENGE: ${activeScenario.title.toUpperCase()} · STEP ${state.challengeStep + 1} OF 4`
              : "DRAG ROVER TO SPIN TURNTABLE · SELECT HARDWARE TO RECONFIGURE"}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN WORKSHOP DOCK: LATERAL (DESKTOP) / BOTTOM SHEET (MOBILE)  */}
      {/* ------------------------------------------------------------- */}
      <div className="pointer-events-auto flex flex-col md:flex-row gap-4 justify-between items-end max-w-7xl mx-auto w-full">
        {/* Left Telemetry Panel: Engineering Budget & Scenario */}
        <div className="w-full md:w-80 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 p-4 rounded-xl shadow-2xl space-y-3.5">
          {/* Header & Mode Badge */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              {isChallenge ? "Mission Directives" : "Telemetry Summary"}
            </span>
            <span
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-semibold",
                isChallenge
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  : isBaseline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30",
              )}
            >
              {isChallenge ? activeScenario.code : isBaseline ? "HISTORICAL BASELINE" : "MODIFIED CONFIG"}
            </span>
          </div>

          {/* In Challenge Mode: Mission Progress Bar */}
          {isChallenge && (
            <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Assembly Progress:</span>
                <span className="font-bold text-cyan-400">
                  {completedCount} / 4 Objectives ({progressPercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono pt-1">
                <span className="text-zinc-400">Current Rating:</span>
                <span
                  className={cn(
                    "font-bold",
                    evaluation.grade === "A"
                      ? "text-emerald-400"
                      : evaluation.grade === "B"
                      ? "text-cyan-400"
                      : evaluation.grade === "C"
                      ? "text-amber-400"
                      : "text-rose-400",
                  )}
                >
                  Score: {evaluation.compositeScore}/100 (Class {evaluation.grade})
                </span>
              </div>

              {completedCount === 4 && (
                <button
                  type="button"
                  onClick={() => setReviewOpen(true)}
                  className="w-full mt-2 py-1.5 px-2.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-mono text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 animate-pulse"
                >
                  <span>📊</span>
                  <span>Conduct Flight Review ➔</span>
                </button>
              )}
            </div>
          )}

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
                className={cn(
                  "h-full transition-all duration-300",
                  budget.isOverMassThreshold ? "bg-rose-500" : "bg-cyan-400",
                )}
                style={{ width: `${massPct}%` }}
              />
            </div>
            {budget.isOverMassThreshold && (
              <p className="text-[10px] font-mono text-rose-400 mt-1 font-semibold">
                ⚠️ Exceeds 205.0 kg Simulation Mass Threshold!
              </p>
            )}
          </div>

          {/* Electrical Daily Energy Balance */}
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Generation ({isChallenge ? activeScenario.code : "Solar"}):</span>
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

          {/* Sandbox: Seasonal Scenario Selector */}
          {!isChallenge ? (
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
          ) : (
            <div className="text-[11px] font-mono p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
              <div className="text-zinc-500 uppercase text-[10px]">Environment:</div>
              <div>{activeScenario.location}</div>
              <div className="text-zinc-400">τ = {activeScenario.environment.opticalDepthTau} · {activeScenario.environment.nightTempC}°C night</div>
            </div>
          )}

          {/* Active Compatibility Warnings */}
          {budget.compatibilityWarnings.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-zinc-800">
              {budget.compatibilityWarnings.map((warn, i) => (
                <div
                  key={i}
                  className="text-[10px] font-mono p-2 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 leading-tight"
                >
                  {warn}
                </div>
              ))}
            </div>
          )}

          {/* Reset buttons */}
          {isChallenge ? (
            <button
              type="button"
              onClick={resetChallenge}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
            >
              <span>↺</span>
              <span>Reset Challenge Hardware</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={resetToBaseline}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
            >
              <span>↺</span>
              <span>Reset to Spirit Baseline</span>
            </button>
          )}
        </div>

        {/* Right Panel: Stepper & Interactive Hardware Options */}
        <div className="w-full md:w-[440px] bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 p-4 rounded-xl shadow-2xl space-y-3">
          {/* Header & Subsystem Stepper */}
          {isChallenge ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="uppercase tracking-wider text-zinc-400">
                  Assembly Objective:
                </span>
                <span className="text-cyan-400 font-semibold">
                  Step {state.challengeStep + 1} of 4 · {state.activeCategory.toUpperCase()}
                </span>
              </div>

              {/* 4-Step Interactive Stepper Pipeline */}
              <div className="grid grid-cols-4 gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
                {CATEGORIES.map((cat, idx) => {
                  const isActive = state.challengeStep === idx;
                  const isDone = state.completedObjectives[cat.id];

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setChallengeStep(idx)}
                      className={cn(
                        "flex flex-col items-center py-2 px-1 rounded-md text-xs font-mono transition-all",
                        isActive
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm"
                          : isDone
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                      )}
                    >
                      <div className="flex items-center gap-1 text-[11px]">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-[9px] mt-0.5">
                        {isDone ? "✓ DONE" : isActive ? "ACTIVE" : `STEP ${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Contextual Subsystem Objective Guidance Banner */}
              <div className="text-[11px] font-mono p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-300 flex items-start gap-2">
                <span className="text-cyan-400 font-bold mt-0.5">▸</span>
                <div>
                  <span className="font-semibold text-white">
                    {state.activeCategory === "mobility" && "Mobility Objective: "}
                    {state.activeCategory === "power" && "Power Architecture Objective: "}
                    {state.activeCategory === "science" && "Science Payload Objective: "}
                    {state.activeCategory === "telecom" && "Telecommunications Objective: "}
                  </span>
                  <span>
                    {state.activeCategory === "mobility" &&
                      `Equip locomotion architecture capable of clearing ≥ ${activeScenario.demands.minObstacleCapabilityCm} cm obstacles${
                        activeScenario.demands.flotationRequired ? " with high sand flotation." : "."
                      }`}
                    {state.activeCategory === "power" &&
                      `Ensure power subsystem sustains baseline operations and yields ≥ +${activeScenario.demands.minEnergyMarginWhPerSol} Wh/sol net margin.`}
                    {state.activeCategory === "science" &&
                      `Select instrumentation aligned with ${activeScenario.demands.primaryScienceDisciplines.join(" and ")} priorities.`}
                    {state.activeCategory === "telecom" &&
                      `Provision communications subsystem delivering ≥ ${activeScenario.demands.minDownlinkKbps} kbps direct-to-Earth telemetry.`}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Sandbox Mode: Standard Category Switcher
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Configure Subsystems:
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Category: <strong className="uppercase">{state.activeCategory}</strong>
                </span>
              </div>
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
          )}

          {/* Subsystem Hardware Option Cards */}
          <div className="space-y-2.5 max-h-[42vh] md:max-h-[44vh] overflow-y-auto pr-1">
            {categoryOptions.map((opt) => {
              const isInstalled = state.selected[state.activeCategory] === opt.id;
              const isFlight = opt.authenticity === "SPIRIT FLIGHT HARDWARE";
              const isFictional = opt.authenticity === "FICTIONAL SIMULATION";

              // In Challenge Mode, compute dynamic contextual recommendation
              const recommendation = isChallenge
                ? getComponentRecommendation(
                    state.activeMissionId,
                    state.activeCategory,
                    opt.id,
                    state.selected,
                  )
                : null;

              return (
                <div
                  key={opt.id}
                  className={cn(
                    "rounded-lg p-3 transition-all border",
                    isInstalled
                      ? "bg-zinc-900/95 border-cyan-500/60 shadow-lg shadow-cyan-950/30"
                      : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700",
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                          {opt.code}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider font-semibold",
                            isFlight
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isFictional
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30",
                          )}
                        >
                          {opt.authenticity}
                        </span>

                        {/* Contextual Recommendation Badge (Challenge Mode) */}
                        {recommendation && (
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider font-bold",
                              recommendation.className,
                            )}
                          >
                            {recommendation.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs md:text-sm font-bold text-white leading-snug mt-0.5">
                        {opt.name}
                      </h3>
                    </div>

                    {isInstalled ? (
                      <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span>✓</span>
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => selectOption(state.activeCategory, opt.id)}
                        className="shrink-0 flex items-center gap-1 px-3 py-1 rounded text-[10px] font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all hover:scale-105 active:scale-95"
                      >
                        <span>🛠️</span>
                        <span>Install</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug mb-2">{opt.subtitle}</p>

                  {/* Contextual Recommendation Explanation (Challenge Mode) */}
                  {recommendation && (
                    <div className="mb-2 p-1.5 rounded bg-zinc-950/60 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                      <span className="text-cyan-400 font-semibold">Assessment: </span>
                      <span>{recommendation.reason}</span>
                    </div>
                  )}

                  {/* Hardware Specification Pills */}
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      Mass: {opt.massDeltaKg === 0 ? "174.0 kg (0 kg)" : `+${opt.massDeltaKg.toFixed(1)} kg`}
                    </span>
                    {opt.category === "power" ? (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-semibold">
                        {opt.id === "power_solar_baseline" && "900 Wh/sol peak"}
                        {opt.id === "power_solar_extended" && "1,215 Wh/sol peak"}
                        {opt.id === "power_mmrtg" && "2,711 Wh/sol continuous"}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        Power: {opt.powerDrawWatts > 0 ? `${opt.powerDrawWatts} W draw` : "0 W"}
                      </span>
                    )}
                    {opt.obstacleCapabilityCm > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        Wheel: {opt.obstacleCapabilityCm} cm Ø
                      </span>
                    )}
                    {opt.telecomRates && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        DTE: {opt.telecomRates.directToEarthKbps} kbps
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Challenge Stepper Navigation Buttons */}
          {isChallenge && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800 text-xs font-mono">
              <button
                type="button"
                disabled={state.challengeStep === 0}
                onClick={prevChallengeStep}
                className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 border border-zinc-700 text-zinc-300 transition-colors"
              >
                ← Prev Subsystem
              </button>

              {state.challengeStep === CHALLENGE_STEPS.length - 1 ? (
                <button
                  type="button"
                  disabled={completedCount < 4}
                  onClick={() => setReviewOpen(true)}
                  className={cn(
                    "px-3.5 py-1.5 rounded font-semibold transition-all flex items-center gap-1.5",
                    completedCount === 4
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 animate-pulse"
                      : "bg-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed",
                  )}
                  title={completedCount === 4 ? "Conduct Flight Readiness Review" : "Configure all 4 subsystems first"}
                >
                  <span>📊</span>
                  <span>Flight Review ➔</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextChallengeStep}
                  className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
                >
                  Next Subsystem →
                </button>
              )}
            </div>
          )}

          {/* Active Installed Hardware Fact & Citation */}
          {activeOption && (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-2.5 text-[11px] text-zinc-300 space-y-1">
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold shrink-0">✓</span>
                <span className="leading-tight">{activeOption.verifiedFact}</span>
              </div>
              <div className="pt-1.5 text-[10px] font-mono text-zinc-500 border-t border-zinc-800/60">
                <span className="text-zinc-400 font-medium">Ref: </span>
                {activeOption.sourceReference}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <MissionBriefingModal />
      <FlightReadinessReviewModal />
    </div>
  );
}
