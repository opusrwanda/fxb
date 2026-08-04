import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db, users } from "@/staff/db";
import { verifyPassword } from "@/staff/auth/password";
import {
  createSession,
  currentUser,
  pruneExpiredSessions,
} from "@/staff/auth/session";

export const metadata: Metadata = { title: "Sign in" };

/**
 * Sign in.
 *
 * A team signing in to change their own website should see their own
 * organisation, not a piece of software they have never heard of — an
 * unfamiliar login screen is what makes people think they are in the wrong
 * place, or that they are being phished.
 *
 * The form posts to a server action rather than an API route, so it works
 * before any JavaScript has loaded and there is no fetch to get wrong.
 */
async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const failed = `/staff/login?error=1&email=${encodeURIComponent(email)}`;
  if (!email || !password) redirect(failed);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // One message for both "no such person" and "wrong password", and the hash is
  // verified either way. Answering faster for an unknown address tells anyone
  // who asks which addresses are real.
  const stored = user?.passwordHash ?? "invalid:invalid";
  const ok = await verifyPassword(password, stored);

  if (!user || !ok) redirect(failed);

  await pruneExpiredSessions();
  await createSession(user.id);
  redirect("/staff");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  // Already signed in — no reason to show the form again.
  if (await currentUser()) redirect("/staff");

  const { error, email } = await searchParams;

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
          Sign in
        </h1>
        <p className="mt-3 text-base leading-relaxed text-gray">
          The staff panel for the FXB Rwanda website.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] leading-relaxed text-gray"
          >
            <strong className="font-semibold text-blue">
              That did not work.
            </strong>{" "}
            Check the email address and password and try again.
          </p>
        )}

        <form action={signIn} className="mt-8 flex flex-col gap-5">
          <Field
            label="Email address"
            name="email"
            type="email"
            defaultValue={email ?? ""}
            autoComplete="username"
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-90"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-blue">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        className="h-12 rounded-card border border-gray-15 bg-white px-4 text-base text-gray transition-colors duration-200 outline-none focus:border-blue"
      />
    </label>
  );
}
