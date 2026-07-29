"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Impact counter.
 *
 * Counts up from zero the first time it enters the viewport, then holds. It
 * never re-triggers on scroll back — a number that keeps re-animating stops
 * reading as a fact. Under reduced motion the final value appears immediately.
 */
export function Counter({
  value,
  suffix = "",
  decimals = 0,
  duration = 1200,
  className = "",
}: {
  value: number;
  suffix?: string;
  /** For abbreviated figures such as 2.9M — animates the mantissa. */
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        if (reduceMotion) {
          setDisplay(value);
          return;
        }


        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(value * eased);
          if (progress < 1) frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
