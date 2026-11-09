import { useEffect, useRef, useState } from "react";
import {
  INSPECTION_SUBSYSTEMS,
  ORDERED_SUBSYSTEM_IDS,
  inspectionStore,
  useInspection,
} from "@/lib/inspection-store";
import { ensureGsap, scrollToId } from "./scroll";

export function ExplodedOverlay({
  activePartId: _propActivePartId,
}: {
  activePartId?: string | null | undefined;
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"assembled" | "separating" | "exploded">("assembled");
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const { inspectedPartId, isInspecting } = useInspection();

  useEffect(() => {
    const { ScrollTrigger } = ensureGsap();
    const update = (p: number) => {
      setProgress(p);
      if (p < 0.2) setPhase("assembled");
      else if (p < 0.75) setPhase("separating");
      else setPhase("exploded");

      if (pctRef.current) {
        pctRef.current.textContent = `${Math.min(100, Math.round(p * 100))
          .toString()
          .padStart(3, "0")}%`;
      }
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${p})`;
      }
    };

    const st = ScrollTrigger.create({
      trigger: "#exploded",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => update(s.progress),
      onRefresh: (s) => update(s.progress),
    });

    return () => st.kill();
  }, []);

  // Keyboard navigation for inspection mode (guarded against form inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;

      if (e.key === "Escape") {
        inspectionStore.close();
      } else if (e.key === "ArrowRight") {
        if (inspectionStore.get().isInspecting) {
          inspectionStore.nextSubsystem();
        }
      } else if (e.key === "ArrowLeft") {
        if (inspectionStore.get().isInspecting) {
          inspectionStore.prevSubsystem();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeSubsystem = inspectedPartId ? INSPECTION_SUBSYSTEMS[inspectedPartId] : null;

  return (
    <section id="exploded" className="relative h-[360vh]" aria-label="Exploded rover technical view">
      <div className="sticky top-0 flex h-screen flex-col justify-between overflow-hidden p-4 pt-16 pointer-events-none md:p-10 md:pt-10">
        {/* Top Blueprint Telemetry Header */}
        <div className="flex items-start justify-between">
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-primary shadow-glow animate-pulse" />
              <p className="hud-label text-primary">00 · Technical Teardown</p>
            </div>
            <h2 className="display-title mt-1 text-sm text-foreground md:text-base">
              Spirit MER-A <span className="text-muted-foreground">· Exploded Blueprint</span>
            </h2>
            <p className="font-mono text-[0.62rem] text-muted-foreground mt-0.5">
              NASA JPL Flight Unit 1 · 15 Disassembled Subsystems
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 text-right">
            <div className="hud-panel rounded-sm px-3 py-1.5">
              <p className="hud-label text-foreground">
                Teardown: <span ref={pctRef} className="font-mono text-primary">000%</span>
              </p>
            </div>
            <p className="font-mono text-[0.58rem] tracking-widest text-silver uppercase">
              {phase === "assembled"
                ? "State: Assembled Flight Hardware"
                : phase === "separating"
                  ? "State: Subsystem Separation"
                  : "State: Full Technical Teardown"}
            </p>
          </div>
        </div>

        {/* Technical Component Inspection Drawer or Prompt Card */}
        {isInspecting && activeSubsystem ? (
          <div className="pointer-events-auto fixed inset-x-3 bottom-3 z-30 max-h-[50vh] overflow-y-auto rounded-lg border border-primary/40 bg-void/90 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-300 md:static md:mx-0 md:my-auto md:max-h-[72vh] md:w-full md:max-w-lg md:rounded-sm md:border-border md:p-6 md:slide-in-from-left-4">
            {/* Drawer Header & Exit Controls */}
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-xs bg-primary/20 px-2 py-0.5 font-mono text-[0.65rem] font-bold text-primary">
                  {activeSubsystem.code}
                </span>
                <span className="hud-label text-[0.65rem] text-silver uppercase">
                  {activeSubsystem.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inspectionStore.prevSubsystem()}
                  className="rounded-xs border border-border px-2 py-0.5 font-mono text-xs text-silver transition-colors hover:border-primary hover:text-primary"
                  title="Previous subsystem (Left Arrow)"
                  aria-label="Previous subsystem"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => inspectionStore.nextSubsystem()}
                  className="rounded-xs border border-border px-2 py-0.5 font-mono text-xs text-silver transition-colors hover:border-primary hover:text-primary"
                  title="Next subsystem (Right Arrow)"
                  aria-label="Next subsystem"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => inspectionStore.close()}
                  className="flex items-center gap-1 rounded-xs border border-border/90 bg-void/80 px-2.5 py-0.5 font-mono text-[0.68rem] text-primary transition-colors hover:bg-primary/20"
                  aria-label="Close component inspection"
                >
                  <span>✕ Close</span>
                  <kbd className="hidden text-[0.55rem] text-muted-foreground lg:inline">(Esc)</kbd>
                </button>
              </div>
            </div>

            {/* Subsystem Carousel Pill Bar */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {ORDERED_SUBSYSTEM_IDS.map((id) => {
                const sub = INSPECTION_SUBSYSTEMS[id];
                if (!sub) return null;
                const isActive = sub.id === activeSubsystem.id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => inspectionStore.setInspected(id)}
                    className={`whitespace-nowrap rounded-xs px-2 py-1 font-mono text-[0.6rem] transition-all ${
                      isActive
                        ? "border border-primary bg-primary/25 font-bold text-primary shadow-glow"
                        : "border border-border/60 bg-void/50 text-silver hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {sub.shortName}
                  </button>
                );
              })}
            </div>

            {/* Subsystem Title & Description */}
            <div className="mt-3">
              <h3 className="display-title text-base text-foreground md:text-lg">
                {activeSubsystem.label}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-foreground/85 md:text-sm">
                {activeSubsystem.description}
              </p>
            </div>

            {/* Specifications Matrix */}
            <div className="mt-3.5 space-y-1.5 rounded-sm border border-border/80 bg-charcoal/40 p-3">
              <p className="hud-label text-[0.6rem] text-primary uppercase">
                NASA Flight Specifications
              </p>
              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                {activeSubsystem.specs.map((spec) => (
                  <div key={spec.label} className="border-l border-primary/30 pl-2">
                    <p className="font-mono text-[0.58rem] text-muted-foreground">{spec.label}</p>
                    <p className="font-mono text-[0.68rem] font-medium text-foreground">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Mission Record */}
            <div className="mt-3 rounded-sm border border-border/70 bg-void/60 p-2.5">
              <p className="font-mono text-[0.58rem] text-silver uppercase">Mission Milestone</p>
              <p className="mt-1 text-[0.72rem] leading-relaxed text-foreground/90">
                {activeSubsystem.history}
              </p>
            </div>

            {/* Dedicated Sol 779 Motor Anomaly & Gertrude Weise Investigation Dossier */}
            {activeSubsystem.anomaly && (
              <div className="mt-3.5 space-y-2 rounded-sm border border-destructive/60 bg-destructive/10 p-3">
                <div className="flex items-center justify-between border-b border-destructive/30 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    <span className="font-mono text-[0.65rem] font-bold tracking-wider text-destructive uppercase">
                      {activeSubsystem.anomaly.classification}
                    </span>
                  </div>
                  <span className="font-mono text-[0.6rem] text-destructive">
                    Sol {activeSubsystem.anomaly.sol} · {activeSubsystem.anomaly.date}
                  </span>
                </div>

                <div>
                  <p className="font-mono text-[0.6rem] font-semibold text-foreground">
                    Observed Symptom:
                  </p>
                  <p className="text-[0.7rem] text-foreground/90">
                    {activeSubsystem.anomaly.observedSymptom}
                  </p>
                </div>

                <div>
                  <p className="font-mono text-[0.6rem] font-semibold text-foreground">
                    Root Cause Investigation:
                  </p>
                  <p className="text-[0.7rem] text-foreground/90">
                    {activeSubsystem.anomaly.causeInvestigation}
                  </p>
                </div>

                <div>
                  <p className="font-mono text-[0.6rem] font-semibold text-foreground">
                    Flight Operations Adaptation:
                  </p>
                  <p className="text-[0.7rem] text-foreground/90">
                    {activeSubsystem.anomaly.operationalAdaptation}
                  </p>
                </div>

                {/* Gertrude Weise Scientific Discovery Card */}
                <div className="mt-2 rounded-xs border border-primary/40 bg-void/80 p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[0.62rem] font-bold text-primary">
                      Scientific Consequence: {activeSubsystem.anomaly.scientificDiscovery.featureName}
                    </p>
                    <span className="font-mono text-[0.55rem] text-muted-foreground">
                      {activeSubsystem.anomaly.scientificDiscovery.exposureSol}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.68rem] leading-relaxed text-foreground/95">
                    {activeSubsystem.anomaly.scientificDiscovery.finding}
                  </p>
                  <div className="mt-2 border-t border-border/60 pt-1.5">
                    <p className="font-mono text-[0.55rem] text-silver uppercase">
                      Scientific Hypotheses:
                    </p>
                    <p className="text-[0.65rem] italic text-muted-foreground">
                      {activeSubsystem.anomaly.scientificDiscovery.hypotheses}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Default Blueprint State / Hotspot Instruction Card */
          <div className="relative mx-auto my-auto w-full max-w-sm pointer-events-auto md:mx-0 md:max-w-md">
            {phase === "exploded" ? (
              <div className="hud-panel rounded-sm px-4 py-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-beacon" />
                  <p className="hud-label text-foreground text-[0.65rem]">
                    Click any 3D beacon to inspect subsystem specifications & flight history
                  </p>
                </div>
                {/* Quick Subsystem Launch Chips */}
                <div className="mt-3 flex flex-wrap gap-1 border-t border-border/50 pt-2.5">
                  {ORDERED_SUBSYSTEM_IDS.map((id) => {
                    const sub = INSPECTION_SUBSYSTEMS[id];
                    if (!sub) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => inspectionStore.setInspected(id)}
                        className="rounded-xs border border-border/70 bg-void/60 px-2 py-0.5 font-mono text-[0.58rem] text-silver transition-colors hover:border-primary hover:text-primary"
                      >
                        {sub.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Bottom Technical Status & Navigation */}
        <div className="flex flex-col gap-4">
          {/* Progress Micro Bar */}
          <div className="relative h-1 w-full max-w-xs overflow-hidden rounded-full bg-foreground/15">
            <div
              ref={barRef}
              className="h-full origin-left scale-x-0 bg-ember-gradient shadow-glow transition-transform duration-75"
            />
          </div>

          <div className="flex items-end justify-between">
            {/* Contextual instruction */}
            <div className="max-w-md">
              {progress < 0.18 ? (
                <div className="flex items-center gap-3 animate-in fade-in duration-500">
                  <span className="animate-scroll-cue font-mono text-base text-primary" aria-hidden>
                    ↓
                  </span>
                  <div>
                    <p className="hud-label text-foreground">Scroll down to explode rover</p>
                    <p className="font-mono text-[0.6rem] text-muted-foreground">
                      Six wheels, suspension, mast and science payload separate along technical axes
                    </p>
                  </div>
                </div>
              ) : progress < 0.8 ? (
                <div className="flex items-center gap-3">
                  <span className="animate-blink h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <p className="hud-label text-foreground">Separating major assemblies...</p>
                    <p className="font-mono text-[0.6rem] text-muted-foreground">
                      Reverse scrolling re-assembles the flight rover
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary shadow-glow" />
                  <div>
                    <p className="hud-label text-foreground">Exploded view active</p>
                    <p className="font-mono text-[0.6rem] text-muted-foreground">
                      Click beacons to inspect · Scroll down to proceed into Mars orbit
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Skip to Mars Orbit button */}
            <button
              type="button"
              onClick={() => {
                inspectionStore.close();
                scrollToId("hero");
              }}
              className="hud-panel group pointer-events-auto rounded-sm px-4 py-2 transition-colors hover:bg-primary/20"
              aria-label="Proceed directly to Mars orbit"
            >
              <span className="hud-label text-foreground transition-colors group-hover:text-primary">
                Mars Orbit →
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
