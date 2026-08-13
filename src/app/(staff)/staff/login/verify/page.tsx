import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  clearPending,
  issueCode,
  pendingLogin,
  resendWaitMs,
  verifyCode,
} from "@/staff/auth/otp";
import { createSession, currentUser } from "@/staff/auth/session";
import { sendLoginCode } from "@/staff/mail/login-code";

export const metadata: Metadata = { title: "Enter your code" };

/**
 * Sign in, step two of two.
 *
 * The password has been accepted and a six-digit code is in the account's
 * mailbox. Nothing has been granted yet: there is a row in `login_codes` and a
 * cookie pointing at it, and `currentUser` does not look at either. Somebody
 * who stops here is not signed in to anything.
 *
 * The address is shown partly masked. Whoever is here has already proved they
 * know the password, so the mailbox is not news to them — but the point of
 * showing it is "the code went to the account you expect", and printing the
 * whole address in full would put it on screen in an open-plan office for the
 * benefit of nobody.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; resent?: string }>;
}) {
  if (await currentUser()) redirect("/staff");

  const { error, resent } = await searchParams;

  const pending = await pendingLogin();
  // No code in flight — expired, used, or somebody arrived here directly.
  // Back to the start, which is the only thing this page can offer.
  if (!pending) redirect("/staff/login");

  const wait = resendWaitMs(pending);

  async function check(formData: FormData) {
    "use server";

    const result = await verifyCode(String(formData.get("code") ?? ""));

    if (!result.ok) {
      // Out of attempts, or the code expired mid-flight. There is nothing to
      // return to on this page, so the message is carried back to the sign-in.
      if (result.expired) {
        redirect(`/staff/login?error=${encodeURIComponent(result.error)}`);
      }
      redirect(`/staff/login/verify?error=${encodeURIComponent(result.error)}`);
    }

    // Only now does a session exist.
    await createSession(result.userId);
    await clearPending();
    redirect("/staff");
  }

  async function resend() {
    "use server";

    const current = await pendingLogin();
    if (!current) redirect("/staff/login");

    // The cooldown is enforced here and not only by the disabled button. The
    // button is markup; this is the rule.
    if (resendWaitMs(current) > 0) {
      redirect(
        `/staff/login/verify?error=${encodeURIComponent("Wait a moment before asking for another code.")}`,
      );
    }

    const code = await issueCode(current.userId);
    const sent = await sendLoginCode(current.email, current.name, code);

    if (!sent.ok) {
      redirect(
        `/staff/login/verify?error=${encodeURIComponent(sent.error ?? "")}`,
      );
    }

    redirect("/staff/login/verify?resent=1");
  }

  async function startOver() {
    "use server";
    await clearPending();
    redirect("/staff/login");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-linear-to-b from-blue-08 to-white px-6 py-16">
      <div className="w-full max-w-[26rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/logo-colour.png"
          alt="FXB Rwanda"
          className="mb-10 h-12 w-auto"
        />

        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue">
          Check your email
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray">
          We have sent a six-digit code to{" "}
          <strong className="font-semibold text-blue">
            {mask(pending.email)}
          </strong>
          . It works once and expires in ten minutes.
        </p>

        {resent && (
          <p
            role="status"
            className="mt-6 rounded-card border border-green/30 bg-green-10 px-5 py-4 text-[15px] leading-relaxed text-gray"
          >
            <strong className="font-semibold text-green">Sent again.</strong>{" "}
            The previous code no longer works — use the newest one.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] leading-relaxed text-gray"
          >
            {error}
          </p>
        )}

        <form action={check} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-blue">
              Six-digit code
            </span>
            <input
              name="code"
              // `inputMode` and not `type="number"`, which brings spinner
              // arrows and drops a leading zero — and a code that starts with
              // one is a code in six hundred thousand.
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              className="h-14 rounded-card border border-gray-15 bg-white px-4 text-center font-display text-2xl tracking-[0.4em] text-blue tabular-nums outline-none focus:border-blue"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
          >
            Sign in
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-15 pt-6 text-sm">
          <form action={resend}>
            <button
              type="submit"
              disabled={wait > 0}
              className="font-semibold text-blue underline underline-offset-4 transition-colors duration-300 hover:text-green disabled:text-gray-80 disabled:no-underline"
            >
              {wait > 0
                ? `Send another code in ${Math.ceil(wait / 1000)}s`
                : "Send another code"}
            </button>
          </form>

          <form action={startOver}>
            <button
              type="submit"
              className="text-gray-80 underline underline-offset-4 transition-colors duration-300 hover:text-blue"
            >
              Sign in as somebody else
            </button>
          </form>
        </div>

        <p className="mt-8 max-w-[34ch] text-[13px] leading-relaxed text-gray-80">
          If you did not just try to sign in, somebody else has your password.
          Do not use the code — sign in yourself and change it under Your
          account. <Link href="/staff/login" className="underline underline-offset-4">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

/** `emmanuel@fxbrwanda.org` → `e•••••••@fxbrwanda.org`. */
function mask(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 1) return `${local}@${domain}`;
  return `${local[0]}${"•".repeat(Math.min(local.length - 1, 8))}@${domain}`;
}
