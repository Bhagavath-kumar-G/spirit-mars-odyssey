import { useEffect, useRef } from "react";
import { ROVER_FACTS, ROVER_OBJECTIVE } from "@/lib/mission";
import { ensureGsap } from "./scroll";

const STATS = [
  { label: "Distance driven", value: 7.73, decimals: 2, unit: "km" },
  { label: "Mass", value: 185, decimals: 0, unit: "kg" },
  { label: "Planned mission", value: 90, decimals: 0, unit: "sols" },
  { label: "Top speed", value: 5, decimals: 0, unit: "cm/s" },
];

const INSTRUMENTS = [
  "Pancam",
  "Mini-TES",
  "Mössbauer spectrometer",
  "APXS",
  "Microscopic Imager",
  "Rock Abrasion Tool",
];

export function RoverDossier() {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { gsap } = ensureGsap();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: "#dossier", start: "top top", end: "bottom bottom", scrub: true },
      });
      tl.fromTo(panel.current, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.15 }, 0.05)
        .fromTo("[data-fact]", { opacity: 0, x: -16 }, { opacity: 1, x: 0, stagger: 0.02, duration: 0.08 }, 0.12)
        .to(panel.current, { opacity: 0, x: -40, duration: 0.1 }, 0.9)
        .set({}, {}, 1);

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset["count"]);
        const decimals = Number(el.dataset["decimals"] ?? 0);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: "#dossier", start: "top 30%", toggleActions: "play none none reverse" },
          onUpdate: () => {
            el.textContent = obj.v.toFixed(decimals);
          },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="dossier" className="relative h-[240vh]" aria-label="Spirit rover information">
      <div className="sticky top-0 flex h-screen items-end px-4 pb-6 md:items-center md:px-16 md:pb-0">
        <div
          ref={panel}
          className="hud-panel scanlines relative w-full max-w-md rounded-sm p-5 opacity-0 md:p-7"
        >
          <div className="flex items-center justify-between">
            <p className="hud-label text-primary">04 · Rover dossier</p>
            <p className="hud-label">MER-A</p>
          </div>
          <h2 className="display-title mt-3 text-2xl text-foreground md:text-3xl">Spirit</h2>

          <dl className="mt-5 divide-y divide-border border-y border-border">
            {ROVER_FACTS.map((f) => (
              <div data-fact key={f.label} className="flex items-baseline justify-between gap-4 py-2">
                <dt className="hud-label">{f.label}</dt>
                <dd className="text-right font-mono text-xs text-foreground md:text-sm">
                  {f.label === "Mission status" ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      {f.value}
                    </span>
                  ) : (
                    f.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div data-fact className="mt-4">
            <p className="hud-label">Main objective</p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{ROVER_OBJECTIVE}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-border">
            {STATS.map((s) => (
              <div key={s.label} className="bg-void/60 p-3">
                <p className="hud-label text-[0.58rem]">{s.label}</p>
                <p className="mt-1 font-mono text-xl text-foreground">
                  <span data-count={s.value} data-decimals={s.decimals}>
                    0
                  </span>
                  <span className="ml-1 text-xs text-primary">{s.unit}</span>
                </p>
              </div>
            ))}
          </div>

          <div data-fact className="mt-4 hidden flex-wrap gap-1.5 md:flex">
            {INSTRUMENTS.map((i) => (
              <span key={i} className="rounded-sm border border-border px-2 py-0.5 font-mono text-[0.62rem] text-silver">
                {i}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
