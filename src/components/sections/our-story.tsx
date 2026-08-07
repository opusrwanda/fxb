"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/container";
import type { Milestone } from "@/cms/content/milestones";

/**
 * Our Story — the timeline, running across rather than down.
 *
 * It was a vertical axis: year against story, six rows deep, with the line
 * drawn progressively as the reader came down it. That version read well and
 * cost about two thousand pixels of scroll on a page that already carries the
 * map, the values and the board. Across, the same six milestones occupy one
 * band and the reader moves through them by choice instead of by scrolling
 * past them.
 *
 * Each milestone is a card: the year, a picture, the paragraph. The year stays
 * the graphic element it was — first thing in the card, set above the picture,
 * so the six of them still read as a sequence at a glance.
 *
 * THE MISSING PHOTOGRAPHS
 *
 * Three of these milestones are events from 1986, 1989 and 1995, and there is
 * no archive photography of them in the media library — only contemporary
 * Rwandan programme work. A 2020s photograph under "François-Xavier Bagnoud
 * lost his life on a rescue mission in Mali" would not be a placeholder, it
 * would be a false caption on a real organisation's history.
 *
 * So a milestone without a picture gets a panel instead: its year set large on
 * the brand blue. It reads as deliberate rather than broken, and it is an
 * obvious slot for the real photograph when FXB supplies it — add the file to
 * `image` below and the panel gives way to it.
 *
 * Copy is transcribed from the content brief unchanged. The years are set in
 * Poppins, not the condensed display face — that face is scoped to impact
 * numerals, and a date is a heading, not a statistic.
 */


export function OurStory({ milestones }: { milestones: Milestone[] }) {
  const track = useRef<HTMLOListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  // One measurement pass, run on scroll and on resize. Everything the controls
  // need — which end we are at, how many pages there are, which one is showing
  // — falls out of the same three numbers, so they cannot disagree with each
  // other the way separate handlers would.
  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
    const count = Math.max(1, Math.round(el.scrollWidth / el.clientWidth));
    setPages(count);
    setPage(max <= 0 ? 0 : Math.round((el.scrollLeft / max) * (count - 1)));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure]);

  const step = useCallback((direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    // A viewport at a time, less a card's overlap, so the card at the edge is
    // not the one that disappears as the reader moves on.
    el.scrollBy({
      left: direction * el.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  // Nothing to show is a real state — an empty timeline is a section that
  // should not be on the page at all. Placed below the hooks, not above them:
  // an early return before a hook changes the call order between renders.
  if (milestones.length === 0) return null;

  return (
    <section id="story" className="scroll-mt-32 bg-white py-24 lg:py-32">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                OUR STORY
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              Four decades, one promise
            </h2>
          </div>

          <div className="flex flex-col gap-6 lg:items-end">
            <p className="max-w-[46ch] text-base leading-relaxed text-gray lg:text-lg lg:font-light">
              From a life lost on a rescue mission in Mali to a Rwandan NGO
              working in every province — the through line has never changed.
            </p>

            {/* Both ends are reachable, so the arrows disable rather than wrap.
                This is a finite history, not a loop: a "next" that returned to
                1986 would be saying something untrue about the shape of it. */}
            <div className="flex items-center gap-3">
              <Arrow
                label="Earlier milestones"
                disabled={atStart}
                onClick={() => step(-1)}
              >
                <ArrowLeft className="size-4.5" aria-hidden="true" />
              </Arrow>
              <Arrow
                label="Later milestones"
                disabled={atEnd}
                onClick={() => step(1)}
              >
                <ArrowRight className="size-4.5" aria-hidden="true" />
              </Arrow>
            </div>
          </div>
        </div>
      </Container>

      {/* Full-bleed track: the row starts on the measure and runs off the right
          edge, so it reads as continuing rather than as a boxed component. */}
      <ol
        ref={track}
        className="carousel-inset no-scrollbar mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 lg:mt-16 lg:gap-8"
      >
        {milestones.map((milestone) => (
          <li
            key={milestone.year}
            className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[calc((80rem-5rem-4rem)/3)] xl:w-[calc((80rem-5rem-6rem)/4)]"
          >
            <p
              className={`text-lg font-bold tracking-[-0.01em] ${
                milestone.current ? "text-green" : "text-blue"
              }`}
            >
              {milestone.year}
            </p>

            <div className="mt-4 aspect-4/3 overflow-hidden rounded-card">
              {milestone.image ? (
                <Image
                  src={milestone.image.url}
                  alt=""
                  width={milestone.image.width}
                  height={milestone.image.height}
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 400px, (min-width: 640px) 46vw, 78vw"
                  className="size-full object-cover"
                />
              ) : (
                // The slot, not a stand-in. See the note at the top of the file.
                <div
                  className="flex size-full items-center justify-center bg-blue-08"
                  aria-hidden="true"
                >
                  <span className="text-[44px] font-bold tracking-[-0.03em] text-blue-16">
                    {milestone.year}
                  </span>
                </div>
              )}
            </div>

            <p className="mt-5 text-[15px] leading-relaxed text-gray">
              {milestone.body}
            </p>
          </li>
        ))}
      </ol>

      {/* Position, not navigation. Six dots for six milestones would be six more
          things to aim at; these say how far along the band the reader is. */}
      {pages > 1 && (
        <Container className="mt-8 flex justify-center gap-2" aria-hidden="true">
          {Array.from({ length: pages }, (_, index) => (
            <span
              key={index}
              className={`h-2 rounded-full transition-[width,background-color] duration-500 ease-(--ease-standard) ${
                index === page ? "w-6 bg-blue" : "w-2 bg-blue-16"
              }`}
            />
          ))}
        </Container>
      )}
    </section>
  );
}

function Arrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-gray-15 text-blue transition-colors duration-300 hover:border-blue hover:bg-blue hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
