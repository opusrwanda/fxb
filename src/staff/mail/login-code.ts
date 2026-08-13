import { getTransport, mailConfig } from "./transport";

/**
 * The sign-in code, as an email.
 *
 * Deliberately plain, and deliberately not the newsletter template. A message
 * carrying a credential should look like a notice from a system, not like
 * marketing — the newsletter's hero photograph and impact figures around a
 * six-digit number is exactly the shape of a phishing email, and staff are
 * trained to distrust that shape.
 *
 * It says what to do if the code was not asked for, because that sentence is
 * the only warning anybody will ever get that somebody else has their password.
 */
export async function sendLoginCode(
  to: string,
  name: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const config = mailConfig();
  if (!config) {
    return { ok: false, error: "Email is not connected on this server." };
  }

  const first = name.trim().split(/\s+/)[0] || "there";

  const text = [
    `Hello ${first},`,
    "",
    `Your sign-in code for the FXB Rwanda staff panel is:`,
    "",
    `    ${code}`,
    "",
    "It works once, and stops working in ten minutes.",
    "",
    "If you did not just try to sign in, somebody else has your password. Do not enter this code — sign in yourself and change your password under Your account, and tell an admin.",
    "",
    "— The FXB Rwanda website",
  ].join("\n");

  try {
    await getTransport(config).sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to,
      subject: `${code} is your FXB staff sign-in code`,
      text,
      html: html(first, code),
      // A sign-in code is worthless in ten minutes, so there is nothing to be
      // gained by a mail client filing it as part of an older conversation.
      headers: { "X-Entity-Ref-ID": code },
    });

    return { ok: true };
  } catch (error) {
    console.error("[login] could not send the code", error);
    return {
      ok: false,
      error: "The code could not be sent. Try again in a moment.",
    };
  }
}

/** The same message, for a client that shows HTML. Tables and inline styles, as email requires. */
function html(first: string, code: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f4f6f9;font-family:Helvetica,Arial,sans-serif;color:#3f4a55">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px">
  <tr><td style="padding:32px">
    <p style="margin:0 0 20px;font-size:16px">Hello ${escape(first)},</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6">
      Your sign-in code for the FXB Rwanda staff panel is:
    </p>
    <p style="margin:0 0 20px;font-size:34px;font-weight:700;letter-spacing:6px;color:#0b3b6f">
      ${escape(code)}
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5b6773">
      It works once, and stops working in ten minutes.
    </p>
    <p style="margin:0;padding-top:20px;border-top:1px solid #e4e8ed;font-size:14px;line-height:1.6;color:#5b6773">
      If you did not just try to sign in, somebody else has your password.
      Do not enter this code — sign in yourself, change your password under
      Your account, and tell an admin.
    </p>
  </td></tr>
</table>
</body></html>`;
}

/** The name comes from the database and the code from us; neither is trusted into HTML unescaped. */
function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
