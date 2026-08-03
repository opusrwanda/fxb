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
 *
 * The section also pins while its stories go past. The peek and the arrows both
 * assume the reader looks for a way through; a lot of people simply do not, and
 * scroll on past a section whose later stories they never learn exist. So the
 * page holds here: the room sticks to the viewport, the page's own scrolling
 * drives the track sideways, and only once the last story has arrived does the
 * page carry on down. Nobody has to find a control, and nobody can scroll past
 * stories they were never shown.
 *
 * Taking over someone's scrolling is worth being careful about, so it is
 * bounded: the hold lasts exactly the width of the overflow and not a pixel
 * more, it is off entirely on touch and under reduced motion, and it does not
 * engage at all on a viewport wide enough to show every story at once.
 */
export function ImpactStories() {
  const trackRef = useRef<HTMLUListElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  /**
   * The hold: how far the track has to travel, and how tall the section must be
   * to buy that travel. Null when the section does not pin at all.
   */
  const [pin, setPin] = useState<{ distance: number; height: number } | null>(
    null,
  );
  const stickyRef = useRef<HTMLDivElement>(null);
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

  /**
   * Pin the section, and pan the track across the pinned frame.
   *
   * The section is made taller than its own pinned contents by exactly the
   * track's overflow, and those contents stick to the top of the viewport for
   * that extra distance.
   *
   * Taller than the *contents*, not than the viewport — that distinction is the
   * whole of the bug this had first time round. A sticky element releases when
   * its container runs out, so with the height computed off the viewport, a
   * pinned frame even slightly taller than one screen let go before the last
   * story arrived: measured, the heading started moving at 300px of a 372px
   * run. The frame is measured now, and a ResizeObserver re-measures it, since
   * applying the pinned layout changes its height in the first place.
   * Scrolling through it therefore buys horizontal travel rather than vertical:
   * the room stays put, the stories move, and the page resumes the moment the
   * last one lands. The height is the whole mechanism — it is what guarantees
   * the hold is precisely as long as there is content to show and cannot strand
   * anyone in a section that will not let go.
   *
   * `overflow-x: clip` on the section rather than `hidden`, because `hidden`
   * makes an ancestor a scroll container and silently kills the sticky inside
   * it. Clip contains the full-bleed track without doing that.
   *
   * `scrollLeft` rather than a transform on the contents. The track is already a
   * scroll container, and translating what is inside it would leave two things
   * deciding where the cards sit — the browser's scroll offset and a CSS
   * animation — which fight the moment anyone touches the track or an arrow.
   * Driving the same property everything else drives keeps one source of truth,
   * so a manual swipe simply takes over until the next frame.
   *
   * The listener is attached only while the section is on screen, and its work
   * is deferred to an animation frame. The header refuses a permanent scroll
   * handler for Core Web Vitals reasons and that still holds — this one exists
   * for a few hundred pixels of a single page and is otherwise detached.
   *
   * Off entirely for reduced motion, and off on touch devices, where a
   * horizontal strip is already something people swipe without being asked and
   * the page-scroll gesture is the same one they would use to read on.
   */
  useEffect(() => {
    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    let frame = 0;

    const pan = () => {
      frame = 0;
      const distance = track.scrollWidth - track.clientWidth;
      if (distance <= 0) return;

      // How far into the pinned run we are. `offsetTop` is read live so the
      // section moving — an image above it loading late, say — cannot leave the
      // track panning against a stale origin.
      const travelled = window.scrollY - section.offsetTop;
      const progress = Math.min(1, Math.max(0, travelled / distance));
      track.scrollLeft = distance * progress;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(pan);
    };

    const measure = () => {
      const distance = track.scrollWidth - track.clientWidth;
      const sticky = stickyRef.current;

      // No overflow, no hold. On a wide enough screen every story is already
      // visible and pinning would stop the page for nothing.
      if (distance <= 0 || !sticky) {
        setPin(null);
        return;
      }

      setPin({ distance, height: sticky.offsetHeight + distance });
      pan();
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);
    if (stickyRef.current) resizeObserver.observe(stickyRef.current);

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", onScroll, { passive: true });
        pan();
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    });

    observer.observe(section);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

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
    <section
      ref={sectionRef}
      id="impact-stories"
      className="relative scroll-mt-36 overflow-x-clip bg-blue"
      style={pin ? { height: `${pin.height}px` } : undefined}
    >
      <div
        ref={stickyRef}
        className={
          pin
            ? "sticky top-0 flex min-h-svh flex-col justify-center py-20"
            : "py-24 lg:py-32"
        }
      >
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
            className="no-scrollbar carousel-inset stories-track flex gap-6 overflow-x-auto pb-2"
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
              <Arrow
                label="Next story"
                disabled={atEnd}
                onClick={() => step(1)}
              >
                <ArrowRight className="size-4.5" aria-hidden="true" />
              </Arrow>
            </div>
          )}
        </Container>
      </div>
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
