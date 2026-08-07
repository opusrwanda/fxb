"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

/**
 * Footer newsletter signup.
 *
 * Name and email side by side, with the action sitting inside the email field.
 *
 * Name was dropped from here once, and for a good reason: stacked above the
 * email with a separate button and a two-line consent statement, it left this
 * column running twice the depth of the nav columns beside it, and a signup
 * form should not be the tallest thing in a footer.
 *
 * It comes back because the constraint changed rather than because the reason
 * stopped being true. The block is six columns wide now instead of four, so
 * the two fields sit on one row and the form is exactly as tall with the name
 * as it was without it. Stack them again and the old problem returns.
 *
 * Underlined rather than boxed: inside a solid colour room a bordered box reads
 * as a hole punched in the surface, while a single rule carries the affordance
 * without adding another shape.
 *
 * The placeholder deliberately stays at the dimmer `white-70` rather than the
 * text-safe token. It duplicates the (screen-reader-only) label, so it is a
 * hint rather than content — and at full strength it reads as a value already
 * typed into the field, which is the worse failure.
 *
 * Posts to /api/newsletter, which refuses rather than pretends when no mailing
 * provider is configured — see the route for what needs setting.
 */
type State =
  | { status: "idle" | "sending" }
  | { status: "ok" | "error"; message: string };

export function NewsletterForm() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState({ status: "sending" });

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Consent is sent, not assumed. The tick is `required` so the browser
        // will not submit without it, but the route checks rather than infers
        // it — it is the one value here with legal weight.
        // `name`, not firstName/lastName: the route composes a display name
        // from the parts when the signup section sends them and falls back to
        // this single field, which is what keeps `source` reading "footer".
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          consent: data.get("consent") === "on",
        }),
      });
      const body = await response.json();

      setState(
        response.ok
          ? { status: "ok", message: body.message }
          : { status: "error", message: body.error }
      );
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      {/* One row from sm up, stacked below it. Two ruled fields at half width
          each read as a pair; stacked, they read as a queue. */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        <div>
          <label htmlFor="newsletter-name" className="sr-only">
            Your name
          </label>
          <input
            id="newsletter-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={160}
            placeholder="Your name"
            // Not `required`. The address is what a mailing list needs; a name
            // it can do without, and a field that blocks the submit is a field
            // that costs subscribers. The route never required it either.
            className="w-full border-b border-white-40 bg-transparent pb-3 text-base text-white transition-colors duration-300 outline-none placeholder:text-white-70 focus:border-white focus-visible:shadow-[0_2px_0_0_var(--color-white)]"
          />
        </div>

        <div className="relative">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          // Right padding clears the button sitting on top of the field.
          //
          // FOCUS
          //
          // The site-wide ring is a green outline inside a white halo, and the
          // halo is load-bearing: green on blue is 1.16:1, so inside a blue
          // room the ring alone cannot be seen. This field had `outline-none`
          // on it, which suppressed the green but left the halo behind — so
          // clicking it drew a plain white rectangle with nothing inside it.
          // That is not the ring, it is the half of the ring that carries no
          // meaning.
          //
          // A box is the wrong shape here anyway. This is a ruled field, not a
          // boxed one, so focus is said with the rule: the shadow redraws as a
          // 2px bar sitting directly under the 1px border, which reads as one
          // bright 3px underline. It is a shadow rather than a thicker border
          // so the field does not shift by a pixel as it lands, and it is
          // `focus-visible` so a mouse click does not summon it either.
          className="w-full border-b border-white-40 bg-transparent pb-3 pr-12 text-base text-white transition-colors duration-300 outline-none placeholder:text-white-70 focus:border-white focus-visible:shadow-[0_2px_0_0_var(--color-white)]"
        />
        <button
          type="submit"
          disabled={state.status === "sending"}
          aria-label="Sign up for the newsletter"
          className="absolute right-0 bottom-2 flex size-9 items-center justify-center rounded-full border border-white-40 text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-blue disabled:opacity-50"
        >
          <ArrowRight
            className={`size-4 ${state.status === "sending" ? "animate-pulse" : ""}`}
            aria-hidden="true"
          />
        </button>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-white-94">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 size-3.5 shrink-0 accent-green"
        />
        <span>
          I agree to receive emails from FXB Rwanda, in line with the{" "}
          <Link
            href="/privacy-policy"
            className="underline underline-offset-2 transition-colors duration-300 hover:text-white"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {/* Announced politely so the outcome reaches a screen reader without
          stealing focus mid-form. */}
      {(state.status === "ok" || state.status === "error") && (
        <p
          role="status"
          aria-live="polite"
          className={`text-xs leading-relaxed ${
            state.status === "error" ? "text-white" : "text-white-94"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
