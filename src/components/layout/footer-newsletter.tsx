import { NewsletterForm } from "@/components/layout/newsletter-form";

/**
 * The footer's signup block.
 *
 * The form renders on every page, the home page included. It used to stand
 * down on the two routes that already carry the full `<NewsletterSignup />`
 * section — home and the newsletters page — and show a link up to that section
 * instead, on the grounds that two forms and two consent ticks a few hundred
 * pixels apart read as nobody having looked at the page.
 *
 * That reasoning was sound and the decision still went the other way: a footer
 * signup is where people go looking for a signup, and sending them back up the
 * page to a section they have already scrolled past is a worse trade than the
 * repetition. The footer is also the one part of the site a visitor meets on
 * every route, so it is the only place the form is guaranteed to be.
 *
 * The two forms do not collide. This one uses `newsletter-name` and
 * `newsletter-email`; the section uses `newsletter-first-name`,
 * `newsletter-last-name` and `newsletter-signup-email`, so no id is duplicated
 * and every label still points at its own field. Both post to the same route,
 * which records `source` either way.
 *
 * No longer a client component: the route was the only thing it needed, and it
 * does not need the route any more.
 */
export function FooterNewsletter() {
  return (
    // Six of the twelve columns, up from four. The row is signup 6 + two nav
    // columns at 2 + contact 2, so dropping Get Involved hands its width
    // straight to the form rather than leaving a gap — which is what lets the
    // name and email fields sit side by side without the block growing taller.
    <div className="sm:col-span-2 lg:col-span-3 xl:col-span-6">
      <h2 className="text-xl font-bold tracking-[-0.02em] lg:text-2xl">
        Sign up for our newsletter
      </h2>
      <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-white-94">
        Stories from the districts and the occasional annual report. A few times
        a year, no more.
      </p>

      <NewsletterForm />
    </div>
  );
}
