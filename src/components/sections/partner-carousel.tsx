"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { Container } from "@/components/layout/container";

/** Never changes, so the store never notifies. */
const noop = () => () => {};

/**
 * Manual control for the partner line.
 *
 * The line itself is still the CSS marquee: a doubled track translated by -50%
 * on a loop, server-rendered, working with JavaScript disabled. This adds a
 * pair of buttons for anybody who does not want to stand and wait for a
 * particular logo to come round — at 35 pixels a second, a full pass of
 * thirty-four logos takes the better part of four minutes.
 *
 * HANDING OVER
 *
 * An animation driven by `transform` and a scroll position driven by
 * `scrollLeft` cannot both be in charge of where the line sits — the same
 * conflict the impact stories track documents in globals.css. So the first
 * press hands over once and for all: it reads the translation the animation
 * had reached, kills the animation, and writes that exact offset into
 * `scrollLeft` before the container starts scrolling. The line does not move a
 * pixel at the moment control changes hands, which is the whole trick. From
 * then on it is an ordinary scroll strip and the buttons simply scroll it.
 *
 * The auto-scroll does not come back. Somebody who reached for the controls is
 * reading the wall, and having it slide out from under them a few seconds later
 * would undo exactly what they asked for.
 *
 * STAYING INFINITE
 *
 * The track holds the same logos twice, so any position and that position plus
 * half the track look identical. Before each step the scroll is normalised back
 * into the first copy, which means neither direction ever reaches an end and no
 * button is ever dead. The jump is half the track exactly, onto identical
 * pixels, so it cannot be seen.
 */
export function PartnerCarousel({ children }: { children: React.ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const manual = useRef(false);

  // The buttons are rendered only once this has hydrated: false in the HTML,
  // true on the client. A control that is painted but not yet wired is worse
  // than one that arrives a moment late — and with JavaScript off it should
  // never appear at all, because then the line still scrolls itself and there
  // is nothing to press.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false
  );

  const takeControl = useCallback(() => {
    const element = viewport.current;
    if (!element || manual.current) return element;

    const track = element.querySelector<HTMLElement>(".marquee-track");
    if (track) {
      const transform = getComputedStyle(track).transform;
      // `none` under prefers-reduced-motion, where the line was never animating
      // and is already a scroll strip sitting wherever the reader left it.
      if (transform && transform !== "none") {
        element.scrollLeft = -new DOMMatrixReadOnly(transform).m41;
      }
      track.style.animation = "none";
    }

    // Set imperatively rather than through state: the scroll position above has
    // to be written in the same frame, and a re-render is a frame too late.
    element.dataset.manual = "true";
    manual.current = true;
    return element;
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      const element = takeControl();
      if (!element) return;

      const track = element.querySelector<HTMLElement>(".marquee-track");
      const tile = element.querySelector("li");
      const gap = track ? parseFloat(getComputedStyle(track).columnGap) || 0 : 0;
      // Measured, not assumed: the tile is 176px wide on a phone and 224px from
      // md, and the gap changes with it.
      const stride = tile ? tile.getBoundingClientRect().width + gap : 248;

      // Whole tiles, as many as the viewport holds. A step that left a logo
      // half in and half out would be a step that has to be repeated.
      const distance = Math.max(1, Math.floor(element.clientWidth / stride)) * stride;
      const half = (track ?? element).scrollWidth / 2;

      if (direction < 0 && element.scrollLeft < distance) {
        element.scrollLeft += half;
      } else if (direction > 0 && element.scrollLeft > half) {
        element.scrollLeft -= half;
      }

      element.scrollBy({
        left: direction * distance,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    },
    [takeControl]
  );

  // Once the strip scrolls it can also be dragged, flicked or shift-wheeled,
  // and none of that goes through `step`. Without this a trackpad could carry
  // the line to the true end of the second copy and stop dead, which reads as
  // the wall having run out of partners. Normalising after the gesture settles
  // keeps it endless whoever is doing the scrolling.
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;

    let timer: number;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!manual.current) return;
        const track = element.querySelector<HTMLElement>(".marquee-track");
        const half = (track ?? element).scrollWidth / 2;
        if (element.scrollLeft >= half) element.scrollLeft -= half;
        else if (element.scrollLeft <= 0) element.scrollLeft += half;
      }, 140);
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      element.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <div ref={viewport} className="marquee">
        {children}
      </div>

      {mounted && (
        <Container className="mt-8 flex items-center justify-end gap-3">
          <Arrow label="Previous partners" onClick={() => step(-1)}>
            <ArrowLeft className="size-4.5" aria-hidden="true" />
          </Arrow>
          <Arrow label="Next partners" onClick={() => step(1)}>
            <ArrowRight className="size-4.5" aria-hidden="true" />
          </Arrow>
        </Container>
      )}
    </>
  );
}

/**
 * Neither button is ever disabled — the line has no end to reach, so there is
 * no state in which pressing one does nothing.
 */
function Arrow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-gray-15 bg-white text-blue transition-colors duration-200 hover:border-blue hover:bg-blue hover:text-white"
    >
      {children}
    </button>
  );
}
