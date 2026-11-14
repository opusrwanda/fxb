import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { clearPending } from "@/staff/auth/otp";
import { readResetLink } from "@/staff/auth/reset";
import { resetPassword } from "@/staff/queries/users";
import { PasswordField } from "@/staff/ui/password-field";
import { SubmitButton } from "@/staff/ui/submit-button";

export const metadata: Metadata = {
  title: "Choose a new password",
  // The address of this page is a credential until it is used. Keep it out of
  // any index, and out of the Referer header of whatever is clicked next.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Query = { u?: string; e?: string; t?: string; error?: string };

/**
 * Forgot your password, step two: choose the new one.
 *
 * The link is checked when the page is drawn and checked again when the form
 * is posted — the form carries the same three values back, and the second
 * check is the one that counts. Somebody who opened the page at minute
 * twenty-nine and typed slowly gets "that link has expired" rather than a
 * password set on the strength of a check made earlier.
 *
 * It does not sign the person in. They go back to the sign-in page and through
 * the emailed code like everybody else, which keeps one way in rather than two.
 */
async function choose(formData: FormData) {
  "use server";

  const query = {
    u: String(formData.get("u") ?? ""),
    e: String(formData.get("e") ?? ""),
    t: String(formData.get("t") ?? ""),
  };
  const here = `/staff/login/reset?u=${query.u}&e=${query.e}&t=${query.t}`;

  const user = await readResetLink(query);
  if (!user) redirect("/staff/login/reset");

  const result = await resetPassword(user.id, String(formData.get("password") ?? ""));
  if (!result.ok) redirect(`${here}&error=${encodeURIComponent(result.error)}`);

  // A half-finished sign-in in this browser belonged to the old password.
  await clearPending();
  redirect("/staff/login?changed=1");
}

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const query = await searchParams;
  const user = await readResetLink(query);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-linear-to-b from-blue-08 to-white px-6 py-16">
      <div className="w-full max-w-[26rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo-colour.png" alt="FXB Rwanda" className="mb-10 h-12 w-auto" />

        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue">
          Choose a new password
        </h1>

        {!user ? (
          <>
            <p
              role="alert"
              className="mt-6 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] leading-relaxed text-gray"
            >
              <strong className="font-semibold text-blue">
                That link no longer works.
              </strong>{" "}
              It may have expired — they last thirty minutes — or already been
              used. Ask for a new one.
            </p>
            <Link
              href="/staff/login/forgot"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
            >
              Send me a new link
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-base leading-relaxed text-gray">
              For {user.email}. At least 12 characters — four ordinary words is
              a good one.
            </p>

            {query.error && (
              <p
                role="alert"
                className="mt-6 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] leading-relaxed text-gray"
              >
                <strong className="font-semibold text-blue">Not changed.</strong>{" "}
                {query.error}
              </p>
            )}

            <form action={choose} className="mt-8 flex flex-col gap-5">
              <input type="hidden" name="u" value={query.u ?? ""} />
              <input type="hidden" name="e" value={query.e ?? ""} />
              <input type="hidden" name="t" value={query.t ?? ""} />

              <PasswordField
                label="New password"
                autoComplete="new-password"
                required
              />

              <SubmitButton
                pendingLabel="Saving…"
                className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90 disabled:bg-blue-90"
              >
                Save new password
              </SubmitButton>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
