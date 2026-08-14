"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/container";
import { journey } from "@/lib/fxbvillage";

/**
 * The 36-month transformation journey.
 *
 * Four phases along one rule on desktop — the shape that says "journey" rather
 * than "list" — turning vertical below `lg`, because four columns of body copy
 * on a phone is four columns of two-word lines.
 *
 * The brief asks for a *progressive* timeline, and that word is doing work: the
 * rule is not drawn until the reader arrives at it. A track carries the whole 36
 * months, and the white line on top is the part travelled — it draws from phase
 * one to phase four, each node landing as the line reaches it and each phase
 * arriving just behind its own node. The reader watches the journey happen
 * instead of being handed four paragraphs at once.
 *
 * One observer, on the list, rather than one per phase. On a desktop all four
 * phases cross the fold in the same frame, so four observers would fire together
 * and there would be nothing progressive about it. The stagger is a transition
 * delay per index instead. Under prefers-reduced-motion everything is present
 * from the first frame with nothing to animate.
 *
 * An earlier attempt alternated the phases above and below the axis. It bought
 * each card more width and was worse: on a four-phase timeline the stagger reads
 * as decoration, and the eye has to zigzag to follow a sequence that is already
 * perfectly linear.
 *
 * The step numerals are set in the condensed display face. They are the one
 * thing on this page that face is for: figures doing structural work.
 */

/** Milliseconds between one phase starting and the next. */
const STEP = 170;

export function TransformationJourney({
  copy,
  items,
}: {
  /**
   * The section's words, read by the page.
   *
   * This is a client component, so it cannot await them itself. The server
   * page that renders it does, and the defaults stay in the registry.
   */
  copy?: { eyebrow?: string; heading?: string; body?: string };
  /**
   * The steps, from the panel where somebody has edited them.
   *
   * The step number is the position in the list rather than a field, so
   * reordering or removing a phase cannot leave "3" above what is now the
   * second one.
   */
  items?: { title: string; body?: string }[];
}) {
  const phases =
    items && items.length > 0
      ? items.map((item) => ({ period: item.title, body: item.body ?? "" }))
      : journey.map((phase) => ({ period: phase.period, body: phase.body }));

  const ref = useRef<HTMLOListElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = window.setTimeout(() => setShown(true), 0);
      return () => window.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setShown(true);
      },
      { threshold: 0, rootMargin: "0px 0px -15% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const delay = (index: number, offset: number) =>
    shown ? `${index * STEP + offset}ms` : "0ms";

  return (
    <section id="journey" className="scroll-mt-36 bg-blue py-24 lg:py-32">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-white-70" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-white-94">
                {copy?.eyebrow ?? "TRANSFORMATION JOURNEY"}
              </span>
            </div>
            <h2 className="max-w-[22ch] text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
              {copy?.heading ?? "36 months to change a life, sustainably"}
            </h2>
          </div>
          <p className="max-w-[46ch] text-base leading-relaxed text-white-94 lg:text-[17px]">
            A complete 36-month journey toward dignity, access to fundamental
            rights, and lasting change for children and families.
          </p>
        </div>

        <ol
          ref={ref}
          className="mt-16 grid gap-y-10 lg:mt-20 lg:grid-cols-4 lg:gap-x-10"
        >
          {phases.map((phase, index) => {
            const last = index === journey.length - 1;

            return (
              <li
                key={phase.period}
                className="relative flex gap-6 lg:flex-col lg:gap-0"
              >
                {/* Track and progress, two layers.

                    The old rule was a single hairline in `white-12` — a 12%
                    alpha, which is a token for a border on a tinted surface and
                    was never going to carry a diagram. On blue it was very
                    nearly invisible, so the one element tying the four phases
                    together did not read at all. The track is `white-40` now and
                    the travelled part is solid white. */}
                {!last && (
                  <>
                    <span
                      className="absolute top-12 bottom-0 left-6 w-px bg-white-40 lg:top-6 lg:bottom-auto lg:left-12 lg:h-px lg:w-full"
                      aria-hidden="true"
                    />
                    <span
                      className="absolute top-12 bottom-0 left-6 w-px overflow-hidden lg:top-6 lg:bottom-auto lg:left-12 lg:h-px lg:w-full"
                      aria-hidden="true"
                    >
                      <span
                        className={`motion-transform block size-full origin-top bg-white transition-transform duration-700 ease-(--ease-standard) lg:origin-left ${
                          shown
                            ? "scale-100"
                            : "scale-y-0 lg:scale-x-0 lg:scale-y-100"
                        }`}
                        style={{ transitionDelay: delay(index, 0) }}
                      />
                    </span>
                  </>
                )}

                <span
                  className={`motion-transform relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full bg-white transition-transform duration-700 ease-(--ease-standard) ${
                    shown ? "scale-100" : "scale-0"
                  }`}
                  style={{ transitionDelay: delay(index, 140) }}
                >
                  <span className="font-display text-xl leading-none font-semibold text-blue tabular-nums">
                    {index + 1}
                  </span>
                </span>

                <div
                  className={`motion-transform pb-2 transition-[opacity,transform,translate,scale,rotate] duration-700 ease-(--ease-standard) lg:mt-9 ${
                    shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
                  style={{ transitionDelay: delay(index, 220) }}
                >
                  {/* The period is the phase's name, and at 18px in the same
                      weight as the copy under it, it was reading as the first
                      line of the paragraph rather than as a heading. */}
                  {/* 1.12, not `leading-none`. Poppins collides with itself
                      under 1.059 — the `g` tail against the next line's
                      ascenders — and at 30px a two-line title is likelier than
                      it was at 22. Same floor the hero headline is held to. */}
                  <h3 className="text-[26px] leading-[1.12] font-bold tracking-[-0.02em] text-white lg:text-[30px]">
                    {phase.period}
                  </h3>
                  <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-white-94">
                    {phase.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
