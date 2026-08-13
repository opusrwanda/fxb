import { asc, count, eq } from "drizzle-orm";

import { db, users, sessions } from "../db";
import type { Role } from "../db/schema";
import { hashPassword, verifyPassword } from "../auth/password";

/**
 * Managing who can sign in.
 *
 * There are two roles again. For a while there was one, and everybody had it —
 * the reasoning being that this is one communications team and a permission
 * nobody wants to withhold is a control three people have to think about for
 * nothing. That held until somebody outside the team needed to write a story,
 * at which point the only options were handing them the mailing list and the
 * staff accounts as well, or not giving them an account.
 *
 * What each role means is `src/staff/auth/permissions.ts`, not here. This file
 * is only the creating, deleting and re-roling of the rows.
 */

export type StaffAccount = {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
};

export type UserResult = { ok: true } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Twelve characters, and no composition rules.
 *
 * Length is the only requirement that reliably buys anything. A rule demanding
 * a capital, a digit and a symbol produces `Password1!` — which is shorter,
 * more guessable and harder to remember than four ordinary words.
 */
const MIN_PASSWORD = 12;

export async function listUsers(): Promise<StaffAccount[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.name));
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<UserResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) return { ok: false, error: "Please give the person's name." };
  if (!EMAIL.test(email)) {
    return { ok: false, error: "That does not look like an email address." };
  }
  if (input.password.length < MIN_PASSWORD) {
    return {
      ok: false,
      error: `The password needs at least ${MIN_PASSWORD} characters. Four ordinary words is a good one.`,
    };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { ok: false, error: "Somebody already signs in with that address." };
  }

  await db.insert(users).values({
    name,
    email,
    // Anything that is not exactly "admin" is an editor. The role arrives from
    // a form, and a select can be made to post whatever somebody likes; a
    // string this did not recognise must not end up in the column, where the
    // permission checks would read it as neither role and fall through.
    role: input.role === "admin" ? "admin" : "editor",
    passwordHash: await hashPassword(input.password),
  });

  return { ok: true };
}

/**
 * Change somebody's role.
 *
 * The last admin cannot be demoted. An FXB panel with no admin is one where
 * nobody can add an account, change the settings or send a newsletter, and the
 * only way out is a database client — which is the state the staff accounts
 * page was built to get them out of. It is the same reasoning as the last
 * account not being deletable, one step further in.
 *
 * Demoting yourself is allowed as long as somebody else is an admin. It is a
 * strange thing to want and an easy thing to reverse by asking them.
 */
export async function setRole(id: number, role: Role): Promise<UserResult> {
  const next: Role = role === "admin" ? "admin" : "editor";

  if (next === "editor") {
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    const [target] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!target) return { ok: false, error: "That account no longer exists." };
    if (target.role === "admin" && total <= 1) {
      return {
        ok: false,
        error:
          "This is the only admin. Make somebody else an admin before changing this one.",
      };
    }
  }

  await db.update(users).set({ role: next, updatedAt: new Date() }).where(eq(users.id, id));
  return { ok: true };
}

/**
 * Remove an account.
 *
 * Sessions go with it — the row cascades, so somebody signed in on another
 * machine is signed out rather than left holding a working session for an
 * account that no longer exists.
 */
export async function deleteUser(id: number, actingId: number): Promise<UserResult> {
  if (id === actingId) {
    return {
      ok: false,
      error: "You cannot remove your own account. Ask a colleague to do it.",
    };
  }
  if (await lastAccount()) {
    return {
      ok: false,
      error: "This is the only account. Add another before removing this one.",
    };
  }

  // The same floor `setRole` holds: removing the last admin leaves a panel
  // where nothing in Settings can be opened by anybody, and no route back to
  // one that can. Deleting the account is just the other way to arrive there.
  const [target] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (target?.role === "admin") {
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    if (total <= 1) {
      return {
        ok: false,
        error:
          "This is the only admin. Make somebody else an admin before removing this account.",
      };
    }
  }

  await db.delete(users).where(eq(users.id, id));
  return { ok: true };
}

/**
 * Change your own password.
 *
 * Necessary rather than nice: an account created here starts with a password
 * an admin chose and had to pass on somehow. Without this, that password stays
 * shared for as long as the account exists.
 *
 * Every other session for the account is dropped. Changing a password is what
 * somebody does when they think it is known, and leaving old sessions alive
 * would leave whoever knew it signed in.
 */
export async function changeOwnPassword(
  id: number,
  current: string,
  next: string,
): Promise<UserResult> {
  const [user] = await db
    .select({ hash: users.passwordHash })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user || !(await verifyPassword(current, user.hash))) {
    return { ok: false, error: "That is not your current password." };
  }
  if (next.length < MIN_PASSWORD) {
    return {
      ok: false,
      error: `The new password needs at least ${MIN_PASSWORD} characters.`,
    };
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(next), updatedAt: new Date() })
    .where(eq(users.id, id));

  await db.delete(sessions).where(eq(sessions.userId, id));

  return { ok: true };
}

/**
 * True when there is only one account left.
 *
 * Deleting it would leave a panel nobody can sign in to, recoverable only with
 * a database client and a hand-computed hash — which is exactly the state this
 * page was built to get FXB out of.
 */
async function lastAccount(): Promise<boolean> {
  const [{ total }] = await db.select({ total: count() }).from(users);
  return total <= 1;
}
