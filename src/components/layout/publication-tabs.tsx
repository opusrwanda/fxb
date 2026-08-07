"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * The category filter on Publications.
 *
 * The page stacked all four shelves — annual reports, project reports, policy
 * documents, brochures — one after another, so finding the Safeguarding Policy
 * meant scrolling past three shelves that were not it. Four kinds of document
 * with four different audiences is exactly what a filter is for.
 *
 * Chips, not underlined tabs. The section bar directly above this one already
 * uses tabs with a green underline, and two rows of the same control stacked on
 * top of each other would read as one confused navigation. A filter is a
 * different kind of thing and looks like one.
 *
 * The shelves arrive already rendered, as props. They are built on the server —
 * this component only chooses which one to show — so every publication stays in
 * the HTML for a crawler and none of the listing ships as JavaScript, whichever
 * chip happens to be selected.
 *
 * There is no "All". Four shelves stacked was the state this filter exists to
 * replace, so an option that restores it is an option to turn the filter off.
 * The first category is the default instead — annual reports, which is what
 * most people arrive at a publications page looking for.
 *
 * `#annual-reports` is linked from the header menu and from Our Impact, so the
 * hash is read on arrival and selects that category rather than being ignored.
 */
export type PublicationTab = { id: string; label: string; anchor: string };

export function PublicationTabs({
  tabs,
  shelves,
}: {
  tabs: PublicationTab[];
  shelves: Record<string, ReactNode>;
}) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  useEffect(() => {
    // Deep links land on a category. Matching on the anchor rather than the id
    // keeps the URLs the menu already points at working unchanged.
    //
    // Deferred a tick rather than set straight from the effect body, which is
    // the pattern the rest of the site uses and what the lint rule asks for.
    const anchor = window.location.hash.slice(1);
    if (!anchor) return;
    const match = tabs.find((tab) => tab.anchor === anchor);
    if (!match) return;

    const id = window.setTimeout(() => setActive(match.id), 0);
    return () => window.clearTimeout(id);
  }, [tabs]);

  function choose(tab: PublicationTab) {
    setActive(tab.id);
    // `replaceState`, not a hash assignment: setting the hash would scroll the
    // page to the shelf as it appears, yanking the filter out from under the
    // pointer that just used it.
    window.history.replaceState(null, "", `#${tab.anchor}`);
  }

  const shown = tabs.filter((tab) => tab.id === active);

  return (
    <>
      <div
        role="group"
        aria-label="Filter publications by type"
        className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0"
      >
        {tabs.map((tab) => (
          <FilterChip
            key={tab.id}
            current={active === tab.id}
            onClick={() => choose(tab)}
          >
            {tab.label}
          </FilterChip>
        ))}
      </div>

      <div className="mt-14 flex flex-col gap-16 lg:mt-16 lg:gap-20">
        {shown.map((tab) => (
          <div key={tab.id}>{shelves[tab.id]}</div>
        ))}
      </div>
    </>
  );
}

function FilterChip({
  current,
  onClick,
  children,
}: {
  current: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={current}
      onClick={onClick}
      className={`shrink-0 rounded-full px-5 py-2.5 text-[15px] font-medium whitespace-nowrap transition-colors duration-300 ${
        current
          ? "bg-blue text-white"
          : "bg-blue-08 text-gray hover:bg-blue-16 hover:text-blue"
      }`}
    >
      {children}
    </button>
  );
}
