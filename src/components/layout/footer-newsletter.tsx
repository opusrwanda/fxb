"use client";

import { usePathname } from "next/navigation";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { Pill } from "@/components/ui/pill";

/**
 * The footer's signup block, and the pages where it stands down.
 *
 * The footer form is the site-wide catch: on Contact, Careers, Our Impact and
 * everywhere else it is the only place a visitor can subscribe, so it stays.
 *
 * The exceptions are the pages that already carry the full signup section. On
 * those, rendering the form again puts two newsletter forms, two consent ticks
 * and two near-identical consent sentences on the same screen, a couple of
 * hundred pixels apart. That does not read as thorough, it reads as nobody
 * having looked at the page.
 *
 * On those routes the block keeps its heading, its copy and its place in the
 * grid — pulling it out entirely would leave four blocks in a twelve-column row
 * and throw the whole footer off balance — and swaps the form for a link to the
 * real one further up the page.
 *
 * `usePathname` rather than a prop: the footer is server-rendered from the root
 * layout, which has no route to pass down. The header resolves its own
 * transparent state the same way.
 */

/**
 * Routes whose page already renders `<NewsletterSignup />`.
 *
 * This list has to stay in step with the pages that render it — the same
 * contract, and the same hazard, as `TRANSPARENT_HEADER_ROUTES` in `site.ts`.
 */
const ROUTES_WITH_SIGNUP = ["/", "/news-insights/newsletters"];

export function FooterNewsletter() {
  const hasSignup = ROUTES_WITH_SIGNUP.includes(usePathname());

  return (
    <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
      <h2 className="text-xl font-bold tracking-[-0.02em] lg:text-2xl">
        Sign up for our newsletter
      </h2>
      <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-white-94">
        Stories from the districts and the occasional annual report. A few times
        a year, no more.
      </p>

      {hasSignup ? (
        <Pill
          href="#newsletter"
          variant="outlineLight"
          size="sm"
          className="mt-6"
        >
          Sign up
        </Pill>
      ) : (
        <NewsletterForm />
      )}
    </div>
  );
}
