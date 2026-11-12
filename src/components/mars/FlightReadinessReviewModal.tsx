import React, { useEffect } from "react";
import { builderStore, useBuilder } from "@/lib/builder-store";
import { surfaceStore } from "@/lib/surface-store";
import { COMPONENT_OPTIONS, SIMULATION_MASS_THRESHOLD_KG, SubsystemCategory } from "@/lib/rover-engineering";
import { MISSION_SCENARIOS } from "@/lib/mission-scenarios";
import { cn } from "@/lib/utils";

export const FlightReadinessReviewModal: React.FC = () => {
  const {
    state,
    budget,
    evaluation,
    setReviewOpen,
    setReviewTab,
    resetChallenge,
    setGameMode,
  } = useBuilder();

  // Close on Escape key
  useEffect(() => {
    if (!state.isReviewOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setReviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isReviewOpen, setReviewOpen]);

  if (!state.isReviewOpen) return null;

  const scenario = MISSION_SCENARIOS[state.activeMissionId] ?? MISSION_SCENARIOS.traverse_alpine;
  const currentTab = state.reviewTab;

  // Grade color scheme and styling
  const gradeStyles = {
    A: {
      badge: "border-emerald-500/50 bg-emerald-500/20 text-emerald-300",
      pill: "bg-emerald-500 text-black",
      border: "border-emerald-500/40",
      accent: "text-emerald-400",
      title: "Class A — Optimal Flight Readiness",
      desc: "Exceptional aerospace systems integration. All scenario directives and safety margins are fully satisfied with zero technical penalties.",
    },
    B: {
      badge: "border-cyan-500/50 bg-cyan-500/20 text-cyan-300",
      pill: "bg-cyan-500 text-black",
      border: "border-cyan-500/40",
      accent: "text-cyan-400",
      title: "Class B — Nominal Flight Readiness",
      desc: "Sound engineering design meeting all mission-critical thresholds. Minor operational compromises acceptable under standard flight rules.",
    },
    C: {
      badge: "border-amber-500/50 bg-amber-500/20 text-amber-300",
      pill: "bg-amber-500 text-black",
      border: "border-amber-500/40",
      accent: "text-amber-400",
      title: "Class C — Marginal / Constrained Readiness",
      desc: "Conditional flight approval with narrow safety margins. High risk of operational duty-cycle throttling or mass/energy constraints.",
    },
    F: {
      badge: "border-rose-500/50 bg-rose-500/20 text-rose-300",
      pill: "bg-rose-500 text-white",
      border: "border-rose-500/40",
      accent: "text-rose-400",
      title: "Class F — Critical Deficit / Redesign Required",
      desc: "Flight certification denied. Architecture violates critical safety thresholds (negative daily power margin or severe architectural incompatibilities).",
    },
  }[evaluation.grade];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto font-sans text-zinc-100"
      onClick={() => setReviewOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="frr-modal-title"
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ------------------------------------------------------------- */}
        {/* MODAL HEADER                                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-base font-bold">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-cyan-400 uppercase">
                  NASA / JPL Flight Readiness Board
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {scenario.code}
                </span>
              </div>
              <h2 id="frr-modal-title" className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Mars Exploration Rover · Flight Readiness Review
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setReviewOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-400 hover:text-white transition-colors"
            title="Close Review (Esc)"
            aria-label="Close Review"
          >
            ✕
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB NAVIGATION BAR                                            */}
        {/* ------------------------------------------------------------- */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 px-5 pt-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setReviewTab("readiness")}
            className={cn(
              "px-4 py-2.5 border-b-2 font-semibold transition-all flex items-center gap-2",
              currentTab === "readiness"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40",
            )}
          >
            <span>📊</span>
            <span>Flight Readiness Review</span>
          </button>

          <button
            type="button"
            onClick={() => setReviewTab("debrief")}
            className={cn(
              "px-4 py-2.5 border-b-2 font-semibold transition-all flex items-center gap-2",
              currentTab === "debrief"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40",
            )}
          >
            <span>📋</span>
            <span>Mission Debriefing</span>
          </button>

          <button
            type="button"
            onClick={() => setReviewTab("historical")}
            className={cn(
              "px-4 py-2.5 border-b-2 font-semibold transition-all flex items-center gap-2",
              currentTab === "historical"
                ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40",
            )}
          >
            <span>📜</span>
            <span>Spirit MER-A Comparison</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODAL BODY (SCROLLABLE)                                       */}
        {/* ------------------------------------------------------------- */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* =========================================================== */}
          {/* TAB 1: FLIGHT READINESS REVIEW                              */}
          {/* =========================================================== */}
          {currentTab === "readiness" && (
            <div className="space-y-6">
              {/* Overall Score & Certification Card */}
              <div className={cn("p-4 md:p-5 rounded-xl border bg-zinc-900/50 backdrop-blur-sm", gradeStyles.border)}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl font-black font-mono shadow-inner", gradeStyles.badge)}>
                      {evaluation.grade}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider uppercase", gradeStyles.pill)}>
                          CLASS {evaluation.grade}
                        </span>
                        <span className={cn("text-xs font-mono font-semibold uppercase tracking-wider", evaluation.isApproved ? "text-emerald-400" : "text-rose-400")}>
                          {evaluation.isApproved ? "✓ FLIGHT CERTIFIED · ELIGIBLE FOR MARS LAUNCH" : "⚠️ CERTIFICATION WITHHELD · INELIGIBLE FOR LAUNCH"}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-white mt-1">
                        {gradeStyles.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {gradeStyles.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-zinc-800/60 pt-3 md:pt-0">
                    <span className="text-xs font-mono text-zinc-400">Composite Score</span>
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-3xl font-black font-mono", gradeStyles.accent)}>
                        {evaluation.compositeScore}
                      </span>
                      <span className="text-sm font-mono text-zinc-500">/ 100</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Raw Weighted: {evaluation.rawWeightedScore} · Deductions: -{evaluation.totalDeductions}
                    </span>
                  </div>
                </div>

                {/* Simulation Operations Prediction */}
                <div className="pt-3.5 text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60 mt-3.5">
                  <span className="text-cyan-400 font-bold">FLIGHT DIRECTOR EVALUATION: </span>
                  {evaluation.simulationPrediction}
                </div>
              </div>

              {/* Five Engineering Pillars Scoring Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                    <span>⚙️</span>
                    <span>Systems Engineering Pillars (Multi-Attribute Utility Analysis)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Single Source of Truth: mission-evaluation.ts
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(evaluation.pillars).map(([key, pillar]) => {
                    const statusColor = {
                      optimal: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                      nominal: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
                      marginal: "text-amber-400 bg-amber-500/10 border-amber-500/30",
                      critical: "text-rose-400 bg-rose-500/10 border-rose-500/30",
                    }[pillar.status];

                    const barColor = {
                      optimal: "bg-emerald-400",
                      nominal: "bg-cyan-400",
                      marginal: "bg-amber-400",
                      critical: "bg-rose-500",
                    }[pillar.status];

                    return (
                      <div
                        key={key}
                        className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="font-semibold text-white">{pillar.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={cn("px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border", statusColor)}>
                                {pillar.status}
                              </span>
                              <span className="font-bold text-white">
                                {pillar.score}
                                <span className="text-[10px] font-normal text-zinc-400">/100</span>
                              </span>
                            </div>
                          </div>

                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-300", barColor)} style={{ width: `${pillar.score}%` }} />
                          </div>

                          <p className="text-[11px] text-zinc-300 font-mono mt-2 leading-tight">
                            {pillar.details}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-zinc-800/60 flex justify-between text-[10px] font-mono text-zinc-400">
                          <span>Scenario Weight: {Math.round(pillar.weight * 100)}%</span>
                          <span>Weighted Contribution: +{pillar.weightedScore} pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deductions & Compatibility Penalties */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Architectural Interface & Compatibility Deductions</span>
                </h4>

                {evaluation.deductions.length > 0 ? (
                  <div className="space-y-2">
                    {evaluation.deductions.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/60 text-rose-200 text-xs font-mono space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wide text-rose-300">
                            [{d.category}] {d.reason}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                            -{d.penalty} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 pt-0.5">
                          <strong className="text-zinc-400 font-normal">Engineering Directive: </strong>
                          {d.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Zero architectural interface conflicts or system compatibility penalties detected.</span>
                  </div>
                )}
              </div>

              {/* Mass & Power Engineering Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Spacecraft Launch Mass:</span>
                    <span className="font-bold text-white">{budget.totalMassKg.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Baseline Delta:</span>
                    <span className={budget.massDeltaKg > 0 ? "text-amber-400" : "text-emerald-400"}>
                      {budget.massDeltaKg > 0 ? `+${budget.massDeltaKg.toFixed(1)}` : budget.massDeltaKg.toFixed(1)} kg
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Simulation Threshold Margin:</span>
                    <span className={budget.isOverMassThreshold ? "text-rose-400 font-bold" : "text-emerald-400"}>
                      {(SIMULATION_MASS_THRESHOLD_KG - budget.totalMassKg).toFixed(1)} kg remaining
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Daily Generation ({scenario.code}):</span>
                    <span className="font-bold text-cyan-400">{budget.powerGenWhPerSol} Wh/sol</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Total Daily Consumption:</span>
                    <span>{budget.dailyConsumptionWhPerSol} Wh/sol</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Net Energy Balance:</span>
                    <span className={cn("font-bold", budget.netEnergyMarginWhPerSol >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {budget.netEnergyMarginWhPerSol >= 0 ? `+${budget.netEnergyMarginWhPerSol}` : budget.netEnergyMarginWhPerSol} Wh/sol
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================== */}
          {/* TAB 2: MISSION DEBRIEFING                                   */}
          {/* =========================================================== */}
          {currentTab === "debrief" && (
            <div className="space-y-6">
              {/* Mission Scenario Overview */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      MISSION SCENARIO · {scenario.code}
                    </span>
                    <h3 className="text-base font-bold text-white">{scenario.title}</h3>
                    <p className="text-xs text-zinc-400">{scenario.subtitle}</p>
                  </div>
                  <div className="text-right text-xs font-mono text-zinc-400">
                    <div>{scenario.location}</div>
                    <div className="text-cyan-400 font-semibold">{scenario.solWindow}</div>
                  </div>
                </div>

                {/* Environmental Conditions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block uppercase">Insolation</span>
                    <span className="font-bold text-white">{scenario.environment.solarInsolationWhPerSol} Wh/sol</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block uppercase">Dust Opacity</span>
                    <span className="font-bold text-white">τ = {scenario.environment.opticalDepthTau}</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block uppercase">Max Slope</span>
                    <span className="font-bold text-white">{scenario.environment.maxTerrainSlopeDeg}°</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-850">
                    <span className="text-[10px] text-zinc-500 block uppercase">Night Temp</span>
                    <span className="font-bold text-cyan-400">{scenario.environment.nightTempC} °C</span>
                  </div>
                </div>
              </div>

              {/* Configured Subsystems Hardware Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span>🛠️</span>
                  <span>Configured Spacecraft Hardware Breakdown (4 / 4 Objectives Completed)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {(["mobility", "power", "science", "telecom"] as SubsystemCategory[]).map((cat) => {
                    const optId = state.selected[cat];
                    const opt = COMPONENT_OPTIONS[optId];
                    if (!opt) return null;

                    const catTitle = {
                      mobility: "⚙️ Mobility & Locomotion",
                      power: "☀️ Power & Energy Generation",
                      science: "🔬 Science Payload & Remote Sensing",
                      telecom: "📡 Telecommunications & Relay",
                    }[cat];

                    return (
                      <div key={cat} className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                          <span className="text-zinc-400 font-semibold text-[11px]">{catTitle}</span>
                          <span className="text-[10px] text-emerald-400 font-bold">✓ VERIFIED</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold">{opt.name}</span>
                            <span className="text-[10px] text-zinc-400">{opt.id}</span>
                          </div>
                          <p className="text-[11px] text-zinc-300 font-sans mt-0.5">{opt.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-zinc-400 border-t border-zinc-800/40">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                            Mass: {opt.massDeltaKg > 0 ? `+${opt.massDeltaKg}` : opt.massDeltaKg} kg
                          </span>
                          {opt.powerDrawWatts > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                              Draw: {opt.powerDrawWatts} W
                            </span>
                          )}
                          {opt.powerGenWhPerSol > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                              Gen: {opt.powerGenWhPerSol} Wh/sol
                            </span>
                          )}
                          {opt.obstacleCapabilityCm > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                              Wheel: {opt.obstacleCapabilityCm} cm Ø
                            </span>
                          )}
                          {opt.telecomRates && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                              DTE: {opt.telecomRates.directToEarthKbps} kbps
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths, Limitations & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Mission Architecture Strengths</span>
                  </h4>
                  {evaluation.strengths.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
                      {evaluation.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">▸</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-500 font-mono">No standout advantages recorded over baseline.</p>
                  )}
                </div>

                {/* Critical Engineering Limitations */}
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Engineering Bottlenecks & Hazards</span>
                  </h4>
                  {evaluation.weaknesses.length > 0 ? (
                    <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
                      {evaluation.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">▸</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-400 font-mono">Zero critical architectural bottlenecks identified.</p>
                  )}
                </div>
              </div>

              {/* Engineering Directives */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs font-mono space-y-2">
                <h4 className="text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Recommended Improvements for Next Iteration</span>
                </h4>
                {evaluation.directives.length > 0 ? (
                  <ul className="space-y-1.5 text-zinc-300">
                    {evaluation.directives.map((dir, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">▸</span>
                        <span>{dir}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-400">Current rover configuration matches optimal flight criteria for this scenario.</p>
                )}
              </div>
            </div>
          )}

          {/* =========================================================== */}
          {/* TAB 3: SPIRIT MER-A HISTORICAL BENCHMARK                   */}
          {/* =========================================================== */}
          {currentTab === "historical" && (
            <div className="space-y-6">
              {/* NASA Mission Endpoint & Summary Banner */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                    [VERIFIED NASA RECORD]
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    NASA JPL Mars Exploration Rover A (MER-A) · Official Mission Record
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Spirit MER-A: 2,210 Sols Across Gusev Crater & Columbia Hills
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  Designed for an initial 90-sol primary mission, Spirit explored Mars for <strong>2,210 sols</strong> (over 6 years)
                  and traveled <strong>7.73 km</strong> across the Gusev crater floor and into the Columbia Hills. In April 2009 (Sol 1870),
                  its wheels broke through an iron-oxide crust into concealed, powder-fine sulfate sand at &quot;Troy&quot;.
                  Unable to extricate itself or orient its solar panels during the subsequent harsh Martian winter,
                  Spirit went silent on <strong>March 22, 2010 (Sol 2210)</strong>. NASA concluded communication recovery efforts on <strong>May 25, 2011</strong>.
                </p>
                <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800 pt-2">
                  Primary Sources: NASA/JPL MER Landing Press Kit (2004); R. E. Arvidson et al., J. Geophys. Res. (2008);
                  P. Stella et al., IEEE Photovoltaic Specialists Conf. (2005).
                </div>
              </div>

              {/* Comparative Head-to-Head Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span>⚖️</span>
                  <span>Head-to-Head Comparison: Spirit Flight Baseline vs Your Rover Configuration</span>
                </h4>

                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Subsystem / Metric</th>
                        <th className="py-2.5 px-3 text-cyan-400">Spirit Flight Baseline (2004)</th>
                        <th className="py-2.5 px-3 text-white">Your Configured Rover</th>
                        <th className="py-2.5 px-3">Analysis / Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/60 text-zinc-300">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-400">Total Launch Mass</td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300">174.0 kg</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white">{budget.totalMassKg.toFixed(1)} kg</td>
                        <td className="py-2.5 px-3 text-[11px] text-zinc-400">
                          {budget.isOverMassThreshold
                            ? "⚠️ Exceeds 205.0 kg threshold"
                            : budget.massDeltaKg === 0
                            ? "Exact 174.0 kg match"
                            : `+${budget.massDeltaKg.toFixed(1)} kg payload trade-off`}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-400">Locomotion Hardware</td>
                        <td className="py-2.5 px-3">25 cm Ø Spiral Cleated Wheels</td>
                        <td className="py-2.5 px-3 font-bold text-white">{COMPONENT_OPTIONS[state.selected.mobility]?.name}</td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {state.selected.mobility === "wheels_standard" ? (
                            <span className="text-amber-400">[VERIFIED] Risked sinkage at Troy</span>
                          ) : (
                            <span className="text-emerald-400">[EXTRAPOLATED] High sand flotation</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-400">Power Architecture</td>
                        <td className="py-2.5 px-3">1.30 m² GaAs Solar Array (900 Wh/sol)</td>
                        <td className="py-2.5 px-3 font-bold text-white">{COMPONENT_OPTIONS[state.selected.power]?.name}</td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {state.selected.power === "power_mmrtg" ? (
                            <span className="text-emerald-400">[EXTRAPOLATED] Continuous power; survives winter</span>
                          ) : state.selected.power === "power_solar_extended" ? (
                            <span className="text-cyan-400">[EXTRAPOLATED] 1,215 Wh/sol summer peak</span>
                          ) : (
                            <span className="text-zinc-400">[VERIFIED] Vulnerable to winter dust deposition</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-400">Science Payload</td>
                        <td className="py-2.5 px-3">Athena 5-Instrument Contact Suite</td>
                        <td className="py-2.5 px-3 font-bold text-white">{COMPONENT_OPTIONS[state.selected.science]?.name}</td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {state.selected.science === "science_athena_baseline" ? (
                            <span className="text-cyan-400">[VERIFIED] 2,000+ rock contacts</span>
                          ) : (
                            <span className="text-emerald-400">[EXTRAPOLATED] Subsurface depth sounding</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-zinc-400">Telecommunications</td>
                        <td className="py-2.5 px-3">0.28m Steerable Flat-Panel Dish (28.8 kbps)</td>
                        <td className="py-2.5 px-3 font-bold text-white">{COMPONENT_OPTIONS[state.selected.telecom]?.name}</td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {state.selected.telecom === "telecom_phased_array" ? (
                            <span className="text-emerald-400">[EDUCATIONAL] Solid-state zero gimbals</span>
                          ) : (
                            <span className="text-zinc-400">[VERIFIED] Direct-to-Earth X-Band link</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rigorous Taxonomy & Educational Disclaimer */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                  <span>📖</span>
                  <span>Engineering Methodology & Taxonomy Clarification</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase block w-fit">
                      [VERIFIED NASA RECORD]
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans leading-tight">
                      Historical MER-A specifications, launch limits (174.0 kg press kit benchmark), and operational events (Husband Hill, Troy entrapment, Sol 2210 loss of signal).
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase block w-fit">
                      [EXTRAPOLATED ENGINEERING]
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans leading-tight">
                      NASA-researched engineering concepts (SMA shape-memory mesh tires, extended folding solar wings, MMRTG radioisotope power) evaluated in JPL/Glenn trade studies.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase block w-fit">
                      [EDUCATIONAL SIMULATION]
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans leading-tight">
                      Mathematical scoring models, multi-attribute utility formulas, and parametric trade evaluations used to teach aerospace engineering principles.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 font-mono leading-relaxed">
                  <strong className="text-zinc-300">DISCLAIMER: </strong>
                  Simulated mission outcomes and composite scores are educational models based on published engineering parameters.
                  They do not constitute actual NASA mission operations data.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODAL FOOTER ACTIONS                                          */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-zinc-800/80 bg-zinc-900/80 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setReviewOpen(false);
              }}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors flex items-center gap-1.5 border border-zinc-700"
            >
              <span>←</span>
              <span>Modify Hardware in Workshop</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetChallenge();
                setReviewOpen(false);
              }}
              className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800"
              title="Reset challenge hardware to baseline"
            >
              <span>↺</span>
              <span className="hidden sm:inline">Replay / Reset Mission</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setGameMode("sandbox");
                setReviewOpen(false);
              }}
              className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-800/50"
            >
              <span>🛠️</span>
              <span>Exit to Sandbox Studio</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReviewOpen(false);
                builderStore.setOpen(false);
                surfaceStore.deployRover();
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold transition-all shadow-md flex items-center gap-1.5"
              title="Deploy configured rover to Mars surface exploration environment"
            >
              <span>🚀</span>
              <span>Deploy to Mars Surface</span>
            </button>

            <button
              type="button"
              onClick={() => setReviewOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold transition-colors border border-zinc-700"
            >
              Close Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
