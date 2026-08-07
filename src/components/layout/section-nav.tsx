"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/container";

/**
 * In-page navigation for a long page.
 *
 * What We Do runs to ten thousand pixels across ten sections, and the header
 * menu exposes exactly two of them — the model and the areas. A visitor who
 * arrives on either lands in the middle of a document with no way to see what
 * else is on it, and a visitor who arrives at the top has to scroll the whole
 * thing to find out. That is the gap this fills.
 *
 * It pins directly under the header's pinned state — 73px on desktop, 65px on a
 * phone, both measured rather than assumed — so the two bars read as one piece
 * of furniture rather than as a bar that has come loose.
 *
 * The current section is tracked with one observer over a band at the top of
 * the viewport, not by listening to scroll. A scroll handler firing every frame
 * is exactly what the header already refuses to do, for the same Core Web
 * Vitals reason.
 *
 * The band is a narrow strip just under the two bars — roughly 70px of the top
 * of the screen — rather than the whole viewport, so an entry lights when its
 * section actually arrives at the top rather than the moment its first pixel
 * appears at the bottom.
 *
 * The deepest intersecting section wins, not the first. At a boundary both
 * neighbours are in the strip at once — the outgoing section's bottom edge and
 * the incoming section's top edge are the same line — and taking the first in
 * document order kept the highlight one entry behind for the whole of the
 * journey and the why-it-works sections. Taking the last hands over as the new
 * section reaches the top, and on the way back up the lower section drops out of
 * the strip first, so it hands back at the same line.
 *
 * Sections without an entry — the challenge, the principles, the count — simply
 * leave the previous entry lit, which is the honest answer to "where am I".
 */
export type Section = { id: string; label: string };

/** The pinned header, in pixels. Must match `site-header.tsx`. */
const HEADER = { mobile: 65, desktop: 73 };

export function SectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const seen = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          seen.set(entry.target.id, entry.isIntersecting);
        }
        const current = [...sections]
          .reverse()
          .find((section) => seen.get(section.id));
        if (current) setActive(current.id);
      },
      { rootMargin: `-${HEADER.desktop + 57}px 0px -79% 0px`, threshold: 0 }
    );

    for (const section of sections) {
      const node = document.getElementById(section.id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [sections]);

  // Keep the lit entry in view on a phone, where the bar scrolls sideways and
  // the current section is very often off the right-hand edge.
  useEffect(() => {
    const current = list.current?.querySelector(`[data-id="${active}"]`);
    current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-[65px] z-30 border-b border-gray-15 bg-white lg:top-[73px]"
    >
      <Container>
        {/* Scrolls sideways rather than wrapping. Eight labels on a 390px
            screen would be three stacked rows, and a navigation bar three rows
            deep on a phone is taller than the content it is navigating. */}
        <ul
          ref={list}
          className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 sm:-mx-6 sm:px-6 lg:mx-0 lg:gap-2 lg:px-0"
        >
          {sections.map((section) => {
            const current = section.id === active;

            return (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  data-id={section.id}
                  aria-current={current ? "true" : undefined}
                  className={`relative flex items-center py-4 text-[15px] font-medium whitespace-nowrap transition-colors duration-200 lg:py-5 ${
                    current ? "text-blue" : "text-gray-80 hover:text-blue"
                  }`}
                >
                  <span className="px-3">{section.label}</span>
                  {/* The same green underline the header uses for the current
                      section, so "you are here" means one thing on this site. */}
                  <span
                    className={`motion-size absolute inset-x-3 bottom-0 h-0.5 origin-left bg-green transition-transform duration-300 ease-out ${
                      current ? "scale-x-100" : "scale-x-0"
                    }`}
                    aria-hidden="true"
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}
