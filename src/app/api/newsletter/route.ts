/**
 * Newsletter signup.
 *
 * There is no mailing provider wired up yet, and an address typed into a form
 * that quietly goes nowhere is worse than no form at all. So this fails loudly:
 * without `NEWSLETTER_ENDPOINT` configured it returns 503 and the footer says
 * so in plain words, rather than showing a thank-you and dropping the address.
 *
 * Set `NEWSLETTER_ENDPOINT` to the provider's subscribe URL (Mailchimp,
 * Brevo, Listmonk — whatever FXB settles on) and this forwards to it. If that
 * provider needs a key, add it as `NEWSLETTER_TOKEN`.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let payload: { email?: unknown; name?: unknown };

  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!EMAIL.test(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
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
    body: JSON.stringify({ email, name }),
  });

  if (!response.ok) {
    return Response.json(
      { error: "We could not sign you up just now. Please try again later." },
      { status: 502 }
    );
  }

  return Response.json({ message: "Thank you — you are on the list." });
}
