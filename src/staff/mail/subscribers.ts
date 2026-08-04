import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";

import { db, subscribers } from "../db";

/**
 * The mailing list.
 *
 * Everything here treats the address as the identity — matched case-insensitively,
 * because people type Info@ and info@ and mean the same inbox, and a list that
 * treats those as two people mails them twice.
 */

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type SubscribeResult =
  | { ok: true; status: "added" | "already" | "resubscribed" }
  | { ok: false; error: string };

/**
 * Add somebody, or bring them back.
 *
 * Signing up an address that is already on the list is not an error — people
 * forget, and telling them "you are already subscribed" is fine while refusing
 * them is not. Somebody who previously unsubscribed and has now signed up again
 * is resubscribed, because that is a fresh act of consent and `consentAt` is
 * stamped again to record it.
 */
export async function subscribe({
  email,
  name,
  source = "footer",
}: {
  email: string;
  name?: string;
  source?: string;
}): Promise<SubscribeResult> {
  const address = email.trim().toLowerCase();
  if (!EMAIL.test(address)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, address))
    .limit(1);

  if (existing) {
    if (existing.status === "subscribed") return { ok: true, status: "already" };

    await db
      .update(subscribers)
      .set({
        status: "subscribed",
        consentAt: new Date(),
        unsubscribedAt: null,
        name: name?.trim() || existing.name,
        updatedAt: new Date(),
      })
      .where(eq(subscribers.id, existing.id));

    return { ok: true, status: "resubscribed" };
  }

  await db.insert(subscribers).values({
    email: address,
    name: name?.trim() || null,
    status: "subscribed",
    source,
    consentAt: new Date(),
    unsubscribeToken: randomBytes(24).toString("hex"),
    updatedAt: new Date(),
  });

  return { ok: true, status: "added" };
}

/** One-click unsubscribe. Returns the address, so the page can confirm it. */
export async function unsubscribeByToken(
  token: string,
): Promise<{ ok: true; email: string } | { ok: false }> {
  const [row] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.unsubscribeToken, token))
    .limit(1);

  if (!row) return { ok: false };

  // Already unsubscribed is a success, not an error — a second click on the
  // same link should say "you are unsubscribed", never "that did not work".
  if (row.status !== "unsubscribed") {
    await db
      .update(subscribers)
      .set({
        status: "unsubscribed",
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscribers.id, row.id));
  }

  return { ok: true, email: row.email };
}

export async function listSubscribers() {
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

/** Everyone a campaign should actually go to. */
export async function activeSubscribers() {
  return db
    .select()
    .from(subscribers)
    .where(eq(subscribers.status, "subscribed"))
    .orderBy(subscribers.id);
}

export async function subscriberCounts() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      subscribed: sql<number>`count(*) filter (where status = 'subscribed')::int`,
      unsubscribed: sql<number>`count(*) filter (where status = 'unsubscribed')::int`,
    })
    .from(subscribers);

  return row ?? { total: 0, subscribed: 0, unsubscribed: 0 };
}

export async function setSubscriberStatus(id: number, status: string) {
  await db
    .update(subscribers)
    .set({
      status,
      unsubscribedAt: status === "unsubscribed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(subscribers.id, id));
}

export async function deleteSubscriber(id: number) {
  await db.delete(subscribers).where(eq(subscribers.id, id));
}

/** The list as a CSV, for a backup or for moving to another provider. */
export async function subscribersCsv(): Promise<string> {
  const rows = await db
    .select()
    .from(subscribers)
    .where(and(eq(subscribers.status, "subscribed")))
    .orderBy(subscribers.email);

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  return [
    "email,name,status,source,consent_at,created_at",
    ...rows.map((row) =>
      [
        escape(row.email),
        escape(row.name ?? ""),
        escape(row.status),
        escape(row.source),
        escape(row.consentAt?.toISOString() ?? ""),
        escape(row.createdAt.toISOString()),
      ].join(","),
    ),
  ].join("\n");
}
