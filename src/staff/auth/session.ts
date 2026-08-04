import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";

import { db, sessions, users } from "../db";

/**
 * Signed-in sessions.
 *
 * The cookie carries nothing but 32 random bytes. Everything the panel needs to
 * know — who you are, what you may do, whether you are still welcome — is read
 * from the row that id points at.
 *
 * That is the whole reason it is not a JWT. A token that carries its own claims
 * cannot be withdrawn: change somebody's role, or remove them entirely, and
 * their existing token keeps asserting the old answer until it expires. Here,
 * deleting a row ends the session on the next request.
 */

export const COOKIE = "fxb_staff_session";

/** Two weeks. Long enough not to nag a daily editor, short enough to lapse. */
const LIFETIME_MS = 14 * 24 * 60 * 60 * 1000;

export type StaffUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export async function createSession(userId: number): Promise<void> {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + LIFETIME_MS);

  await db.insert(sessions).values({ id, userId, expiresAt });

  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    // Not readable from JavaScript, not sent cross-site, and HTTPS-only off
    // localhost. The three flags that make a stolen session hard to come by.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** The signed-in user, or null. Safe to call anywhere on the server. */
export async function currentUser(): Promise<StaffUser | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    // The expiry is enforced in the query, not just on the cookie. A cookie's
    // own expiry is a request from us to the browser, and a browser that
    // ignores it would otherwise hold a session open indefinitely.
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;

  if (id) await db.delete(sessions).where(eq(sessions.id, id));
  jar.delete(COOKIE);
}

/**
 * Clear out sessions that have lapsed.
 *
 * Called on sign-in rather than on a schedule: it is the one moment a little
 * extra work is unnoticeable, and it keeps the table from growing forever
 * without needing anything scheduled to exist.
 */
export async function pruneExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
