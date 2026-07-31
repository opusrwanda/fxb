"use client";

import { useState } from "react";

/**
 * The contact form.
 *
 * Fields are exactly the ones the brief lists: full name, email, phone
 * (optional), subject, message. Nothing else is collected — a form on an NGO
 * site should not be a data-gathering exercise.
 *
 * Posts to /api/contact, which refuses rather than pretends when no mail
 * provider is configured. On that refusal the visitor gets the office address
 * in the error itself, so the message still has somewhere to go.
 *
 * Validation is the browser's: `required`, `type="email"`, and the server
 * checking again. A bespoke validator here would only duplicate what the
 * platform already does well and announces properly.
 */
type State =
  | { status: "idle" | "sending" }
  | { status: "ok" | "error"; message: string };

const field =
  "w-full rounded-card border border-gray-15 bg-white px-5 py-3.5 text-base text-gray transition-colors duration-200 outline-none placeholder:text-gray-80 focus:border-blue";

export function ContactForm() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ status: "sending" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          subject: data.get("subject"),
          message: data.get("message"),
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-name"
            className="text-sm font-medium text-blue"
          >
            Full name
          </label>
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            maxLength={120}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-email"
            className="text-sm font-medium text-blue"
          >
            Email address
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={200}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-phone"
            className="text-sm font-medium text-blue"
          >
            Phone number{" "}
            <span className="font-normal text-gray-80">(optional)</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-subject"
            className="text-sm font-medium text-blue"
          >
            Subject
          </label>
          <input
            id="contact-subject"
            name="subject"
            maxLength={200}
            className={field}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact-message"
          className="text-sm font-medium text-blue"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          maxLength={5000}
          className={`${field} resize-y`}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={state.status === "sending"}
          className="inline-flex items-center justify-center rounded-full bg-blue px-7 py-3 text-base font-medium whitespace-nowrap text-white transition-colors duration-200 hover:bg-blue-90 disabled:opacity-60"
        >
          {state.status === "sending" ? "Sending…" : "Send Message"}
        </button>

        {/* Announced politely so the outcome reaches a screen reader without
            stealing focus out of the form. */}
        {(state.status === "ok" || state.status === "error") && (
          <p
            role="status"
            aria-live="polite"
            className={`max-w-[46ch] text-[15px] leading-relaxed ${
              state.status === "error" ? "text-gray" : "text-blue"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
