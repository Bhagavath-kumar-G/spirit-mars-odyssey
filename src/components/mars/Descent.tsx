export function Descent() {
  return (
    <section id="descent" className="relative h-[260vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-start px-6 pt-[16vh] text-center">
        <p data-descent-sub className="hud-label mb-5 text-primary opacity-0">
          Entry · Descent · Landing
        </p>
        <h2
          data-descent-title
          className="display-title text-[clamp(1.9rem,6vw,5rem)] text-foreground opacity-0"
        >
          The Journey Begins
        </h2>
        <p
          data-descent-sub
          className="mt-6 max-w-xl text-base font-light text-foreground/85 opacity-0 md:text-lg"
        >
          <span className="font-mono text-primary">January 4, 2004</span> — Humanity's explorer
          reaches the Martian surface.
        </p>
      </div>
    </section>
  );
}
