"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Mail, Menu, Phone, Plus, X } from "lucide-react";
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
 * from 128px to 72px on desktop (96px to 64px on mobile) and the lockup
 * cross-fades from the white monochrome mark to the colour one. The lockup does
 * not change size with the bar — see the note on it below.
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
  const [pinned, setPinned] = useState(() => !hasTransparentHeader());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  /** href of the section whose hover panel is open, or null. Desktop only. */
  const [panel, setPanel] = useState<string | null>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const openPanel = primaryNav.find((item) => item.href === panel);

  // Reset on navigation, during render rather than in an effect, so the header
  // never paints the wrong state for a frame. The drawer closes with it.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setPinned(!hasTransparentHeader());
    setDrawerOpen(false);
    setExpanded(null);
    setPanel(null);
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

  // "Solid" treatment: the pinned bar, the bar above an open drawer — or the
  // bar with a hover panel under it.
  //
  // That last one is what stops the panel opening halfway down the screen. At
  // rest the header is 227px tall: announcement, utility strip and a 128px bar.
  // A panel hanging off the bottom of all that starts a third of the way down
  // the hero, nowhere near the link that opened it. Collapsing first puts the
  // bar at 73px and the panel directly beneath the words the pointer is on —
  // the same place it appears once the page has actually been scrolled, so the
  // menu behaves identically at the top of a page and in the middle of one.
  const solid = pinned || drawerOpen || panel !== null;

  return (
    <header
      // One leave handler for the whole header rather than one per nav item.
      // The pointer has to cross the gap between a link and the panel hanging
      // below it, and closing on the link's own mouseleave would shut the panel
      // in that gap every time. Escape closes it for the keyboard.
      onMouseLeave={() => setPanel(null)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setPanel(null);
      }}
      className={[
        "fixed inset-x-0 top-0 z-50 motion-size transition-[background-color,box-shadow,border-color] duration-500 ease-(--ease-standard)",
        // `solid`, not `pinned`. The logo and the nav links already switched on
        // `solid`, so keying the fill off `pinned` meant a hover at the top of
        // a page collapsed the bar and darkened its type while leaving the
        // ground transparent — grey links on the hero footage.
        drawerOpen
          ? "bg-blue"
          : solid
            ? "border-b border-gray-15 bg-white shadow-[0_2px_24px_rgba(83,83,83,0.10)]"
            : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      {/* The announcement and the utility strip both belong to the rest state
          only; once the page moves they collapse away, and they come back the
          moment the visitor returns to the top.

          What the banner no longer has is a close button. Collapsing on scroll
          and being dismissed are two different things: the first is the
          announcement getting out of the way of the reading, the second was the
          reader deleting it for the rest of the visit. It is at the top of
          every page, which is what it was asked to be; it is not also in the
          way of every scroll, and it is not something anybody can switch off.

          The banner collapsing with the strip is also what keeps the pinned bar
          a fixed height, which the two sticky navigation bars — SectionNav and
          SubNav — pin against by number. */}
      <div
        className={[
          "overflow-hidden transition-[max-height,opacity] duration-500 ease-(--ease-standard)",
          solid ? "max-h-0 opacity-0" : "max-h-40 opacity-100",
        ].join(" ")}
        aria-hidden={solid}
      >
        <AnnualReportBanner report={report} />

        {/* Utility strip. Everything in it sits at the right-hand end, one step
            down in size from the primary nav so it reads as secondary to it. */}
        <Container className="hidden items-center justify-end gap-7 border-b border-white-12 pt-5 pb-4 text-sm font-medium text-white-94 lg:flex">
          <Link
            href="/get-involved/partners"
            className="transition-colors duration-300 hover:text-white"
            tabIndex={solid ? -1 : 0}
          >
            Partner With Us
          </Link>
          <Link
            href="/contact"
            className="transition-colors duration-300 hover:text-white"
            tabIndex={solid ? -1 : 0}
          >
            Contact Us
          </Link>
          <a
            href={`tel:${details.phoneHref}`}
            className="flex items-center gap-2 transition-colors duration-300 hover:text-white"
            tabIndex={solid ? -1 : 0}
          >
            <Phone className="size-3.5" aria-hidden="true" />
            {details.phone}
          </a>
        </Container>
      </div>

      {/* The bar itself. */}
      <Container
        className={[
          "motion-size flex items-center gap-3 transition-[height] duration-500 sm:gap-6",
          "ease-(--ease-header)",
          solid ? "h-16 lg:h-18" : "h-24 lg:h-32",
        ].join(" ")}
      >
        {/* The lockup is the same size in both states.

            It used to be scaled to 0.68 once the bar pinned, which left the
            colour mark 38px tall on desktop and 27px on a phone — the version
            of the logo a visitor spends almost the whole visit looking at, and
            the smallest it ever got. At full size it is 56px and 40px inside a
            72px and 64px bar, so it still clears the edges by 8px and 12px.

            Nothing here changes the height of the header. The shrink was a
            `transform`, and a transform does not take part in layout: the bar
            is sized by `h-16 lg:h-18` above and measures 64px and 72px either
            way. */}
        <Link
          href="/"
          aria-label={`${details.name} — home`}
          className="relative shrink-0"
        >
          {/* Both lockups are rendered and cross-faded, so the swap never reads
              as two solid marks at once. */}
          <span
            className="block transition-opacity duration-300 delay-[112ms] ease-(--ease-standard)"
            style={{ opacity: solid ? 0 : 1 }}
          >
            <Logo variant="white" alt="" priority className="h-10 lg:h-14" />
          </span>
          <span
            className="absolute inset-0 flex items-center transition-opacity duration-300 delay-[112ms] ease-(--ease-standard)"
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
            const hasPanel = Boolean(item.children?.length);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                // The panel opens on hover and on focus, and the whole bar
                // shares one open item — so moving sideways along the nav
                // swaps the panel rather than closing and reopening it.
                onMouseEnter={() => setPanel(hasPanel ? item.href : null)}
                onFocus={() => setPanel(hasPanel ? item.href : null)}
                aria-expanded={hasPanel ? panel === item.href : undefined}
                className={[
                  "border-b-3 pt-2.5 pb-2.5 text-sm whitespace-nowrap transition-colors duration-500 ease-(--ease-standard) xl:text-base",
                  active || panel === item.href ? "font-semibold" : "font-medium",
                  solid
                    ? active || panel === item.href
                      ? "border-green text-blue"
                      : "border-transparent text-gray hover:text-blue"
                    : active || panel === item.href
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
              "rounded-full px-5 py-2.5 text-[19px] font-bold whitespace-nowrap transition-colors duration-300 sm:px-6 sm:py-3 lg:px-7 lg:py-3.5",
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

      {/* The hover panel: the section's children, one click from the bar.
          Desktop only — the drawer below already gives a phone the same list,
          and there is no hover on a touch screen to open this with.

          Rendered whether or not it is open, and hidden with opacity and
          `invisible` rather than by unmounting, so the fade has something to
          fade. `invisible` is what keeps it out of the tab order and off the
          pointer while it is closed; `hidden` would kill the transition and
          `opacity-0` alone would leave an invisible sheet swallowing clicks
          across the whole page. */}
      <div
        className={[
          "absolute inset-x-0 top-full hidden border-b border-white-12 bg-blue lg:block",
          "motion-transform transition-[opacity,translate] duration-500 ease-(--ease-standard)",
          openPanel && !drawerOpen
            ? "translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0",
          // Wait for the bar to finish collapsing before fading in, but only
          // when there is a collapse to wait for. Opening a panel on a page
          // that is already scrolled has nothing to wait on, and a delay there
          // is just a menu that feels slow to answer.
          openPanel && !pinned ? "delay-300" : "delay-0",
        ].join(" ")}
        onMouseEnter={() => openPanel && setPanel(openPanel.href)}
        aria-hidden={!openPanel}
      >
        {openPanel && (
          <Container className="grid gap-10 py-12 lg:grid-cols-12 lg:gap-16">
            {/* Left: what the section is, and the way into it. */}
            <div className="flex flex-col items-start gap-5 lg:col-span-4">
              <p className="text-2xl font-bold tracking-[-0.02em] text-white">
                {openPanel.label}
              </p>
              {openPanel.blurb && (
                <p className="max-w-[34ch] text-[15px] leading-relaxed font-light text-white-94">
                  {openPanel.blurb}
                </p>
              )}
              <Link
                href={openPanel.href}
                aria-label={`${openPanel.label} — section overview`}
                tabIndex={openPanel ? 0 : -1}
                className="mt-1 flex size-11 items-center justify-center rounded-full border border-white-40 text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-blue"
              >
                <ArrowRight className="size-4.5" aria-hidden="true" />
              </Link>
            </div>

            {/* Right: the children, which is the whole point of the panel —
                a visitor who already knows they want Careers should not have
                to land on Get Involved first and look for it. */}
            <ul className="lg:col-span-5 lg:border-l lg:border-white-12 lg:pl-16">
              {openPanel.children?.map((child) => (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    tabIndex={openPanel ? 0 : -1}
                    className="group flex items-center justify-between gap-8 border-b border-white-12 py-3.5 text-[15px] font-medium text-white transition-colors duration-300 last:border-b-0 hover:text-white-70"
                  >
                    {child.label}
                    <ArrowRight
                      className="size-4 shrink-0 transition-transform duration-300 ease-(--ease-standard) group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        )}
      </div>

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
                      className="-mr-2.5 flex size-11 shrink-0 items-center justify-center text-white-94 transition-colors duration-300 hover:text-white"
                    >
                      <Plus
                        className={`size-6 transition-transform duration-500 ease-(--ease-standard) ${
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

        {/* The drawer used to end with ~150px of empty blue under the staff
            links. On a phone that is the most valuable space in the menu — the
            thumb is already there — so it carries the number to call and the
            address to write to instead of nothing. */}
        <div className="mt-9 flex flex-col gap-1 border-t border-white-12 pt-6">
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
