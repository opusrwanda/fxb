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
    // STARTTLS is required, not merely attempted. Without this nodemailer will
    // fall back to an unencrypted session if the upgrade fails, and a
    // password would go across the wire in the clear.
    requireTLS: config.port !== 465,
    auth: { user: config.user, pass: config.password },
    // One connection reused across the send rather than one per message. Both
    // Gmail and Outlook close connections that open and shut repeatedly, and a
    // campaign is hundreds of messages in a row.
    pool: true,
    maxConnections: 1,
    maxMessages: 50,
    /**
     * The send rate, per minute.
     *
     * This was 14 a second, which is fine for Gmail and far too fast for
     * Microsoft: Exchange Online caps a mailbox at 30 messages a minute and
     * throttles — then temporarily blocks — anything faster. A rate tuned to
     * one provider is not a default, so it is configurable, and the default is
     * the lower of the two limits rather than the one that happens to suit the
     * provider we started with.
     */
    rateDelta: 60_000,
    rateLimit: Number(process.env.MAIL_RATE_PER_MINUTE || 30),
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
 * The provider's own message is the useful part, and each has a small number
 * of failures that account for almost everything. Gmail's "Username and
 * Password not accepted" nearly always means an account password where an App
 * Password is required. Microsoft's 5.7.139 means basic authentication is
 * switched off for that mailbox, which is a tenant setting and not something
 * another password will fix — that one is worth naming precisely, because the
 * obvious response is to keep retrying credentials that were never the
 * problem.
 */
export function readableSmtpError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  /* ── Microsoft ─────────────────────────────────────────────────────────── */

  if (/5\.7\.139|basic authentication is disabled|SmtpClientAuthentication is disabled/i.test(message)) {
    return "Microsoft refused the sign-in because password authentication is switched off for this mailbox. An administrator has to enable SMTP AUTH for it, or the account needs an app password — a different password will not help on its own.";
  }
  if (/5\.7\.708|traffic not accepted from this IP/i.test(message)) {
    return "Microsoft refused mail from this server's IP address. It has to be unblocked, or mail has to go through a relay that is already trusted.";
  }
  if (/4\.7\.500|Server busy|too many messages|4\.3\.2/i.test(message)) {
    return "The mail server is throttling us. Lower MAIL_RATE_PER_MINUTE and send again — the panel records who already has it, so nobody gets it twice.";
  }
  if (/5\.7\.60|SendAsDenied/i.test(message)) {
    return "The From address is not one this account is allowed to send as. Set MAIL_FROM_ADDRESS to the mailbox that is signing in, or grant it Send As permission.";
  }

  /* ── Google ────────────────────────────────────────────────────────────── */

  if (/invalid login|username and password not accepted|BadCredentials/i.test(message)) {
    return "The mail server rejected the sign-in. Gmail needs a 16-character App Password rather than the account password, with 2-Step Verification on; Outlook may need an app password too.";
  }
  if (/Daily user sending limit exceeded|550 5\.4\.5/i.test(message)) {
    return "The daily sending limit has been reached. The rest can go tomorrow — the panel records who has already received it.";
  }

  /* ── The wire ──────────────────────────────────────────────────────────── */

  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(message)) {
    return "Could not reach the mail server. Check the host, the port, and the connection.";
  }
  return message;
}
