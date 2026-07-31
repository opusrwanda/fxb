"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Entry animation for a colour room's contents.
 *
 * As a band crosses the fold its contents rise 20px and fade in together over
 * 500ms, staggered 60ms apart. The band itself never moves. It fires once and
 * holds — nothing re-animates on scroll back.
 *
 * The curve is expo-out, not `ease-out`. 24px over 600ms is 40px/second, which
 * is slow enough to read as sluggish rather than crisp; expo-out covers most of
 * the distance early and settles softly, so the same move arrives faster and
 * lands quieter. Editorial reveal wants short, fast and well damped.
 *
 * The stagger is capped at four steps by `delay`'s callers. Uncapped, the
 * fourth card in a row finished 920ms after the trigger, by which point the
 * reader has already looked at it and is waiting for the site to catch up.
 *
 * Under prefers-reduced-motion the content is simply present from the start:
 * no transform, no fade, no delay.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** Stagger index, in milliseconds. */
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  // A single ref shared across the three possible tags, so it is typed to the
  // common base rather than to any one element.
  const ref = useRef<HTMLElement>(null);
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
      // Threshold 0, not 0.15. A fraction-of-the-element threshold means a tall
      // band has to travel further before it fires than a short one — a 900px
      // section needed 135px on screen, by which time it was halfway up the
      // viewport and the move read as pop-in. Firing on the first pixel past a
      // margin makes the trigger point identical regardless of section height.
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      className={`motion-transform transition-[opacity,transform] duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
