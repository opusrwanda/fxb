"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/components/layout/container";

/**
 * The four parts of What We Do, as one bar.
 *
 * The menu has always listed four things — the model, the areas, the current
 * projects, the phased-out ones — and until now two of them were anchors part
 * way down a very long page and two were separate pages. A reader who followed
 * "The FXBVillage Model" landed in the middle of a page with no way of knowing
 * that Areas of Intervention was further down the same one while Current
 * Projects was somewhere else entirely. The menu described a structure the site
 * did not have.
 *
 * So the same four appear here, on all four routes, and the bar says which one
 * you are in. Reading about the model now ends somewhere: the bar is above you
 * the whole way down, and the next thing along is one click.
 *
 * TWO KINDS OF ENTRY IN ONE BAR. The first two are sections of `/what-we-do`
 * and the last two are pages, which is a difference the reader has no reason
 * to care about — so it is not shown. Off the overview the anchors are
 * ordinary links back to it; on the overview they scroll, and which one is lit
 * is worked out from the scroll position.
 *
 * IntersectionObserver rather than a scroll handler, for the reason the header
 * gives: a listener firing every frame costs the Core Web Vitals budget. The
 * observer watches a band across the middle of the viewport, so a section
 * counts as the one being read when it is in front of the reader rather than
 * when its top edge happens to cross a line.
 *
 * Placed after the hero rather than at the top of the document. A sticky
 * element does not leave its place in the flow until the page scrolls to it,
 * so this rides down with the hero and pins under the header afterwards —
 * which is what keeps it off a full-height hero photograph at scroll 0.
 */

type Item = {
  label: string;
  href: string;
  /** The id it scrolls to, for the two that are sections of the overview. */
  section?: string;
};

const ITEMS: Item[] = [
  {
    label: "The FXBVillage Model",
    href: "/what-we-do#fxbvillage-model",
    section: "fxbvillage-model",
  },
  {
    label: "Areas of Intervention",
    href: "/what-we-do#areas",
    section: "areas",
  },
  { label: "Current Projects", href: "/what-we-do/current-projects" },
  { label: "Phased-out Projects", href: "/what-we-do/phased-out-projects" },
];

export function WhatWeDoNav() {
  const pathname = usePathname();
  const onOverview = pathname === "/what-we-do";

  /** Which section of the overview is in front of the reader. */
  const [visible, setVisible] = useState<string | null>(null);

  useEffect(() => {
    if (!onOverview) return;

    const sections = ITEMS.filter((item) => item.section)
      .map((item) => document.getElementById(item.section as string))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Last one to become visible wins, which going down the page is the
          // one being scrolled into and going up is the one being scrolled
          // back to. Both are the section the reader is looking at.
          if (entry.isIntersecting) setVisible(entry.target.id);
        }
      },
      {
        // A band across the middle of the viewport. The top margin clears the
        // header and the bar itself; the bottom keeps a section from counting
        // while it is still only a sliver at the foot of the screen.
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [onOverview]);

  const activeHref = (item: Item): boolean => {
    if (!onOverview) return pathname === item.href;
    if (!item.section) return false;
    // Before the first section is reached, the model is the default — it is
    // what the top of the page is about.
    return visible === null
      ? item.section === "fxbvillage-model"
      : visible === item.section;
  };

  return (
    <nav
      aria-label="What We Do"
      className="sticky top-[65px] z-30 border-b border-gray-15 bg-white lg:top-[73px]"
    >
      <Container>
        <ul className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 sm:-mx-6 sm:px-6 lg:mx-0 lg:gap-2 lg:px-0">
          {ITEMS.map((item) => {
            const current = activeHref(item);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={current ? "true" : undefined}
                  className={`relative flex items-center py-4 text-[15px] font-medium whitespace-nowrap transition-colors duration-300 lg:py-5 ${
                    current ? "text-blue" : "text-gray-80 hover:text-blue"
                  }`}
                >
                  <span className="px-3">{item.label}</span>
                  <span
                    className={`motion-size absolute inset-x-3 bottom-0 h-0.5 origin-left bg-green transition-transform duration-500 ease-(--ease-standard) ${
                      current ? "scale-x-100" : "scale-x-0"
                    }`}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}
