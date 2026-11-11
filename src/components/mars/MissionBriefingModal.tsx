import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBuilder } from "@/lib/builder-store";
import {
  MissionId,
  MISSION_LIST,
  MISSION_SCENARIOS,
  MissionScenario,
} from "@/lib/mission-scenarios";
import { COMPONENT_OPTIONS } from "@/lib/rover-engineering";

export function MissionBriefingModal() {
  const { state, setBriefingOpen, startChallenge } = useBuilder();
  const [selectedMissionId, setSelectedMissionId] = useState<MissionId>(
    state.activeMissionId || "traverse_alpine",
  );

  if (!state.isBriefingOpen) return null;

  const currentScenario: MissionScenario =
    MISSION_SCENARIOS[selectedMissionId] ?? MISSION_SCENARIOS.traverse_alpine;

  const handleStartMission = () => {
    startChallenge(selectedMissionId);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-3 md:p-6 bg-zinc-950/80 backdrop-blur-md font-sans text-zinc-100 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-base font-bold">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold tracking-wider text-cyan-400 uppercase">
                  NASA / JPL Mission Operations Directorate
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                  FLIGHT BRIEFING
                </span>
              </div>
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Mars Exploration Rover · Systems Assembly Challenge
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBriefingOpen(false)}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors font-mono text-sm"
            aria-label="Close Briefing"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Two-column layout (Scenario Selector + Detailed Briefing) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scenario Selector Tabs */}
          <div className="lg:col-span-4 space-y-2.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 px-1">
              Select Mission Scenario
            </h3>
            <div className="space-y-2">
              {MISSION_LIST.map((scen) => {
                const isSelected = scen.id === selectedMissionId;
                const isBaseline = scen.id === "spirit_baseline";
                return (
                  <button
                    key={scen.id}
                    type="button"
                    onClick={() => setSelectedMissionId(scen.id)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all text-xs font-mono",
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-950/20 text-white"
                        : "bg-zinc-950/40 border-zinc-800 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold tracking-wider text-cyan-400">
                        {scen.code}
                      </span>
                      {isBaseline ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          REFERENCE
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          CHALLENGE
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-zinc-100 leading-snug">
                      {scen.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                      {scen.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Mission Dossier */}
          <div className="lg:col-span-8 space-y-4">
            {/* Title & Location Header */}
            <div className="bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {currentScenario.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {currentScenario.location} · {currentScenario.solWindow}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                  {currentScenario.code}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {currentScenario.historicalContext}
              </p>
            </div>

            {/* Environmental Conditions Matrix */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Martian Environmental Profile
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-zinc-950/40 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="text-[10px] text-zinc-500 uppercase">Insolation</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">
                    {currentScenario.environment.solarInsolationWhPerSol} Wh/sol
                  </div>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="text-[10px] text-zinc-500 uppercase">Dust Opacity</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    τ = {currentScenario.environment.opticalDepthTau}
                  </div>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="text-[10px] text-zinc-500 uppercase">Max Slope</div>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">
                    {currentScenario.environment.maxTerrainSlopeDeg}°
                  </div>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="text-[10px] text-zinc-500 uppercase">Night Low</div>
                  <div className="text-sm font-bold text-sky-400 mt-0.5">
                    {currentScenario.environment.nightTempC} °C
                  </div>
                </div>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-1.5">
                Surface: {currentScenario.environment.surfaceMaterial}
              </p>
            </div>

            {/* Engineering Demands & Directives */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Flight Operations Directives
              </h4>
              <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
                {currentScenario.briefingDirectives.map((directive, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">▸</span>
                    <span>{directive}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Hardware Suite */}
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Scenario-Recommended Hardware Suite
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {currentScenario.recommendedComponentIds.map((optId) => {
                  const opt = COMPONENT_OPTIONS[optId];
                  if (!opt) return null;
                  return (
                    <span
                      key={optId}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-950/60 border border-cyan-500/30 text-cyan-300"
                    >
                      {opt.name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Historical NASA Citation */}
            <div className="p-3 bg-zinc-950/30 border border-zinc-800/80 rounded-lg text-[11px] text-zinc-400 space-y-1">
              <p>
                <strong className="text-zinc-300">Verified NASA Fact:</strong>{" "}
                {currentScenario.verifiedFact}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                Ref: {currentScenario.sourceReference}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4 bg-zinc-950/60">
          <div className="text-xs font-mono text-zinc-400 hidden sm:block">
            Target Rover Mass:{" "}
            <span className="text-white font-bold">
              ≤ {currentScenario.demands.targetRoverMassKg.toFixed(1)} kg
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => setBriefingOpen(false)}
              className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartMission}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono font-bold text-xs tracking-wider transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <span>🚀</span>
              <span>START MISSION CHALLENGE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
