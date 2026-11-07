import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { StoryChrome } from "@/components/mars/Chrome";
import { Descent } from "@/components/mars/Descent";
import { Hero } from "@/components/mars/Hero";
import { Legacy } from "@/components/mars/Legacy";
import { MissionTimeline } from "@/components/mars/MissionTimeline";
import { RoverDossier } from "@/components/mars/RoverDossier";
import { SceneBoundary } from "@/components/mars/SceneBoundary";
import { ensureGsap } from "@/components/mars/scroll";
import { scrollState, type ScrollState } from "@/lib/scroll-store";

const MarsScene = lazy(() => import("@/components/mars/scene/MarsScene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mars: Rewind & Beyond — The Journey of NASA's Spirit Rover" },
      {
        name: "description",
        content:
          "An interactive 3D journey across Mars following NASA's Spirit rover, from launch in 2003 to its final signal in 2010.",
      },
      { property: "og:title", content: "Mars: Rewind & Beyond — NASA's Spirit Rover" },
      {
        property: "og:description",
        content: "Scroll through space, land in Gusev Crater and drive with Spirit through seven mission milestones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useStoryScroll() {
  useEffect(() => {
    const { gsap, ScrollTrigger } = ensureGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(scrollState, { intro: 0 }, { intro: 1, duration: 4.5, ease: "power2.out" });

      const bind = (id: string, key: keyof ScrollState, start = "top top", end = "bottom bottom") =>
        ScrollTrigger.create({
          trigger: `#${id}`,
          start,
          end,
          onUpdate: (s) => {
            scrollState[key] = s.progress;
          },
          onRefresh: (s) => {
            scrollState[key] = s.progress;
          },
        });
      bind("hero", "hero", "top top", "bottom top");
      bind("descent", "descent");
      bind("timeline", "timeline");
      bind("dossier", "info");
      bind("legacy", "legacy");

      gsap.from("[data-hero-in]", {
        opacity: 0,
        y: 28,
        duration: 1.6,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.5,
      });
      gsap.to("[data-hero-content]", {
        opacity: 0,
        y: -80,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
      });

      gsap
        .timeline({
          scrollTrigger: { trigger: "#descent", start: "top top", end: "bottom bottom", scrub: true },
        })
        .fromTo(
          "[data-descent-title]",
          { opacity: 0, y: 50, letterSpacing: "0.45em" },
          { opacity: 1, y: 0, letterSpacing: "0.04em", duration: 0.2, ease: "power2.out" },
          0.6,
        )
        .fromTo("[data-descent-sub]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.12 }, 0.7)
        .to(["[data-descent-title]", "[data-descent-sub]"], { opacity: 0, y: -40, duration: 0.08 }, 0.92)
        .set({}, {}, 1);
    });
    return () => ctx.revert();
  }, []);
}

function Index() {
  useStoryScroll();
  return (
    <>
      <ClientOnly fallback={<div className="fixed inset-0 z-0 bg-void" />}>
        <SceneBoundary>
          <Suspense fallback={<div className="fixed inset-0 z-0 bg-void" />}>
            <MarsScene />
          </Suspense>
        </SceneBoundary>
      </ClientOnly>
      <div id="descent-veil" className="pointer-events-none fixed inset-0 z-[5] bg-veil opacity-0" />
      <div className="pointer-events-none fixed inset-0 z-[6] bg-vignette" />
      <StoryChrome />
      <main className="relative z-10">
        <Hero />
        <Descent />
        <MissionTimeline />
        <RoverDossier />
        <Legacy />
      </main>
    </>
  );
}
