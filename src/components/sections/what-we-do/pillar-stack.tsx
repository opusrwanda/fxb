"use client";

import { useEffect, useRef } from "react";

/**
 * The measuring half of the pillar stack.
 *
 * The stack itself is `position: sticky` and nothing else — see
 * `model-pillars.tsx`. What CSS cannot do on its own is answer the one
 * question the effect depends on: does a panel actually fit between the
 * header and the fold on *this* screen? A sticky panel taller than the room
 * it is pinned into hangs its bottom below the fold, and the next panel then
 * slides over the part nobody has read.
 *
 * That question has no CSS expression, because the offset would have to refer
 * to the element's own height and percentages in a sticky inset resolve
 * against the scrollport instead. So this component measures the panels and
 * writes the answer back as two custom properties on the list:
 *
 *   data-stack="on" | "off"   whether the panels stick at all
 *   --pillar-shift            how far every panel's resting offset moves up
 *
 * The shift is the honest part. On a 1512×982 display the panels fit under
 * the header with room to spare and the shift is zero — which is why this was
 * never noticed by anyone working on a large screen. On a 1440×900 laptop the
 * tallest panel overruns the fold by a few dozen pixels, and rather than
 * abandon the effect the whole stack simply pins that much higher: the top of
 * the first panel slides up under the header, and every panel's bottom edge
 * stays on screen. Only when even that is not enough — when pinning the stack
 * high enough would put a pillar's title behind the header — does the stack
 * turn itself off and the panels become ordinary blocks again.
 *
 * Before hydration, and with JavaScript off entirely, the CSS in
 * `globals.css` makes its own conservative guess from a height media query.
 * This only ever corrects it.
 */

/** Air left between the bottom of a pinned panel and the fold. */
const FOLD_GAP = 16;

/**
 * Air left between the pinned chrome and the title of a pinned panel.
 *
 * This is what limits the lift. A panel opens with its padding, its icon and
 * a gap before the title itself — on a short screen, where the panel is
 * tightened, about 92px — and all of that may pass under the header without
 * costing the reader a word. The title may not. So the stack lifts until the
 * first panel's title is this far clear of the chrome and no further; past
 * that point there is no version of the effect left to save, and the panels
 * stand down into ordinary blocks.
 */
const TITLE_CLEARANCE = 8;

/**
 * What stands pinned above the section: the 72px header bar, and the 64px
 * what-we-do sub-nav directly under it.
 *
 * Constants rather than a measurement, because at the moment this runs
 * neither element is at the height it will have when the reader gets there —
 * the header is still carrying its announcement strip and stands 128px tall,
 * and the sub-nav has not yet reached the top of the window. Measuring them
 * at scroll 0 would answer a question nobody asked. See `site-header.tsx` and
 * `what-we-do-nav.tsx`; the section's own `scroll-mt-36` is this same number
 * rounded up to the spacing scale.
 */
const PINNED_CHROME = 137;

export function PillarStack({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;

    const measure = () => {
      const panels = Array.from(list.children) as HTMLElement[];
      if (panels.length === 0) return;

      const room = window.innerHeight;
      const wide = window.matchMedia("(min-width: 1024px)").matches;

      // The offset each panel would rest at if there were room for all of
      // them, declared in the markup so the stepping lives in one place.
      const bases = panels.map(
        (panel) =>
          parseFloat(
            getComputedStyle(panel).getPropertyValue("--pillar-base")
          ) || 0
      );

      // Sticky does not change an element's height, so these are the heights
      // the panels have whether or not the stack is currently engaged.
      //
      // `lift` is the worst overrun: how far the tallest panel's bottom would
      // fall past the fold at its resting offset, and therefore how far the
      // whole stack has to move up for every panel to end on screen.
      const lift = panels.reduce((worst, panel, index) => {
        const overrun =
          bases[index] +
          panel.getBoundingClientRect().height +
          FOLD_GAP -
          room;
        return Math.max(worst, overrun);
      }, 0);

      // And how far it may move up before a title goes under the header. The
      // first panel rests highest, so it is the one that runs out first.
      const allowed = panels.reduce((limit, panel, index) => {
        const title = panel.querySelector("[data-pillar-title]");
        if (!title) return limit;
        const above =
          title.getBoundingClientRect().top -
          panel.getBoundingClientRect().top;
        return Math.min(
          limit,
          bases[index] + above - PINNED_CHROME - TITLE_CLEARANCE
        );
      }, Number.POSITIVE_INFINITY);

      const stacks = wide && lift <= allowed;

      list.dataset.stack = stacks ? "on" : "off";
      list.style.setProperty(
        "--pillar-shift",
        `${stacks ? Math.ceil(lift) : 0}px`
      );
    };

    measure();

    // The list's own height moves whenever a panel's does — a font swapping
    // in, an image settling, a staff edit to the copy in a preview. Watching
    // the list catches all of it with one observer.
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <ol ref={ref} className={className}>
      {children}
    </ol>
  );
}
