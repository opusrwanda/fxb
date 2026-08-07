"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/container";

/**
 * Our Story — the timeline.
 *
 * Side by side, year against story, with the axis running between them. The
 * year is the graphic element: set at display scale and ranged right against
 * the rule, the six of them form a left rail you can read down in a second
 * without touching a paragraph.
 *
 * This replaced an alternating zigzag, which was the wrong answer twice over.
 * Half of every row was empty by construction, so the same six milestones ran
 * a thousand pixels longer than the version before them; and six hairline
 * boxes floating on white is the shape every timeline component ships with.
 * Nothing was carrying the years — they sat inside the boxes at heading size,
 * so the one thing a timeline exists to make scannable was the thing you had
 * to read the cards to find.
 *
 * No boxes here at all. The axis is the only drawn element on the section, and
 * it is drawn progressively — which is what the brief asks for by "timeline
 * diagram (progressive)". Each milestone owns the segment running from its own
 * node down to the next and draws it on the way in, so the line grows ahead of
 * the reader rather than sitting there finished. The last milestone owns no
 * segment: the line has to stop at Today, not run on into white space.
 *
 * Four moves off one trigger — line, node, year, story — starting at 0, 140,
 * 180 and 260ms and all done inside 800ms. Year and story converge a few
 * pixels onto the axis as they arrive, which is the only reason the direction
 * is worth having. An earlier cut staged them twice as slowly and far more
 * legibly, and was plainly worse: a mid-scroll frame at 380ms showed a bare
 * line and some dots with every card still invisible.
 *
 * On a phone the axis moves to the left margin and the year stacks over its
 * own paragraph. A 144px year column beside a 180px measure is not a layout.
 *
 * Copy is transcribed from the content brief unchanged. The years are set in
 * Poppins, not the condensed display face — that face is scoped to impact
 * numerals, and a date is a heading, not a statistic.
 */

const milestones = [
  {
    year: "1986",
    body: "François-Xavier Bagnoud tragically lost his life during a humanitarian helicopter rescue mission in Mali. His legacy of courage and compassion would inspire the creation of FXB.",
  },
  {
    year: "1989",
    body: "Albina du Boisrouvray founded FXB International in memory of her son, François-Xavier Bagnoud, with the mission of fighting extreme poverty and improving the lives of vulnerable children and families worldwide.",
  },
  {
    year: "1995",
    body: "FXB International began its mission in Rwanda, responding to the aftermath of the 1994 Genocide against the Tutsi by supporting vulnerable children, widows, and families on their path to recovery and self-reliance.",
  },
  {
    year: "2000",
    body: "The FXBVillage model was introduced in Rwanda, providing a holistic approach to breaking the cycle of extreme poverty through interventions in health, education, nutrition, livelihoods, child protection, and WASH.",
  },
  {
    year: "2012",
    body: "FXB Rwanda became a registered Rwandan Non-Governmental Organization (NGO), reinforcing its long-term commitment to sustainable community development and child well-being across the country.",
  },
  {
    year: "Today",
    body: "FXB Rwanda operates across all four provinces of Rwanda and the City of Kigali, implementing integrated programmes in health, education, child protection, livelihoods and economic empowerment, nutrition, WASH, and climate resilience — reaching thousands of vulnerable children, families, and communities. FXB Rwanda is proudly part of the FXB Global network, maintaining its strong local identity while contributing to a shared global vision, common values, and the internationally recognised FXBVillage model.",
    current: true,
  },
];

/** The site's reveal curve — expo-out, fast away and softly damped. */
const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

export function OurStory() {
  return (
    <section id="story" className="scroll-mt-32 bg-white py-24 lg:py-32">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                OUR STORY
              </span>
            </div>
            <h2 className="text-[60px] leading-[1.08] font-bold tracking-[-0.03em] text-blue lg:text-[84px]">
              Four decades, one promise
            </h2>
          </div>

          <p className="max-w-[46ch] text-base leading-relaxed text-gray lg:text-lg">
            From a life lost on a rescue mission in Mali to a Rwandan NGO working
            in every province — the through line has never changed.
          </p>
        </div>

        {/* The dot overhangs the 1px axis by 6px either side; on a phone the
            axis is the first column, so the list needs that back. */}
        <ol className="mt-16 pl-1.5 lg:mt-24 lg:pl-0">
          {milestones.map((milestone, index) => (
            <Milestone
              key={milestone.year}
              {...milestone}
              index={index}
              last={index === milestones.length - 1}
            />
          ))}
        </ol>
      </Container>
    </section>
  );
}

function Milestone({
  year,
  body,
  current = false,
  index,
  last,
}: {
  year: string;
  body: string;
  current?: boolean;
  index: number;
  last: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Present from the first frame, with nothing to animate. Same contract as
    // `Reveal` — under reduced motion the content is simply there. Deferred a
    // tick rather than set straight from the effect body, which is what
    // `Reveal` does and what the lint rule asks for.
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
      // Fires on the first pixel past a margin rather than on a fraction of the
      // row, so the "Today" milestone — four times the height of the others —
      // triggers at the same point on screen as the rest of them.
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Focus, not just position. Arriving out of a few pixels of blur and settling
  // sharp is the difference between an element that moves and one that resolves
  // — and at 5px over 600ms it is under the threshold where anyone can name what
  // happened, which is where this kind of thing belongs.
  const arrive = (offset: string) =>
    shown
      ? "translate-x-0 translate-y-0 opacity-100 blur-none"
      : `translate-y-3 opacity-0 blur-[5px] lg:translate-y-0 ${offset}`;

  return (
    // Two columns on a phone — axis, then year over story. Three from lg, with
    // the axis promoted to the middle so the year can range right against it.
    <li
      ref={ref}
      // The space between milestones is carried by the paragraph, not by
      // padding on the row. Padding here sits outside the grid rows, so the
      // axis cell stopped at the end of its own text and the line came out in
      // six separate dashes with 64px of white between them.
      className="grid grid-cols-[1px_minmax(0,1fr)] gap-x-8 lg:grid-cols-[minmax(0,12rem)_1px_minmax(0,1fr)] lg:gap-x-10"
    >
      {/* The axis is a real grid column, not an absolutely-placed overlay, so
          consecutive rows stack flush and the line is continuous by
          construction rather than by arithmetic. */}
      <div className="relative col-start-1 row-span-2 row-start-1 lg:col-start-2 lg:row-span-1">
        {!last && (
          <>
            {/* Two layers, and this is what turns a decoration into a reading
                position. The track is the whole route, drawn once and left
                alone in the faint hairline token. The brand blue on top of it
                is only the part you have already walked — it draws down the
                track as each milestone arrives, so at any point in the scroll
                the line is telling you how far through four decades you are.
                One rule doing that beats a rule that is simply present. */}
            <span
              className={`absolute inset-x-0 bottom-0 bg-gray-15 ${
                // The first segment starts at its own node; the rest start at
                // the top of the row and pick up exactly where the one above
                // stopped, so the run is continuous by construction.
                index === 0 ? "top-3 lg:top-6" : "top-0"
              }`}
              aria-hidden="true"
            />
            <span
              className={`absolute inset-x-0 bottom-0 overflow-hidden ${
                index === 0 ? "top-3 lg:top-6" : "top-0"
              }`}
              aria-hidden="true"
            >
              <span
                className={`motion-transform block size-full origin-top bg-blue transition-transform duration-[800ms] ${EASE} ${
                  shown ? "scale-y-100" : "scale-y-0"
                }`}
              />
            </span>
          </>
        )}

        <span
          className="absolute top-3 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 lg:top-6"
          aria-hidden="true"
        >
          {/* Live, and only here. Five milestones are finished history; one is
              still happening, and a halo breathing out of the last node says so
              without spending a word of copy on it. */}
          {current && (
            <span className="node-pulse absolute inset-0 rounded-full bg-green" />
          )}

          {/* A ring, not a dot. The white centre punches the track out cleanly
              where the node sits, which is the difference between a marker on
              a line and a bead threaded onto one. */}
          <span
            className={`motion-transform relative block size-3.5 rounded-full border-2 bg-white transition-transform duration-[500ms] ${EASE} ${
              shown ? "scale-100" : "scale-0"
            } ${current ? "border-green" : "border-blue"}`}
            style={{ transitionDelay: shown ? "140ms" : "0ms" }}
          />
        </span>
      </div>

      {/* The year does the work the cards used to. At display scale, ranged
          right against the axis, the six of them read as a rail. */}
      <h3
        className={`motion-transform col-start-2 row-start-1 text-[34px] leading-none font-bold tracking-[-0.03em] tabular-nums whitespace-nowrap transition-[opacity,transform,filter] duration-[600ms] lg:col-start-1 lg:row-start-1 lg:text-right lg:text-[56px] ${EASE} ${arrive(
          "lg:-translate-x-3"
        )} ${current ? "text-green" : "text-blue"}`}
        style={{ transitionDelay: shown ? "180ms" : "0ms" }}
      >
        {year}
      </h3>

      <p
        className={`motion-transform col-start-2 row-start-2 mt-4 max-w-[62ch] text-base leading-relaxed text-gray transition-[opacity,transform,filter] duration-[600ms] lg:col-start-3 lg:row-start-1 lg:mt-0 lg:pt-2.5 lg:text-[17px] ${
          last ? "" : "pb-12 lg:pb-16"
        } ${EASE} ${arrive(
          "lg:translate-x-3"
        )}`}
        style={{ transitionDelay: shown ? "260ms" : "0ms" }}
      >
        {body}
      </p>
    </li>
  );
}
