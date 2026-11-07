import { useEffect, useRef, useState } from "react";
import launch from "@/assets/milestones/launch.jpg";
import landing from "@/assets/milestones/landing.jpg";
import exploration from "@/assets/milestones/exploration.jpg";
import discoveries from "@/assets/milestones/discoveries.jpg";
import struggle from "@/assets/milestones/struggle.jpg";
import communication from "@/assets/milestones/communication.jpg";
import complete from "@/assets/milestones/complete.jpg";
import { MILESTONES, progressForMilestone, roverStateAt } from "@/lib/mission";
import { cn } from "@/lib/utils";
import { ensureGsap, scrollToSectionProgress } from "./scroll";

const IMAGES: Record<string, string> = {
  launch,
  landing,
  exploration,
  discoveries,
  struggle,
  communication,
  complete,
};

const N = MILESTONES.length;
const pad = (n: number) => String(n).padStart(2, "0");

export function MissionTimeline() {
  const [view, setView] = useState({ active: -1, reached: 0, pre: true });
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { ScrollTrigger } = ensureGsap();
    const update = (p: number) => {
      const r = roverStateAt(p);
      const next = { active: r.active, reached: r.reached, pre: r.stop < 0 };
      setView((prev) =>
        prev.active === next.active && prev.reached === next.reached && prev.pre === next.pre
          ? prev
          : next,
      );
      if (fill.current) fill.current.style.transform = `scaleX(${Math.max(0, r.stop) / (N - 1)})`;
    };
    const st = ScrollTrigger.create({
      trigger: "#timeline",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => update(s.progress),
      onRefresh: (s) => update(s.progress),
    });
    return () => st.kill();
  }, []);

  const m = view.active >= 0 ? MILESTONES[view.active] : undefined;
  const nextIndex = view.pre ? 0 : view.reached + 1;

  return (
    <section id="timeline" className="relative h-[900vh]" aria-label="Spirit mission timeline">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* section header */}
        <div className="absolute left-0 right-0 top-16 flex justify-between px-5 md:top-20 md:px-16">
          <p className="hud-label">03 · Mission timeline</p>
          <p className="hud-label text-foreground">
            {pad(Math.max(view.active, view.reached) + 1)} <span className="text-muted-foreground">/ {pad(N)}</span>
          </p>
        </div>

        {/* milestone card / en-route chip */}
        <div className="absolute left-1/2 top-[13vh] w-[min(700px,92vw)] -translate-x-1/2 md:top-[15vh]">
          {m ? (
            <article
              key={m.code}
              className="hud-panel animate-in fade-in slide-in-from-bottom-6 grid overflow-hidden rounded-sm duration-700 md:grid-cols-[250px_1fr]"
            >
              <figure className="relative h-36 md:h-full">
                <img
                  src={IMAGES[m.image]}
                  alt={`${m.title} — illustration`}
                  width={1024}
                  height={640}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <figcaption className="hud-label absolute bottom-2 left-2 rounded-sm bg-void/70 px-1.5 py-0.5 text-[0.55rem]">
                  Illustration
                </figcaption>
              </figure>
              <div className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="hud-label text-primary">{m.code}</span>
                  <span className="font-mono text-xs text-silver">{m.date}</span>
                </div>
                <h3 className="display-title mt-3 text-lg text-foreground md:text-xl">{m.title}</h3>
                <div className="my-3 h-px w-12 bg-ember-gradient" />
                <p className="text-sm leading-relaxed text-foreground/85 md:text-[0.95rem]">
                  {m.description}
                </p>
              </div>
            </article>
          ) : (
            <div className="flex justify-center">
              <div className="hud-panel flex items-center gap-3 rounded-sm px-4 py-2.5">
                <span className="animate-blink h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="hud-label text-foreground">
                  {nextIndex < N
                    ? `${view.pre ? "Approaching" : "En route to"} ${MILESTONES[nextIndex]!.code}`
                    : "Mission complete"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* path progress strip */}
        <div className="absolute bottom-6 left-0 right-0 px-6 md:bottom-10 md:px-20">
          <div className="relative h-10">
            <div className="absolute left-0 right-0 top-1.5 h-px bg-foreground/20" />
            <div
              ref={fill}
              className="absolute left-0 right-0 top-1.5 h-px origin-left scale-x-0 bg-ember-gradient shadow-glow"
            />
            {MILESTONES.map((ms, i) => {
              const isActive = view.active === i;
              const isReached = !view.pre && i <= view.reached;
              return (
                <button
                  key={ms.code}
                  type="button"
                  onClick={() => scrollToSectionProgress("timeline", progressForMilestone(i))}
                  className="group absolute top-0 -translate-x-1/2 focus-visible:outline-none"
                  style={{ left: `${(i / (N - 1)) * 100}%` }}
                  aria-label={`Go to ${ms.code}: ${ms.title}, ${ms.date}`}
                >
                  <span
                    className={cn(
                      "block h-3 w-3 rounded-full border transition-all duration-300 group-hover:scale-150 group-focus-visible:scale-150",
                      isActive
                        ? "animate-beacon scale-125 border-primary bg-primary"
                        : isReached
                          ? "border-primary bg-primary/70"
                          : "border-foreground/40 bg-void",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-2 block font-mono text-[0.6rem] tracking-widest transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {pad(i + 1)}
                  </span>
                  <span className="hud-panel pointer-events-none absolute bottom-full left-1/2 mb-3 hidden w-44 -translate-x-1/2 translate-y-1 rounded-sm px-3 py-2 text-left opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 md:block">
                    <span className="hud-label block text-primary">{ms.date}</span>
                    <span className="mt-1 block text-xs text-foreground">{ms.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
