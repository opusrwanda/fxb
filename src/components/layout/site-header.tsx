"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Mail, Menu, Phone, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { AnnualReportBanner } from "@/components/layout/annual-report-banner";
import { Container } from "@/components/layout/container";
import type { SiteDetails } from "@/cms/content/settings";
import { hasTransparentHeader, primaryNav } from "@/lib/site";

/**
 * Site header — two states, one continuous transition.
 *
 * Rest (scroll 0): no fill, no border, no shadow, drawn straight onto the hero
 * footage in the white monochrome lockup.
 *
 * Pinned (past 64px): white fill, gray hairline, soft shadow. The bar collapses
 * from 128px to 72px on desktop (96px to 64px on mobile) and the logo scales to
 * 0.68 while cross-fading to the colour lockup.
 *
 * The bar never auto-hides on scroll down: the brief requires Donate reachable
 * at any point in the visit, so reclaiming vertical space is not available to
 * us. See fxbdesign.pen, "HEADER — states & spec".
 */
export function SiteHeader({
  details,
  report,
}: {
  /** The contact details and external systems, from the CMS. */
  details: SiteDetails;
  /** The newest annual report, for the announcement. Null when there is none. */
  report: { title: string; slug: string } | null;
}) {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(() => !hasTransparentHeader(pathname));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Reset on navigation, during render rather than in an effect, so the header
  // never paints the wrong state for a frame. The drawer closes with it.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setPinned(!hasTransparentHeader(pathname));
    setDrawerOpen(false);
    setExpanded(null);
  }

  // Pin state, driven by the sentinels a hero section renders. Both observers
  // fire an initial callback on observe, so the rest state is established
  // without any synchronous set-up call here.
  useEffect(() => {
    const on = document.querySelector('[data-header-sentinel="on"]');
    const off = document.querySelector('[data-header-sentinel="off"]');

    // No hero on this page: the header stays solid from the top.
    if (!on || !off) return;

    const observerOn = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPinned(true);
    });
    const observerOff = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPinned(false);
    });
    observerOn.observe(on);
    observerOff.observe(off);

    return () => {
      observerOn.disconnect();
      observerOff.disconnect();
    };
  }, [pathname]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setExpanded(null);
  }, []);

  // Lock body scroll, trap focus and wire Escape while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
        burgerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen, closeDrawer]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  // "Solid" treatment: the pinned bar, or the bar sitting above an open drawer.
  const solid = pinned || drawerOpen;

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 motion-size transition-[background-color,box-shadow,border-color] duration-[240ms] ease-out",
        drawerOpen
          ? "bg-blue"
          : pinned
            ? "border-b border-gray-15 bg-white shadow-[0_2px_24px_rgba(83,83,83,0.10)]"
            : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      {/* The announcement and the utility strip both belong to the rest state
          only; once the page moves they are gone until the visitor returns to
          the top.

          The banner collapsing with them is deliberate rather than incidental.
          A banner that stayed would make the pinned bar permanently taller, and
          the two sticky navigation bars — SectionNav and SubNav — pin against
          that height by number. Every one of them would have had to become
          dynamic, and would still have jumped the moment anybody pressed the
          dismiss button. The announcement is at the top of every page, which is
          what it was asked to be; it is not also in the way of every scroll. */}
      <div
        className={[
          "overflow-hidden transition-[max-height,opacity] duration-[240ms] ease-out",
          solid ? "max-h-0 opacity-0" : "max-h-40 opacity-100",
        ].join(" ")}
        aria-hidden={solid}
      >
        <AnnualReportBanner report={report} />

        <Container className="hidden items-center gap-9 border-b border-white-12 pt-5 pb-4 text-base font-medium text-white-94 lg:flex">
          {details.externalSystems.map((system) => (
            <a
              key={system.label}
              href={system.href}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-1.5 transition-colors duration-200 hover:text-white"
              tabIndex={solid ? -1 : 0}
            >
              {system.label}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          ))}
          <a
            href={`tel:${details.phoneHref}`}
            className="ml-auto flex items-center gap-2 transition-colors duration-200 hover:text-white"
            tabIndex={solid ? -1 : 0}
          >
            <Phone className="size-4" aria-hidden="true" />
            {details.phone}
          </a>
        </Container>
      </div>

      {/* The bar itself. */}
      <Container
        className={[
          "motion-size flex items-center gap-3 transition-[height] duration-[280ms] sm:gap-6",
          "ease-(--ease-header)",
          solid ? "h-16 lg:h-18" : "h-24 lg:h-32",
        ].join(" ")}
      >
        <Link
          href="/"
          aria-label={`${details.name} — home`}
          className="motion-transform relative shrink-0 origin-left transition-transform duration-[280ms] ease-(--ease-header)"
          style={{ transform: solid ? "scale(0.68)" : "scale(1)" }}
        >
          {/* Both lockups are rendered and cross-faded, so the swap never reads
              as two solid marks at once. */}
          <span
            className="block transition-opacity duration-[160ms] delay-[112ms] ease-out"
            style={{ opacity: solid ? 0 : 1 }}
          >
            <Logo variant="white" alt="" priority className="h-10 lg:h-14" />
          </span>
          <span
            className="absolute inset-0 flex items-center transition-opacity duration-[160ms] delay-[112ms] ease-out"
            style={{ opacity: solid ? 1 : 0 }}
            aria-hidden="true"
          >
            <Logo
              variant={drawerOpen ? "white" : "colour"}
              alt=""
              priority
              className="h-10 lg:h-14"
            />
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-4 lg:flex xl:gap-7"
        >
          {primaryNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "border-b-3 pt-2.5 pb-2.5 text-sm whitespace-nowrap transition-colors duration-[240ms] ease-out xl:text-base",
                  active ? "font-semibold" : "font-medium",
                  solid
                    ? active
                      ? "border-green text-blue"
                      : "border-transparent text-gray hover:text-blue"
                    : active
                      ? "border-white text-white"
                      : "border-transparent text-white hover:border-white-40",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3 lg:ml-0 lg:gap-5">
          {/* The search control was removed rather than restyled: it had no
              handler, so it sat in the keyboard tab order announcing itself as
              a button and then doing nothing — worse than absent. There is no
              search index behind this site yet. Reinstate it here when there
              is one. */}

          {/* Donate is the one control that never changes and never moves.
              Set at 19px bold because white on #008d00 is 4.37:1: below the
              4.5:1 body-text threshold, but comfortably past the 3:1 that
              large bold text is held to. The primary conversion action wanting
              to be bigger is not exactly a hardship. */}
          <Link
            href="/get-involved/donate"
            className={[
              "rounded-full px-5 py-2.5 text-[19px] font-bold whitespace-nowrap transition-colors duration-200 sm:px-6 sm:py-3 lg:px-7 lg:py-3.5",
              drawerOpen
                ? "bg-white text-blue hover:bg-white-70"
                : "bg-green text-white hover:bg-green/90",
            ].join(" ")}
          >
            Donate
          </Link>

          <button
            ref={burgerRef}
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            className={[
              // 44px, not 32. This is the only way through the site on a
              // phone and it was a third under the minimum comfortable touch
              // target — the negative margin keeps the glyph optically where it
              // was, so the target grows without the bar shifting.
              "-mr-2.5 flex size-11 shrink-0 items-center justify-center lg:hidden",
              solid && !drawerOpen ? "text-blue" : "text-white",
            ].join(" ")}
          >
            {drawerOpen ? (
              <X className="size-7" aria-hidden="true" />
            ) : (
              <Menu className="size-7" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      {/* Mobile drawer: full-screen blue panel. */}
      <Container
        id="mobile-nav"
        ref={drawerRef}
        hidden={!drawerOpen}
        className="h-[calc(100dvh-4rem)] overflow-y-auto bg-blue pt-7 pb-16 lg:hidden"
      >
        <nav aria-label="Mobile">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.href} className="border-b border-white-12">
                {/* Padding on the anchor, not on this row. It used to sit
                    here, which made the row look 68px tall while the actual
                    tap target was only the height of the text — a miss above
                    or below the words did nothing. */}
                <div className="flex items-center gap-4">
                  <Link
                    href={item.href}
                    className="flex-1 py-5 text-[28px] font-medium text-white"
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((current) =>
                          current === item.href ? null : item.href
                        )
                      }
                      aria-expanded={expanded === item.href}
                      aria-label={`${expanded === item.href ? "Collapse" : "Expand"} ${item.label}`}
                      // 44px around a 24px glyph. It was the bare icon, which
                      // put a 24px target next to an 82px one on the same row —
                      // and this is the control that reveals the section pages,
                      // so missing it looks like the menu simply has no depth.
                      className="-mr-2.5 flex size-11 shrink-0 items-center justify-center text-white-94 transition-colors duration-200 hover:text-white"
                    >
                      <Plus
                        className={`size-6 transition-transform duration-[240ms] ease-out ${
                          expanded === item.href ? "rotate-45" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
                {item.children && expanded === item.href && (
                  <ul className="pb-5 pl-1">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block py-3 text-lg text-white-94"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-9 flex flex-col gap-4">
          {details.externalSystems.map((system) => (
            <a
              key={system.label}
              href={system.href}
              target="_blank"
              rel="noreferrer noopener"
              // Padded to a 44px row like the nav links above. These were
              // the last two 26px targets left in the drawer.
              className="flex items-center gap-2.5 py-2.5 text-[17px] font-medium text-white-94"
            >
              {system.label}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          ))}
        </div>

        {/* The drawer used to end with ~150px of empty blue under the staff
            links. On a phone that is the most valuable space in the menu — the
            thumb is already there — so it carries the number to call and the
            address to write to instead of nothing. */}
        <div className="mt-10 flex flex-col gap-1 border-t border-white-12 pt-6">
          <a
            href={`tel:${details.phoneHref}`}
            className="flex items-center gap-3 py-2.5 text-[17px] font-medium text-white"
          >
            <Phone className="size-5 shrink-0" aria-hidden="true" />
            {details.phone}
          </a>
          <a
            href={`mailto:${details.email}`}
            className="flex items-center gap-3 py-2.5 text-[17px] font-medium text-white"
          >
            <Mail className="size-5 shrink-0" aria-hidden="true" />
            {details.email}
          </a>
        </div>
      </Container>
    </header>
  );
}
