import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";

import { db, users } from "../db";

/**
 * Getting back in after forgetting the password.
 *
 * The person proves they can read the mailbox on the account — the same proof
 * the sign-in code asks for — by following a link sent to it, and chooses a new
 * password there.
 *
 * THERE IS NO TABLE OF RESET TOKENS, and that is the design rather than a
 * shortcut. The link carries the account's number, the moment it stops
 * working, and a signature over both made with the account's *current
 * password hash* as the key. Three things follow from that key:
 *
 *   It is single-use for free. Choosing a new password changes the hash, so
 *   the signature on the link that was just used — and on every other link
 *   outstanding for that account — no longer verifies.
 *
 *   It cannot be forged. The hash never leaves the database, so nobody who
 *   has not already broken in can compute a signature.
 *
 *   There is nothing to clean up, and no stored secret that a leaked backup
 *   would turn into a way in.
 *
 * This is how Django has issued reset links for years. The alternative — a
 * random token in its own table — does the same job with a migration and a
 * pruning job attached.
 */

/**
 * Half an hour.
 *
 * Longer than the sign-in code's ten minutes, because this email is one people
 * go and look for rather than one they are waiting on; short enough that a
 * link sitting in an inbox is not a standing way in.
 */
const LIFETIME_MS = 30 * 60 * 1000;

/** At most one link per address in this long, so the form cannot flood an inbox. */
const RESEND_AFTER_MS = 2 * 60 * 1000;

function sign(userId: number, expires: number, passwordHash: string): string {
  return createHmac("sha256", passwordHash)
    .update(`reset:${userId}:${expires}`)
    .digest("hex");
}

/**
 * When a link was last sent to each address.
 *
 * In memory, and that is enough: the site is one process, and the worst a
 * restart can do is let one extra email through. It is keyed by what was typed
 * rather than by account, so an address with no account is throttled exactly
 * like one with — the timing of the answer says nothing about which it is.
 */
const lastSent = new Map<string, number>();

export function mayRequestReset(email: string): boolean {
  const now = Date.now();
  for (const [key, at] of lastSent) {
    if (now - at > RESEND_AFTER_MS) lastSent.delete(key);
  }
  if (lastSent.has(email)) return false;
  lastSent.set(email, now);
  return true;
}

/** The account for an address, with what a reset link needs. Null if none. */
export async function findForReset(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}

/** The path and query of a reset link for this account. */
export function resetPath(user: { id: number; passwordHash: string }): string {
  const expires = Date.now() + LIFETIME_MS;
  const token = sign(user.id, expires, user.passwordHash);
  return `/staff/login/reset?u=${user.id}&e=${expires}&t=${token}`;
}

/**
 * Whose link is this, if it is still good?
 *
 * Null for every way it can be wrong — expired, altered, already used, an
 * account that has gone — because the page has one thing to say in all of
 * them: ask for a new link.
 */
export async function readResetLink(query: {
  u?: string;
  e?: string;
  t?: string;
}): Promise<{ id: number; name: string; email: string } | null> {
  const userId = Number(query.u);
  const expires = Number(query.e);
  const token = query.t ?? "";

  if (!Number.isInteger(userId) || !Number.isFinite(expires)) return null;
  if (expires < Date.now()) return null;
  // A link claiming to last longer than any we issue was not issued by us.
  if (expires > Date.now() + LIFETIME_MS) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const expected = Buffer.from(sign(user.id, expires, user.passwordHash), "hex");
  const given = Buffer.from(token, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }

  return { id: user.id, name: user.name, email: user.email };
}
