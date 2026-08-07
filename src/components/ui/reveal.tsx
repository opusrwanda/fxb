"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Entry animation for a colour room's contents.
 *
 * As a band crosses the fold its contents rise and fade in together, staggered
 * so they arrive as a sequence rather than as a block. The band itself never
 * moves. It fires once and holds — nothing re-animates on scroll back.
 *
 * SLOW ON PURPOSE
 *
 * This was 20px over 500ms on an expo-out curve, which is a curve chosen to
 * make a move land quickly and quietly: most of the distance is covered in the
 * first third. The brief is now the opposite one — Acumen as the reference,
 * and motion that is unhurried everywhere — so it is 36px over 900ms on the
 * single curve the site now uses, which eases in as well as out. The content
 * drifts up into place instead of darting into it.
 *
 * The travel grew with the duration rather than staying where it was. 20px
 * over 900ms is 22px a second, slow enough that the eye stops reading it as
 * movement at all and registers only the fade; 36px keeps the rise legible as
 * a rise at the longer duration.
 *
 * The trigger moved out to -18% for the same reason. A 900ms entrance starting
 * at -12% was still settling when the section was already well up the screen;
 * firing earlier means it finishes about where the old one did.
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
      { threshold: 0, rootMargin: "0px 0px -18% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      className={`motion-transform transition-[opacity,transform,translate,scale,rotate] duration-900 ease-(--ease-standard) ${
        shown ? "translate-y-0 opacity-100" : "translate-y-9 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
