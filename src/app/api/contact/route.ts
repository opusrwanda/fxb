/**
 * Contact form.
 *
 * Same rule as the newsletter route: it fails loudly rather than quietly. A
 * contact form that shows a thank-you and drops the message is worse than no
 * form at all — the sender believes they have reached someone and stops trying.
 *
 * Until `CONTACT_ENDPOINT` is configured this returns 503 and the form tells
 * the visitor to email the office directly, with the address in the message.
 *
 * Set `CONTACT_ENDPOINT` to whatever FXB settles on — a transactional mail API
 * (Resend, Postmark, Brevo), a form service, or an internal handler — and add
 * `CONTACT_TOKEN` if it needs a key.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Guards against a paste of a whole document into a text field. */
const LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  subject: 200,
  message: 5000,
} as const;

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const name = text(payload.name);
  const email = text(payload.email);
  const phone = text(payload.phone);
  const subject = text(payload.subject);
  const message = text(payload.message);

  if (!name) {
    return Response.json(
      { error: "Please tell us your name." },
      { status: 400 }
    );
  }

  if (!EMAIL.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  if (!message) {
    return Response.json(
      { error: "Please write a message." },
      { status: 400 }
    );
  }

  const fields = { name, email, phone, subject, message };

  for (const [field, value] of Object.entries(fields)) {
    const limit = LIMITS[field as keyof typeof LIMITS];
    if (value.length > limit) {
      return Response.json(
        { error: `That ${field} is too long. Please shorten it.` },
        { status: 400 }
      );
    }
  }

  const endpoint = process.env.CONTACT_ENDPOINT;

  if (!endpoint) {
    return Response.json(
      {
        error:
          "Our contact form is not connected yet. Please email info@fxbrwanda.org and we will come back to you.",
      },
      { status: 503 }
    );
  }

  const token = process.env.CONTACT_TOKEN;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(fields),
  });

  if (!response.ok) {
    return Response.json(
      {
        error:
          "We could not send your message just now. Please try again, or email info@fxbrwanda.org.",
      },
      { status: 502 }
    );
  }

  return Response.json({
    message: "Thank you — your message is on its way. We will be in touch.",
  });
}
