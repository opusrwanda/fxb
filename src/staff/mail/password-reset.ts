import { getTransport, mailConfig } from "./transport";

/**
 * The email with the link to choose a new password.
 *
 * Plain, like the sign-in code's: it is read once, usually on a phone, by
 * somebody who is locked out and wants one thing from it.
 */
export async function sendPasswordReset(
  to: string,
  name: string,
  link: string,
): Promise<{ ok: boolean }> {
  const config = mailConfig();
  if (!config) return { ok: false };

  const first = name.trim().split(/\s+/)[0] || "there";

  const text = [
    `Hello ${first},`,
    "",
    "Somebody asked to reset the password for your FXB Rwanda staff panel account. To choose a new one, open this link:",
    "",
    link,
    "",
    "It works once, and stops working in thirty minutes.",
    "",
    "If you did not ask for this, you can ignore this email — your password has not changed.",
    "",
    "— The FXB Rwanda website",
  ].join("\n");

  try {
    await getTransport(config).sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to,
      subject: "Reset your FXB staff panel password",
      text,
      html: html(first, link),
    });
    return { ok: true };
  } catch (error) {
    console.error("[login] could not send the reset link", error);
    return { ok: false };
  }
}

function html(first: string, link: string): string {
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f4f6f9;font-family:Helvetica,Arial,sans-serif;color:#3f4a55">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px">
  <tr><td style="padding:32px">
    <p style="margin:0 0 20px;font-size:16px">Hello ${escape(first)},</p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6">
      Somebody asked to reset the password for your FXB Rwanda staff panel
      account. To choose a new one:
    </p>
    <p style="margin:0 0 24px">
      <a href="${escape(link)}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#0b3b6f;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none">Choose a new password</a>
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5b6773">
      The link works once, and stops working in thirty minutes.
    </p>
    <p style="margin:0;padding-top:20px;border-top:1px solid #e4e8ed;font-size:14px;line-height:1.6;color:#5b6773">
      If you did not ask for this, you can ignore this email — your password
      has not changed.
    </p>
  </td></tr>
</table>
</body></html>`;
}

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
