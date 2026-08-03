/**
 * Newsletter signup.
 *
 * There is no mailing provider wired up yet, and an address typed into a form
 * that quietly goes nowhere is worse than no form at all. So this fails loudly:
 * without `NEWSLETTER_ENDPOINT` configured it returns 503 and both forms say so
 * in plain words, rather than showing a thank-you and dropping the address.
 *
 * Set `NEWSLETTER_ENDPOINT` to the provider's subscribe URL (Mailchimp,
 * Brevo, Listmonk — whatever FXB settles on) and this forwards to it. If that
 * provider needs a key, add it as `NEWSLETTER_TOKEN`.
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

  const endpoint = process.env.NEWSLETTER_ENDPOINT;

  if (!endpoint) {
    return Response.json(
      {
        error:
          "Newsletter signup is not connected yet. Please email info@fxbrwanda.org and we will add you.",
      },
      { status: 503 }
    );
  }

  const token = process.env.NEWSLETTER_TOKEN;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ email, name, firstName, lastName, consent: true }),
  });

  if (!response.ok) {
    return Response.json(
      { error: "We could not sign you up just now. Please try again later." },
      { status: 502 }
    );
  }

  return Response.json({ message: "Thank you — you are on the list." });
}
