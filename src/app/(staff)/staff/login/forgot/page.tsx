import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { findForReset, mayRequestReset, resetPath } from "@/staff/auth/reset";
import { currentUser } from "@/staff/auth/session";
import { sendPasswordReset } from "@/staff/mail/password-reset";
import { mailConfig } from "@/staff/mail/transport";
import { SubmitButton } from "@/staff/ui/submit-button";

export const metadata: Metadata = { title: "Forgot your password" };

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://fxbrwanda.org";

/**
 * Forgot your password, step one: say which account.
 *
 * ONE ANSWER, WHATEVER WAS TYPED. The page says a link is on its way if the
 * address has an account, and says exactly that for an address that has none,
 * one that was asked for a minute ago, and one the mail server refused. A form
 * that answers "no such account" is a way to find out who works here.
 *
 * Until this existed the only way back in was an admin setting a new password
 * by hand and passing it across a desk — which is two people knowing it, and
 * no way back in at all for the admin.
 */
async function request(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/staff/login/forgot");

  if (mayRequestReset(email)) {
    const user = await findForReset(email);
    if (user) await sendPasswordReset(user.email, user.name, SITE + resetPath(user));
  }

  redirect("/staff/login/forgot?sent=1");
}

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  if (await currentUser()) redirect("/staff");

  const { sent } = await searchParams;
  const connected = mailConfig() !== null;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-linear-to-b from-blue-08 to-white px-6 py-16">
      <div className="w-full max-w-[26rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/logo-colour.png" alt="FXB Rwanda" className="mb-10 h-12 w-auto" />

        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue">
          Forgot your password
        </h1>

        {sent ? (
          <p
            role="status"
            className="mt-6 rounded-card border border-green/30 bg-green-10 px-5 py-4 text-[15px] leading-relaxed text-gray"
          >
            <strong className="font-semibold text-green">Check your email.</strong>{" "}
            If that address has an account here, a link to choose a new
            password is on its way. It works for thirty minutes. Nothing
            arrived? Look in spam, or wait two minutes and ask again.
          </p>
        ) : !connected ? (
          // The one case where saying "check your email" would be a lie.
          <p
            role="alert"
            className="mt-6 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] leading-relaxed text-gray"
          >
            <strong className="font-semibold text-blue">
              Email is not connected on this server,
            </strong>{" "}
            so a reset link cannot be sent. Ask an admin to set a new password
            for you under Users.
          </p>
        ) : (
          <>
            <p className="mt-3 text-base leading-relaxed text-gray">
              Enter the email address on your account and we will send you a
              link to choose a new password.
            </p>

            <form action={request} className="mt-8 flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-blue">Email address</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  className="h-12 rounded-card border border-gray-15 bg-white px-4 text-base text-gray transition-colors duration-300 outline-none focus:border-blue"
                />
              </label>

              <SubmitButton
                pendingLabel="Sending the link…"
                className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90 disabled:bg-blue-90"
              >
                Send me a link
              </SubmitButton>
            </form>
          </>
        )}

        <p className="mt-8 border-t border-gray-15 pt-6 text-sm">
          <Link
            href="/staff/login"
            className="font-semibold text-blue underline underline-offset-4 transition-colors duration-300 hover:text-green"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
