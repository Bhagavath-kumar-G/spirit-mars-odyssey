import { useEffect } from "react";
import { ensureGsap } from "./scroll";

const RECORD = [
  "Worked for more than six years on Mars — far beyond its planned 90-sol (about three-month) mission.",
  "Drove 7.73 km across Gusev Crater and climbed into the Columbia Hills.",
  "In 2007 its dragging, broken front wheel churned up nearly pure silica near Home Plate — a sign of ancient hot springs or steam vents.",
  "Found carbonate-rich rock at the “Comanche” outcrop, evidence of a once-wet, non-acidic environment.",
  "Photographed dust devils sweeping the plains — the same winds that sometimes cleaned its solar panels.",
  "Lessons from Spirit and its twin Opportunity shaped later rovers: Curiosity (2012) and Perseverance (2021).",
];

const IMAGINED = [
  "A future crew walks to Spirit's resting place at “Troy,” beside Home Plate, and finds it preserved as a heritage site.",
  "Robotic geologists descended from Spirit map ancient hot-spring deposits in search of signs of past life.",
  "Engineers study Spirit's dusty solar panels to learn how machines age after decades on Mars.",
];

export function Legacy() {
  useEffect(() => {
    const { gsap } = ensureGsap();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: "#legacy", start: "top top", end: "bottom bottom", scrub: true },
      });
      tl.fromTo("[data-legacy-line]", { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.25 }, 0.3)
        .set({}, {}, 1);
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } },
        );
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <section id="legacy" className="relative h-[240vh]" aria-label="Mission legacy">
        <div className="sticky top-0 flex h-screen flex-col items-center justify-start px-6 pt-[14vh] text-center">
          <p data-legacy-line className="hud-label mb-5 text-primary opacity-0">
            05 · Mission legacy
          </p>
          <h2
            data-legacy-line
            className="display-title max-w-5xl text-[clamp(1.4rem,3.6vw,3.2rem)] text-foreground opacity-0"
          >
            The mission ended.
            <br />
            <span className="text-ember-gradient">The discoveries didn't.</span>
          </h2>
          <p data-legacy-line className="mt-6 max-w-lg text-sm font-light text-foreground/80 opacity-0 md:text-base">
            Spirit rests in the soft soil of Gusev Crater, where it sent its last signal home.
          </p>
        </div>
      </section>

      <section className="relative bg-fade-up px-6 pb-16 pt-[20vh] md:px-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.35fr_1fr]">
          <div data-reveal className="hud-panel rounded-sm p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <p className="hud-label text-foreground">Historical record · Verified facts</p>
            </div>
            <h3 className="display-title mt-4 text-xl text-foreground md:text-2xl">What Spirit taught us</h3>
            <ul className="mt-6 space-y-4">
              {RECORD.map((r, i) => (
                <li key={i} className="flex gap-4 text-sm leading-relaxed text-foreground/90 md:text-[0.95rem]">
                  <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal className="relative rounded-sm border border-dashed border-speculative/50 bg-void/60 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full border border-speculative" />
              <p className="hud-label text-speculative">Imagined future · Not historical</p>
            </div>
            <h3 className="display-title mt-4 text-xl text-foreground md:text-2xl">Beyond</h3>
            <p className="mt-2 text-xs italic text-muted-foreground">
              These scenarios are speculative and did not happen.
            </p>
            <ul className="mt-6 space-y-4">
              {IMAGINED.map((r, i) => (
                <li key={i} className="flex gap-4 text-sm leading-relaxed text-foreground/75">
                  <span className="font-mono text-xs text-speculative">?{i + 1}</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="mx-auto mt-20 flex max-w-6xl flex-col items-center gap-8 border-t border-border pt-10 text-center">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="hud-panel group rounded-sm px-6 py-3 transition-colors hover:bg-primary/15"
          >
            <span className="hud-label text-foreground group-hover:text-primary">↑ Return to orbit</span>
          </button>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Rover 3D model: NASA/JPL-Caltech (public domain). Mars globe map: NASA 3D Resources.
            Milestone images are artistic illustrations, not mission photographs. Mission dates and
            facts from NASA's Mars Exploration Rover program.
          </p>
          <p className="hud-label">Mars: Rewind &amp; Beyond</p>
        </footer>
      </section>
    </>
  );
}
