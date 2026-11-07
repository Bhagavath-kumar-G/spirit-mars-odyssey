import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ensureGsap, STORY_SECTIONS } from "./scroll";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
}

/** Top bar, mission progress rail and return-to-start button. */
export function StoryChrome() {
  const [active, setActive] = useState(0);
  const [pastHero, setPastHero] = useState(false);
  const railFill = useRef<HTMLDivElement>(null);
  const barFill = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const { ScrollTrigger } = ensureGsap();
    const triggers = [
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (s) => {
          const p = s.progress;
          if (railFill.current) railFill.current.style.transform = `scaleY(${p})`;
          if (barFill.current) barFill.current.style.transform = `scaleX(${p})`;
          if (pct.current) pct.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
          setPastHero(window.scrollY > window.innerHeight * 0.7);
        },
      }),
      ...STORY_SECTIONS.map((s, i) =>
        ScrollTrigger.create({
          trigger: `#${s.id}`,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && setActive(i),
        }),
      ),
    ];
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-10">
        <button type="button" onClick={() => scrollToId("hero")} className="flex items-center gap-3">
          <span className="relative h-5 w-5 rounded-full bg-ember-gradient shadow-glow" />
          <span className="display-title text-[0.7rem] text-foreground">Mars: Rewind &amp; Beyond</span>
        </button>
        <p className="hud-label hidden md:block">
          MER-A · Spirit · <span ref={pct} className="text-foreground">000</span>%
        </p>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={cn(
            "hud-label text-foreground transition-opacity md:hidden",
            pastHero ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-label="Return to the beginning"
        >
          ↑ Start
        </button>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground/10 md:hidden">
          <div ref={barFill} className="h-px origin-left scale-x-0 bg-ember-gradient" />
        </div>
      </header>

      <nav
        aria-label="Mission progress"
        className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 md:block"
      >
        <div className="relative flex flex-col gap-7 py-1">
          <div className="absolute bottom-0 right-[5px] top-0 w-px bg-foreground/15" />
          <div
            ref={railFill}
            className="absolute bottom-0 right-[5px] top-0 w-px origin-top scale-y-0 bg-ember-gradient"
          />
          {STORY_SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToId(s.id)}
              className="group relative flex items-center justify-end gap-3"
              aria-current={active === i ? "step" : undefined}
            >
              <span
                className={cn(
                  "hud-label transition-all duration-300",
                  active === i
                    ? "text-foreground opacity-100"
                    : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                )}
              >
                {s.label}
              </span>
              <span
                className={cn(
                  "relative h-[11px] w-[11px] rounded-full border transition-all",
                  active === i
                    ? "border-primary bg-primary shadow-glow"
                    : i < active
                      ? "border-primary bg-void"
                      : "border-foreground/40 bg-void",
                )}
              />
            </button>
          ))}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "hud-panel fixed bottom-8 right-8 z-30 hidden rounded-sm px-3.5 py-2.5 transition-all duration-500 hover:bg-primary/15 md:block",
          pastHero && active !== 2
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0",
        )}
        aria-label="Return to the beginning"
      >
        <span className="hud-label text-foreground">↑ Start</span>
      </button>
    </>
  );
}
