"use client";

import { useState } from "react";
import { field } from "@/components/ui/field";

/**
 * Applying for an opening.
 *
 * The whole reason the single page exists: a listing that printed every
 * vacancy in full had nowhere to put this, so applying meant finding an email
 * address elsewhere on the site and hoping the subject line was enough.
 *
 * Only what an application needs: who you are, how to reach you, why you are
 * writing, and your CV. No account, no covering-letter builder, no
 * "how did you hear about us" — the shortlist is made from the CV.
 *
 * The CV is optional in the form and required by nothing, because a person
 * applying from a phone in a district office may not have one to hand and a
 * message that says so is better than a form that will not submit. What
 * arrives without one still arrives.
 *
 * Posts multipart to /api/apply, which records the application before it tries
 * to email anyone — so the success message is true even when the mail server
 * is not answering. See the route.
 */
type State =
  | { status: "idle" | "sending" }
  | { status: "ok" | "error"; message: string };

export function ApplicationForm({
  opportunityId,
  title,
}: {
  opportunityId: number;
  /** Sent along so the notification email can name the post in its subject. */
  title: string;
}) {
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.append("opportunityId", String(opportunityId));
    data.append("title", title);
    setState({ status: "sending" });

    try {
      const response = await fetch("/api/apply", { method: "POST", body: data });
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
        message:
          "Your application could not be sent. Check your connection and try again — nothing has been lost from the form.",
      });
    }
  }

  // The form is replaced rather than left standing under a thank-you. Leaving
  // it there invites a second submission from anyone who is not certain the
  // first one worked, and two copies of one application is a worse outcome
  // than one.
  if (state.status === "ok") {
    return (
      <div className="wedge flex flex-col gap-4 bg-blue-08 p-8 lg:p-10">
        <h3 className="text-xl font-bold tracking-[-0.02em] text-blue">
          Application received
        </h3>
        <p role="status" className="max-w-[58ch] text-base leading-relaxed text-gray">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="apply-name" className="text-sm font-medium text-blue">
            Full name
          </label>
          <input
            id="apply-name"
            name="name"
            required
            autoComplete="name"
            maxLength={200}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="apply-email" className="text-sm font-medium text-blue">
            Email address
          </label>
          <input
            id="apply-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={255}
            className={field}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="apply-phone" className="text-sm font-medium text-blue">
          Phone number <span className="font-normal text-gray-80">(optional)</span>
        </label>
        <input
          id="apply-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={40}
          className={field}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="apply-cv" className="text-sm font-medium text-blue">
          Your CV <span className="font-normal text-gray-80">(optional)</span>
        </label>
        <p id="apply-cv-help" className="text-[13px] leading-relaxed text-gray-80">
          A PDF or Word document, up to 8MB. If you cannot attach one now, say
          so in your note below and we will write back for it.
        </p>
        <input
          id="apply-cv"
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-describedby="apply-cv-help"
          className={`${field} file:mr-4 file:rounded-full file:border-0 file:bg-blue file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-90`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="apply-message" className="text-sm font-medium text-blue">
          Why you are applying
        </label>
        <textarea
          id="apply-message"
          name="message"
          rows={6}
          maxLength={5000}
          className={`${field} resize-y`}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={state.status === "sending"}
          className="inline-flex items-center justify-center rounded-full bg-blue px-7 py-3 text-base font-medium whitespace-nowrap text-white transition-colors duration-300 hover:bg-blue-90 disabled:opacity-60"
        >
          {state.status === "sending" ? "Sending…" : "Submit application"}
        </button>

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
  );
}
