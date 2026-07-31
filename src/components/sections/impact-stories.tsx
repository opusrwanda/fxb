"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/container";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { photo } from "@/lib/photos";
import { formatStoryDate, stories } from "@/lib/stories";

/**
 * Impact Stories — a blue room with a bleeding photographic carousel.
 *
 * The card here is not a card: there is no surface, no border, no padding box.
 * A photograph sits directly on the blue with its own rounded corners, and the
 * headline and action hang beneath it on the room's own background. Removing
 * the container is what lets the photographs run to the edge of the screen and
 * carry the section, which is the whole point of the pattern.
 *
 * The track is full-bleed and scroll-snapped, so it starts flush with the
 * headline and runs off the right edge with the next story half-visible. That
 * peek is the affordance — it says there is more here before anyone touches the
 * arrows.
 *
 * Scrolling is native: touch, trackpad and keyboard all work on the track
 * itself, and the arrows are a convenience layered on top rather than the only
 * way through. Without JavaScript the track is still a scrollable strip; only
 * the arrows are lost.
 */
export function ImpactStories() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // A pixel of slack: fractional scroll positions never land exactly on the
    // bounds, and without it the end arrow stays enabled at the end.
    setAtStart(track.scrollLeft <= 1);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 1);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const step = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    // Move by exactly one card, measured rather than assumed — the card width
    // changes at every breakpoint.
    const card = track.querySelector("li");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const distance = card
      ? card.getBoundingClientRect().width + gap
      : track.clientWidth * 0.8;

    track.scrollBy({
      left: direction * distance,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, []);

  return (
    <section id="impact-stories" className="overflow-hidden bg-blue py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <h2 className="max-w-[16ch] text-3xl font-bold tracking-[-0.03em] text-white lg:text-[42px] lg:leading-[1.08]">
            Behind every programme, a person
          </h2>
          <p className="max-w-[46ch] text-base leading-relaxed text-white-94 lg:pt-2 lg:text-lg">
            Programmes are counted in households reached. What they change is
            only ever visible one household at a time.
          </p>
        </Reveal>
      </Container>

      <Reveal className="mt-14 lg:mt-16">
        <ul
          ref={trackRef}
          onScroll={sync}
          tabIndex={0}
          role="group"
          aria-label="Impact stories"
          className="no-scrollbar carousel-inset flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
        >
          {stories.map((story) => (
            <li
              key={story.slug}
              className="w-[85vw] shrink-0 snap-start sm:w-[62vw] lg:w-[560px]"
            >
              {/* h-full so every card fills the tallest in the row, which is
                  what lets the buttons below line up. */}
              <article className="flex h-full flex-col gap-6">
                <Link
                  href={`/news-insights/stories/${story.slug}`}
                  className="group relative block aspect-16/10 overflow-hidden rounded-card"
                >
                  <Image
                    src={photo(story.photo).url}
                    alt={story.alt}
                    fill
                    sizes="(min-width: 1024px) 560px, (min-width: 640px) 62vw, 85vw"
                    className="motion-transform object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
                  />
                </Link>

                <div className="flex flex-1 flex-col items-start gap-5">
                  <time
                    dateTime={story.date}
                    className="text-sm font-medium text-white-94"
                  >
                    {formatStoryDate(story.date)}
                  </time>

                  {/* Clamped so one long headline cannot drag the row of
                      buttons out of line with the others. */}
                  <h3 className="line-clamp-3 text-2xl leading-[1.15] font-bold tracking-[-0.02em] text-white lg:text-[32px]">
                    <Link href={`/news-insights/stories/${story.slug}`}>
                      {story.title}
                    </Link>
                  </h3>

                  {/* Pushed to the bottom, so a one-line headline and a
                      three-line one still put their button on the same line. */}
                  <Pill
                    href={`/news-insights/stories/${story.slug}`}
                    variant="outlineLight"
                    className="mt-auto"
                  >
                    Read More
                  </Pill>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Reveal>

      <Container className="mt-12 flex items-center justify-between gap-6">
        <Link
          href="/news-insights/stories"
          className="group flex items-center gap-2.5 text-base font-medium text-white"
        >
          View all stories
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>

        {/* On a screen wide enough to hold every story there is nothing to
            step through, so the controls go rather than sit there greyed out. */}
        {!(atStart && atEnd) && (
          <div className="flex items-center gap-3">
            <Arrow
              label="Previous story"
              disabled={atStart}
              onClick={() => step(-1)}
            >
              <ArrowLeft className="size-4.5" aria-hidden="true" />
            </Arrow>
            <Arrow label="Next story" disabled={atEnd} onClick={() => step(1)}>
              <ArrowRight className="size-4.5" aria-hidden="true" />
            </Arrow>
          </div>
        )}
      </Container>
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
      className="flex size-11 items-center justify-center rounded-full border border-white-40 text-white transition-colors duration-200 hover:border-white hover:bg-white hover:text-blue disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
