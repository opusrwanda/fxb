import { eq } from "drizzle-orm";

import { getSiteDetails } from "@/cms/content/settings";
import { db, messages } from "@/staff/db";
import { getTransport, mailConfig } from "@/staff/mail/transport";

/**
 * Contact form.
 *
 * The rule has not changed — it fails loudly rather than quietly, because a
 * form that shows a thank-you and drops the message is worse than no form at
 * all — but what it does has.
 *
 * It used to post to a `CONTACT_ENDPOINT` that was never configured, so every
 * message on the live site was refused with "our contact form is not connected
 * yet". That was honest and it was still a form nobody could use. There is a
 * working mailbox now, so it writes the message down and emails it, in that
 * order and for the same reason applications do: the row is the record, the
 * email is the notification, and a mail server having a bad afternoon must not
 * lose somebody's message.
 *
 * The reply-to is the sender, so answering from the office inbox goes back to
 * them rather than to FXB's own address.
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

  let id: number;
  try {
    const [row] = await db
      .insert(messages)
      .values({ name, email, phone: phone || null, subject: subject || null, message })
      .returning({ id: messages.id });
    id = row.id;
  } catch (error) {
    console.error("[contact] insert failed", error);
    return Response.json(
      {
        error:
          "We could not record your message just now. Please try again, or email info@fxbrwanda.org.",
      },
      { status: 500 },
    );
  }

  // Recorded, so the sender is told the truth whatever happens next. A failure
  // past this point is logged and the row carries `notified: false` for
  // somebody to chase — it is not the sender's problem to solve.
  void notify(id, fields).catch((error) =>
    console.error("[contact] notification failed", error),
  );

  return Response.json({
    message: "Thank you — your message has reached us. We will be in touch.",
  });
}

async function notify(
  id: number,
  fields: { name: string; email: string; phone: string; subject: string; message: string },
): Promise<void> {
  const config = mailConfig();
  if (!config) {
    console.warn(`[contact] #${id} recorded but SMTP is not configured`);
    return;
  }

  const details = await getSiteDetails();

  await getTransport(config).sendMail({
    from: `"${config.fromName}" <${config.fromAddress}>`,
    to: details.email,
    replyTo: fields.email,
    subject: fields.subject
      ? `Contact form: ${fields.subject}`
      : `Contact form: ${fields.name}`,
    text: [
      `Name:  ${fields.name}`,
      `Email: ${fields.email}`,
      fields.phone ? `Phone: ${fields.phone}` : null,
      fields.subject ? `Subject: ${fields.subject}` : null,
      "",
      fields.message,
      "",
      `Recorded as message #${id} in the staff panel.`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });

  await db.update(messages).set({ notified: true }).where(eq(messages.id, id));
}
