import nodemailer, { type Transporter } from "nodemailer";

/**
 * The SMTP connection.
 *
 * Gmail, via `smtp.gmail.com`. Two things about that are worth knowing before
 * anybody relies on it.
 *
 * IT NEEDS AN APP PASSWORD, NOT THE ACCOUNT PASSWORD. Google stopped accepting
 * account passwords over SMTP; the address needs 2-Step Verification switched
 * on, and then a 16-character App Password generated at
 * myaccount.google.com/apppasswords. That string goes in `SMTP_PASSWORD`.
 *
 * IT HAS A DAILY CAP. A free Gmail address is limited to roughly 500 recipients
 * a day and a Workspace address to about 2,000. This is a hard limit imposed by
 * Google, not something the code can work around — send to a list larger than
 * the cap and the rest bounce back as "Daily user sending limit exceeded", and
 * the account can be locked for 24 hours. `campaign_sends` records who has
 * already received a given campaign precisely so a send can be resumed the next
 * day rather than started again.
 *
 * If the list outgrows the cap, the honest fix is a transactional provider —
 * Brevo, Postmark, SES — which is a change of these environment variables and
 * nothing else, because everything above this file talks to `sendMail` and not
 * to Gmail.
 */

const globalForMail = globalThis as unknown as { transport?: Transporter };

export type MailConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
  /** Where a reply goes, if not the sending address. */
  replyTo?: string;
};

/** The configuration, or null when it has not been set up yet. */
export function mailConfig(): MailConfig | null {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!user || !password) return null;

  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    user,
    password,
    fromName: process.env.MAIL_FROM_NAME || "FXB Rwanda",
    // Gmail rewrites the From header to the authenticated account anyway unless
    // the address is a verified alias, so defaulting to the account avoids a
    // From that silently does not match what arrives.
    fromAddress: process.env.MAIL_FROM_ADDRESS || user,
    replyTo: process.env.MAIL_REPLY_TO || undefined,
  };
}

export function getTransport(config: MailConfig): Transporter {
  if (globalForMail.transport) return globalForMail.transport;

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    // 587 is STARTTLS: the connection opens in the clear and is upgraded.
    // Only 465 is TLS from the first byte.
    secure: config.port === 465,
    auth: { user: config.user, pass: config.password },
    // One connection reused across the send rather than one per message.
    // Gmail closes connections that open and shut repeatedly, and a campaign is
    // hundreds of messages in a row.
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
    // Gmail throttles hard on bursts. Fourteen a second is well under anything
    // it objects to and still sends a thousand in a couple of minutes.
    rateDelta: 1000,
    rateLimit: 14,
  });

  globalForMail.transport = transport;
  return transport;
}

/** Check the credentials without sending anything. */
export async function verifyConnection(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const config = mailConfig();
  if (!config) return { ok: false, error: "SMTP is not configured." };

  try {
    await getTransport(config).verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: readableSmtpError(error) };
  }
}

/**
 * What to tell the team when SMTP refuses.
 *
 * Gmail's own messages are the useful part — "Username and Password not
 * accepted" almost always means an account password was used where an App
 * Password is required, and saying so saves an afternoon.
 */
export function readableSmtpError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/invalid login|username and password not accepted|BadCredentials/i.test(message)) {
    return "Gmail rejected the sign-in. It needs a 16-character App Password, not the account password — and 2-Step Verification must be on.";
  }
  if (/Daily user sending limit exceeded|550 5\.4\.5/i.test(message)) {
    return "Gmail's daily sending limit has been reached. The rest can go tomorrow — the panel records who has already received it.";
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(message)) {
    return "Could not reach the mail server. Check the host, the port, and the connection.";
  }
  return message;
}
