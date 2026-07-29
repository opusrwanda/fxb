"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

/**
 * Footer newsletter signup.
 *
 * One field, with the action sitting inside it. The earlier version stacked a
 * name, an email, a two-line consent statement and a separate button, which
 * left this column running twice the depth of the nav columns beside it — a
 * signup form should not be the tallest thing in a footer. Name is dropped
 * (nothing is personalised with it yet), the button moved into the field, and
 * consent reduced to a single line.
 *
 * Underlined rather than boxed: inside a solid colour room a bordered box reads
 * as a hole punched in the surface, while a single rule carries the affordance
 * without adding another shape.
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
        body: JSON.stringify({ email: data.get("email") }),
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
          className="w-full border-b border-white-40 bg-transparent pb-3 pr-12 text-base text-white transition-colors duration-200 outline-none placeholder:text-white-40 focus:border-white"
        />
        <button
          type="submit"
          disabled={state.status === "sending"}
          aria-label="Sign up for the newsletter"
          className="absolute right-0 bottom-2 flex size-9 items-center justify-center rounded-full border border-white-40 text-white transition-colors duration-200 hover:border-white hover:bg-white hover:text-blue disabled:opacity-50"
        >
          <ArrowRight
            className={`size-4 ${state.status === "sending" ? "animate-pulse" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-white-40">
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
            className="underline underline-offset-2 transition-colors duration-200 hover:text-white"
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
            state.status === "error" ? "text-white" : "text-white-70"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
