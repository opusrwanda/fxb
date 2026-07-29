"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Entry animation for a colour room's contents.
 *
 * Per the motion spec: as a band crosses the fold its contents rise 24px and
 * fade in together over 600ms, staggered 80ms apart. The band itself never
 * moves. It fires once and holds — nothing re-animates on scroll back.
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
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      className={`motion-transform transition-[opacity,transform] duration-[600ms] ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
