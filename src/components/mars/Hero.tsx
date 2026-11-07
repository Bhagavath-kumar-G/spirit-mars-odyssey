export function Hero() {
  return (
    <section id="hero" className="relative h-screen">
      <div
        data-hero-content
        className="flex h-full flex-col items-center justify-between px-6 pb-10 pt-24 text-center md:pt-28"
      >
        <p data-hero-in className="hud-label tracking-[0.35em] text-silver">
          NASA Spirit Rover — Mars Exploration Mission
        </p>

        <div className="mt-auto mb-[6vh] flex flex-col items-center gap-5">
          <h1
            data-hero-in
            className="display-title text-[clamp(2.1rem,7vw,6.2rem)] text-foreground"
          >
            Mars<span className="text-ember-gradient">:</span> Rewind
            <br className="md:hidden" /> <span className="text-ember-gradient">&amp;</span> Beyond
          </h1>
          <p
            data-hero-in
            className="max-w-xl font-sans text-lg font-light text-muted-foreground md:text-xl"
          >
            One rover. One mission. An extraordinary journey.
          </p>
        </div>

        <div data-hero-in className="flex flex-col items-center gap-2">
          <span className="hud-label text-foreground">Scroll to begin exploration</span>
          <span className="animate-scroll-cue font-mono text-lg text-primary" aria-hidden>
            ↓
          </span>
        </div>
      </div>
    </section>
  );
}
