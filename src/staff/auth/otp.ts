import { randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";

import { db, loginCodes, users } from "../db";
import { hashPassword, verifyPassword } from "./password";
import { mailConfig } from "../mail/transport";

/**
 * The second step of signing in.
 *
 * A password proves somebody knows a string. This proves they can read the
 * mailbox the account belongs to, and the two together are worth much more than
 * either — a password that has leaked, been reused from another site, or been
 * passed across a desk and never changed is no longer enough on its own.
 *
 * That last case is the one that made this worth building here. An account in
 * this panel is created by a colleague who picks the first password and has to
 * hand it over somehow, and until the person changes it there are two people
 * who know it. FXB asked for a code on sign-in for both roles, and it is the
 * cheapest thing that makes the handover safe.
 *
 * THE PENDING STATE IS NOT A SESSION. Between the password and the code there
 * is a row in `login_codes` and a cookie holding its id, and neither grants
 * access to anything. `currentUser` looks only at `sessions`, so a half-finished
 * sign-in cannot read a single page.
 */

/** The cookie that says which sign-in is in progress. Not a credential. */
export const PENDING_COOKIE = "fxb_staff_pending";

/**
 * Ten minutes.
 *
 * Long enough to go and find the email on a phone, short enough that a code
 * sitting in a mailbox is not a spare key. The cookie expires with the row so
 * a browser is not left holding a pointer to something that has gone.
 */
const LIFETIME_MS = 10 * 60 * 1000;

/**
 * Five.
 *
 * Six digits is a million combinations, which is only a big number if
 * something is counting. Five wrong answers and the row is finished — the code
 * has to be guessed in five tries rather than in a million.
 */
const MAX_ATTEMPTS = 5;

/** A minute between codes, so Resend cannot be used to flood somebody's inbox. */
const RESEND_AFTER_MS = 60 * 1000;

export type Pending = {
  id: string;
  userId: number;
  name: string;
  email: string;
  createdAt: Date;
  attempts: number;
};

/**
 * Is the second step switched on at all?
 *
 * It cannot be if there is no way to send the code. A panel that demands an
 * emailed code from a server with no SMTP configured is a panel nobody can
 * sign in to, recoverable only by editing the environment on the box — and the
 * likeliest time for that to happen is a fresh deploy where the variables have
 * not been set yet, which is exactly when somebody needs to get in.
 *
 * So the password alone signs you in when mail is not configured, and it says
 * so loudly in the log rather than pretending the second step happened. On
 * FXB's server mail is configured, because the newsletter depends on it.
 */
export function otpAvailable(): boolean {
  return mailConfig() !== null;
}

/**
 * Start the second step: make a code, store its hash, remember which sign-in
 * this is. Returns the code itself, once, for the email.
 */
export async function issueCode(userId: number): Promise<string> {
  // Anything outstanding for this person is void. Asking for a new code has to
  // invalidate the old one, or "resend" quietly widens the number of live
  // codes every time it is pressed.
  await db.delete(loginCodes).where(eq(loginCodes.userId, userId));

  // `randomInt` and not `Math.random()`. This is a credential, and
  // `Math.random()` is a predictable sequence — given a few outputs, the rest
  // can be computed.
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + LIFETIME_MS);

  await db.insert(loginCodes).values({
    id,
    userId,
    // scrypt, the same as a password. A code is short-lived, and it is still a
    // credential while it lives.
    codeHash: await hashPassword(code),
    expiresAt,
  });

  const jar = await cookies();
  jar.set(PENDING_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return code;
}

/** The sign-in currently in progress, or null. */
export async function pendingLogin(): Promise<Pending | null> {
  const jar = await cookies();
  const id = jar.get(PENDING_COOKIE)?.value;
  if (!id) return null;

  const rows = await db
    .select({
      id: loginCodes.id,
      userId: loginCodes.userId,
      attempts: loginCodes.attempts,
      createdAt: loginCodes.createdAt,
      name: users.name,
      email: users.email,
    })
    .from(loginCodes)
    .innerJoin(users, eq(loginCodes.userId, users.id))
    // Expiry and consumption are enforced in the query, not just on the
    // cookie. A cookie's expiry is a request to the browser; this is the fact.
    .where(
      and(
        eq(loginCodes.id, id),
        gt(loginCodes.expiresAt, new Date()),
        isNull(loginCodes.consumedAt),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export type VerifyResult =
  | { ok: true; userId: number }
  | { ok: false; error: string; expired?: boolean };

/**
 * Check the code somebody typed.
 *
 * A wrong answer costs an attempt whether or not the code was close, and
 * running out of attempts ends the sign-in rather than merely refusing that
 * guess — otherwise the limit is advice.
 */
export async function verifyCode(input: string): Promise<VerifyResult> {
  const code = input.replace(/\D/g, "");

  const pending = await pendingLogin();
  if (!pending) {
    return {
      ok: false,
      expired: true,
      error: "That code has expired. Sign in again to get a new one.",
    };
  }

  const [row] = await db
    .select({ codeHash: loginCodes.codeHash })
    .from(loginCodes)
    .where(eq(loginCodes.id, pending.id))
    .limit(1);

  if (!row) {
    return { ok: false, expired: true, error: "Sign in again to get a new code." };
  }

  if (await verifyPassword(code, row.codeHash)) {
    // Consumed, not deleted. A row that is gone is indistinguishable from one
    // that never existed, and the difference matters when reading a log after
    // somebody reports a sign-in they did not make.
    await db
      .update(loginCodes)
      .set({ consumedAt: new Date() })
      .where(eq(loginCodes.id, pending.id));

    return { ok: true, userId: pending.userId };
  }

  const attempts = pending.attempts + 1;

  if (attempts >= MAX_ATTEMPTS) {
    await db.delete(loginCodes).where(eq(loginCodes.id, pending.id));
    await clearPending();
    return {
      ok: false,
      expired: true,
      error: "Too many wrong codes. Sign in again to start over.",
    };
  }

  await db
    .update(loginCodes)
    .set({ attempts })
    .where(eq(loginCodes.id, pending.id));

  const left = MAX_ATTEMPTS - attempts;
  return {
    ok: false,
    error: `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.`,
  };
}

/** How long until another code can be asked for. Zero when it can be now. */
export function resendWaitMs(pending: Pending): number {
  const elapsed = Date.now() - pending.createdAt.getTime();
  return Math.max(0, RESEND_AFTER_MS - elapsed);
}

export async function clearPending(): Promise<void> {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE);
}

/**
 * Clear out codes nobody is going to use.
 *
 * Called alongside the session pruning on sign-in, for the same reason: it is
 * the one moment a little extra work is unnoticeable, and it keeps the table
 * from growing forever without anything scheduled having to exist.
 */
export async function pruneExpiredCodes(): Promise<void> {
  const now = new Date();
  await db
    .delete(loginCodes)
    .where(
      or(
        lt(loginCodes.expiresAt, now),
        lt(loginCodes.consumedAt, new Date(now.getTime() - LIFETIME_MS)),
      ),
    );
}
