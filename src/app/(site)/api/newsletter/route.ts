/**
 * Newsletter signup.
 *
 * The list is ours now — the address goes into the `subscribers` table and the
 * team manages it at /staff/subscribers. There is no third-party provider in
 * the path, so nothing here can silently drop an address into somebody else's
 * system.
 *
 * Two callers, deliberately asking for different amounts:
 *
 *   the signup section  firstName, lastName, email, consent
 *   the footer form     email, consent
 *
 * So the names are validated when present and never required here. Requiring
 * them server-side would break the footer, and the footer cannot grow the
 * fields back without becoming the tallest thing in the footer again — see the
 * note in `newsletter-form.tsx`. The section's own fields carry `required`, so
 * the browser enforces them where they are actually asked for.
 *
 * Consent is the exception, and is required of both. It is the one value here
 * with legal weight, and a subscription recorded without it is not a
 * subscription — so it is checked rather than inferred from the fact that a
 * request arrived at all.
 */
import { subscribe } from "@/staff/mail/subscribers";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trimmed, length-capped, and never trusted to be a string in the first place. */
function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let payload: {
    email?: unknown;
    firstName?: unknown;
    lastName?: unknown;
    name?: unknown;
    consent?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const email = text(payload.email, 200);
  const firstName = text(payload.firstName, 80);
  const lastName = text(payload.lastName, 80);

  // Providers overwhelmingly want one display name as well as the parts, and
  // the footer form has only ever sent the whole thing — so compose it from
  // the parts when they are there and fall back to what the footer sends.
  const name =
    [firstName, lastName].filter(Boolean).join(" ") || text(payload.name, 160);

  if (!EMAIL.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  if (payload.consent !== true) {
    return Response.json(
      {
        error:
          "Please confirm you are happy to receive emails from FXB Rwanda.",
      },
      { status: 400 }
    );
  }

  // The section sends first and last names; the footer sends neither. `source`
  // records which, because "where did these addresses come from" is the first
  // question anybody asks of a list.
  const result = await subscribe({
    email,
    name,
    source: firstName || lastName ? "signup" : "footer",
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  // Somebody signing up twice is told they are on the list, not that something
  // went wrong — because nothing did.
  return Response.json({
    message:
      result.status === "already"
        ? "You are already on the list — thank you."
        : "Thank you — you are on the list.",
  });
}
