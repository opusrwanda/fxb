"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/container";

/**
 * Navigation across a section's own pages.
 *
 * The sibling of `SectionNav`, and deliberately a separate component rather
 * than a mode on it. They look identical and do different things: `SectionNav`
 * moves you within one long page and works out where you are from an
 * IntersectionObserver, this moves you between pages and works it out from the
 * route. Folding both into one component would mean a prop that switches which
 * half of the file runs, which is two components in a trench coat.
 *
 * News & Insights is the case that needs it: news, stories, publications and
 * newsletters were only reachable from each other by going back to the header
 * menu every time.
 *
 * Entries match on prefix, so an article at `/news-insights/news/<slug>` lights
 * "Latest News" rather than nothing.
 *
 * A route that matches no entry falls back to the first one. That is what the
 * hub needs: `/news-insights` is the section's landing page rather than a
 * destination of its own, and it used to have an "Overview" tab of its own to
 * say so. The tab was the wrong answer — it made the reader's first choice a
 * choice about navigation rather than about content, and "Overview" is not a
 * thing anyone came here to read. The bar now opens on Latest News, which is
 * what the page is actually showing.
 */
export type SubNavItem = { href: string; label: string };

export function SubNav({
  items,
  ariaLabel = "Section",
}: {
  items: SubNavItem[];
  ariaLabel?: string;
}) {
  const pathname = usePathname();

  const matched = items.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  // No entry owns this route — the hub. Fall back to the first tab. See above.
  const activeIndex = matched === -1 ? 0 : matched;

  return (
    <nav
      aria-label={ariaLabel}
      className="sticky top-[65px] z-30 border-b border-gray-15 bg-white lg:top-[73px]"
    >
      <Container>
        <ul className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 sm:-mx-6 sm:px-6 lg:mx-0 lg:gap-2 lg:px-0">
          {items.map((item, index) => {
            const current = index === activeIndex;

            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`relative flex items-center py-4 text-[15px] font-medium whitespace-nowrap transition-colors duration-200 lg:py-5 ${
                    current ? "text-blue" : "text-gray-80 hover:text-blue"
                  }`}
                >
                  <span className="px-3">{item.label}</span>
                  <span
                    className={`motion-size absolute inset-x-3 bottom-0 h-0.5 origin-left bg-green transition-transform duration-300 ease-out ${
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

/**
 * The News & Insights routes, in the order the header menu lists them.
 *
 * Latest News is first, and being first is what makes it the default: the hub
 * matches no entry, so it lights this one.
 */
export const newsInsightsNav: SubNavItem[] = [
  { href: "/news-insights/news", label: "Latest News" },
  { href: "/news-insights/stories", label: "Stories" },
  { href: "/news-insights/publications", label: "Publications" },
  { href: "/news-insights/newsletters", label: "Newsletters" },
];
