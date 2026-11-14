import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

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

/**
 * A pasted or uploaded list, read into addresses and names.
 *
 * Deliberately forgiving about shape, because the list arrives from wherever
 * FXB has been keeping it: a spreadsheet saved as CSV, a column copied out of
 * Excel (which pastes as tabs), a block of addresses from an email's To field.
 * Each line is split on commas, semicolons and tabs; the cell that is an email
 * address is the address, and the first other cell with anything in it is the
 * name. A header row has no address in it and so drops out by itself.
 *
 * `invalid` counts the lines that had words but no usable address, so the
 * person importing is told how many were left behind rather than finding out
 * when a colleague asks why they never got the newsletter.
 */
export function parseContacts(raw: string): {
  contacts: { email: string; name: string | null }[];
  invalid: number;
} {
  const seen = new Map<string, string | null>();
  let invalid = 0;

  for (const line of raw.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const cells = line
      .split(/[,;\t]/)
      .map((cell) => cell.trim().replace(/^["'<]+|["'>]+$/g, "").trim())
      .filter(Boolean);
    if (cells.length === 0) continue;

    const address = cells.find((cell) => EMAIL.test(cell))?.toLowerCase();
    if (!address) {
      // "email" or "Name,Email" at the top of a sheet is not a bad address.
      const header = cells.every((cell) =>
        /^(e-?mail( address)?|(full |first |last )?names?|address|phone|organi[sz]ation)$/i.test(cell),
      );
      if (!header) invalid += 1;
      continue;
    }

    const name = cells.find((cell) => !EMAIL.test(cell)) ?? null;
    // The first time an address appears wins, but a later row may supply the
    // name the first one lacked.
    if (!seen.has(address) || (!seen.get(address) && name)) seen.set(address, name);
  }

  return {
    contacts: [...seen].map(([email, name]) => ({ email, name })),
    invalid,
  };
}

/**
 * Add a list of people at once.
 *
 * NOT `subscribe()` in a loop, and the difference matters. `subscribe` is what
 * a person does for themselves, so it puts somebody who had unsubscribed back
 * on the list — they have just asked for that. An import is somebody else
 * adding them, and an old spreadsheet will contain people who have since
 * unsubscribed. Those are left exactly as they are: the import only ever adds
 * addresses the list has never seen.
 *
 * `consentAt` is left empty. That column records the moment a person ticked
 * the box on the website, and an import is not that moment; `source: "import"`
 * is the honest record of how they arrived.
 */
export async function importSubscribers(
  contacts: { email: string; name: string | null }[],
): Promise<{ added: number; already: number }> {
  if (contacts.length === 0) return { added: 0, already: 0 };

  let added = 0;
  // In batches, so a list of several thousand is a handful of statements and
  // not several thousand, and no single statement carries too many values.
  for (let start = 0; start < contacts.length; start += 500) {
    const batch = contacts.slice(start, start + 500);

    const existing = await db
      .select({ email: subscribers.email })
      .from(subscribers)
      .where(inArray(subscribers.email, batch.map((contact) => contact.email)));
    const known = new Set(existing.map((row) => row.email));

    const fresh = batch.filter((contact) => !known.has(contact.email));
    if (fresh.length === 0) continue;

    const inserted = await db
      .insert(subscribers)
      .values(
        fresh.map((contact) => ({
          email: contact.email,
          name: contact.name?.slice(0, 200) || null,
          status: "subscribed",
          source: "import",
          consentAt: null,
          unsubscribeToken: randomBytes(24).toString("hex"),
          updatedAt: new Date(),
        })),
      )
      // Two imports running at once, or an address that signed up between the
      // check above and this line.
      .onConflictDoNothing()
      .returning({ id: subscribers.id });

    added += inserted.length;
  }

  return { added, already: contacts.length - added };
}
