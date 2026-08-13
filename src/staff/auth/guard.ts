import { redirect } from "next/navigation";

import { currentUser, type StaffUser } from "./session";
import { accessTo, canManageUsers, isAdmin, type Access } from "./permissions";

/**
 * The checks that actually stop something.
 *
 * `permissions.ts` decides what the panel offers; this decides what it allows.
 * The distinction matters more than it looks: hiding a button does not stop a
 * request, and every write in this panel is a server action, which is an HTTP
 * endpoint whether or not anything on the page points at it. Someone who has
 * signed in as an editor and knows the shape of the form can post to it.
 *
 * So the rule is: every server action and every route handler that changes
 * something starts with one of these, and none of them trusts an id, a role or
 * a collection name that arrived in the request. The role is read from the
 * session row on the server, every time.
 *
 * They redirect rather than throw. A permission failure in this panel is nearly
 * always somebody following a stale link or a bookmark from before their role
 * changed, and an error page tells them they have broken something when they
 * have not.
 */

/** Signed in, or sent to the sign-in. */
export async function requireUser(): Promise<StaffUser> {
  const user = await currentUser();
  if (!user) redirect("/staff/login");
  return user;
}

/**
 * Signed in with at least this much access to that part of the panel.
 *
 * `key` is a collection, global or register key as `collections.ts` declares
 * it — the same string `permissions.ts` maps to an area.
 */
export async function requireAccess(
  key: string,
  level: Exclude<Access, "none"> = "write",
): Promise<StaffUser> {
  const user = await requireUser();
  const granted = accessTo(user, key);

  if (granted === "none" || (level === "write" && granted !== "write")) {
    redirect(`/staff?denied=${encodeURIComponent(key)}`);
  }

  return user;
}

/** Signed in as an admin. */
export async function requireAdmin(reason = "settings"): Promise<StaffUser> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect(`/staff?denied=${encodeURIComponent(reason)}`);
  return user;
}

/**
 * The same check, for a route handler.
 *
 * A `GET` that returns a file cannot redirect usefully — the browser is
 * downloading, not navigating — so these answer with a status instead and let
 * the caller write the response.
 */
export async function adminOrNull(): Promise<StaffUser | null> {
  const user = await currentUser();
  return user && isAdmin(user) ? user : null;
}

export { canManageUsers };
