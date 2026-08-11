import { asc, eq, ne, and, count } from "drizzle-orm";

import { db, users, sessions } from "../db";
import { hashPassword, verifyPassword } from "../auth/password";

/**
 * Managing who can sign in.
 *
 * The schema has said since it was written that `admin` can manage other
 * people and `editor` can do everything else — and nothing has ever created a
 * second account. Every user in the database was seeded, so adding a colleague
 * meant a database client and a hand-computed scrypt hash. This is that
 * comment made true.
 *
 * Roles stay at two. A permissions matrix is what you build when you do not
 * know who the users are; this is one communications team, and the only
 * question they actually have is who is allowed to add a colleague.
 */

export type StaffAccount = {
  id: number;
  email: string;
  name: string;
  role: string;
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
  role: string;
}): Promise<UserResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const role = input.role === "admin" ? "admin" : "editor";

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
    role,
    passwordHash: await hashPassword(input.password),
  });

  return { ok: true };
}

/**
 * Change somebody's role.
 *
 * Refuses to remove the last admin. An account nobody can add users from is a
 * panel that needs a database client to recover, and the person most likely to
 * do it is an admin demoting themselves while tidying up.
 */
export async function setRole(id: number, role: string): Promise<UserResult> {
  const next = role === "admin" ? "admin" : "editor";

  if (next === "editor" && (await lastAdmin(id))) {
    return {
      ok: false,
      error: "This is the only admin. Make somebody else an admin first.",
    };
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
      error: "You cannot remove your own account. Ask another admin to do it.",
    };
  }
  if (await lastAdmin(id)) {
    return {
      ok: false,
      error: "This is the only admin. Make somebody else an admin first.",
    };
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

/** True when `id` is an admin and no other admin exists. */
async function lastAdmin(id: number): Promise<boolean> {
  const [subject] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (subject?.role !== "admin") return false;

  const [{ others }] = await db
    .select({ others: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), ne(users.id, id)));

  return others === 0;
}
