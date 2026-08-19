"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { field } from "@/components/ui/field";
import { Reveal } from "@/components/ui/reveal";

/**
 * Newsletter signup — the closing room.
 *
 * Sits below Latest News, as the last thing on the page before the footer, on
 * the pale blue tint rather than white or solid blue. Ground matters here more
 * than usual: it follows a white band and precedes the blue footer, so either
 * of the two obvious choices would have dissolved one of its own edges. The
 * tint is the only ground on the page that has a seam on both sides.
 *
 * Three fields and a consent tick, as asked. The footer keeps its one-field
 * version for every other page — see the note in `newsletter-form.tsx` for why
 * that one cannot grow.
 *
 * Posts to /api/newsletter, which refuses rather than pretends when no mailing
 * provider is configured. Until `NEWSLETTER_ENDPOINT` is set this form will
 * tell the visitor to email the office instead, which is the honest answer and
 * the one that still gets them on the list.
 */
type State =
  | { status: "idle" | "sending" }
  | { status: "ok" | "error"; message: string };

export function NewsletterSignup({
  copy,
}: {
  /**
   * The section's words, read by the page.
   *
   * This is a client component, so it cannot await them itself. The server
   * page that renders it does, and the defaults stay in the registry.
   */
  copy?: { eyebrow?: string; heading?: string; body?: string };
}) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ status: "sending" });

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          email: data.get("email"),
          // Sent, not assumed. The tick is `required` so the browser will not
          // submit without it, but consent is the one thing here with legal
          // weight and the server is entitled to see it rather than infer it.
          consent: data.get("consent") === "on",
        }),
      });
      const body = await response.json();

      if (response.ok) {
        setState({ status: "ok", message: body.message });
        form.reset();
      } else {
        setState({ status: "error", message: body.error });
      }
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <section id="newsletter" className="bg-blue-08 py-24 lg:py-32">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-5 lg:self-center">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                {copy?.eyebrow ?? "NEWSLETTER"}
              </span>
            </div>

            <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              {copy?.heading ?? "Keep up with the work"}
            </h2>

            {copy?.body && (
              <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-gray lg:text-[17px]">
                {copy.body}
              </p>
            )}
          </Reveal>

          {/* White card carrying the wedge. The tint is pale enough that fields
              drawn straight onto it would have almost no edge; the card gives
              them a ground to sit on and gives the section its one shape. */}
          <Reveal delay={140} className="lg:col-span-6 lg:col-start-7">
            <div className="wedge bg-white p-7 sm:p-9 lg:p-10">
              {state.status === "ok" ? (
                // The form is replaced rather than left standing under a
                // thank-you. A signup form still sitting there, now empty, asks
                // to be filled in again — the only honest thing to render once
                // it has done its job is the confirmation.
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-start gap-5 py-4"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-green-10">
                    <Check className="size-5 text-green" aria-hidden="true" />
                  </span>
                  <p className="max-w-[36ch] text-xl leading-snug font-semibold tracking-[-0.02em] text-blue">
                    {state.message}
                  </p>
                  <p className="text-[15px] leading-relaxed text-gray">
                    The next issue will reach you at the address you gave us.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-5">
                  {/* Side by side from the first breakpoint up. A given name and
                      a family name are one question asked twice, and stacking
                      them full width made the card read as a four-step form. */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="newsletter-first-name"
                        className="text-sm font-medium text-blue"
                      >
                        First name
                      </label>
                      <input
                        id="newsletter-first-name"
                        name="firstName"
                        required
                        autoComplete="given-name"
                        maxLength={80}
                        className={field}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="newsletter-last-name"
                        className="text-sm font-medium text-blue"
                      >
                        Last name
                      </label>
                      <input
                        id="newsletter-last-name"
                        name="lastName"
                        required
                        autoComplete="family-name"
                        maxLength={80}
                        className={field}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="newsletter-signup-email"
                      className="text-sm font-medium text-blue"
                    >
                      Email address
                    </label>
                    <input
                      id="newsletter-signup-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      maxLength={200}
                      className={field}
                    />
                  </div>

                  {/* Above the button, not beside or below it. Consent that a
                      visitor meets after the thing they came to press is
                      consent they scrolled past. */}
                  <label className="mt-1 flex items-start gap-3 text-[15px] leading-relaxed text-gray">
                    <input
                      type="checkbox"
                      name="consent"
                      required
                      className="mt-1 size-4 shrink-0 accent-green"
                    />
                    <span>
                      I agree to receive emails from FXB Rwanda, in line with
                      the{" "}
                      <Link
                        href="/privacy-policy"
                        className="text-blue underline underline-offset-2 transition-colors duration-300 hover:text-blue-90"
                      >
                        Privacy Policy
                      </Link>
                      . You can unsubscribe at any time.
                    </span>
                  </label>

                  <div className="mt-2 flex flex-col items-start gap-4">
                    <button
                      type="submit"
                      disabled={state.status === "sending"}
                      className="inline-flex items-center justify-center rounded-full bg-blue px-7 py-3 text-base font-medium whitespace-nowrap text-white transition-colors duration-300 hover:bg-blue-90 disabled:opacity-60"
                    >
                      {state.status === "sending"
                        ? "Signing you up…"
                        : "Sign Me Up"}
                    </button>

                    {/* Announced politely so the outcome reaches a screen reader
                        without stealing focus out of the form. */}
                    {state.status === "error" && (
                      <p
                        role="status"
                        aria-live="polite"
                        className="max-w-[46ch] text-[15px] leading-relaxed text-gray"
                      >
                        {state.message}
                      </p>
                    )}
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
