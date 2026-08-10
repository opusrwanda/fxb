import { readFile } from "node:fs/promises";

import { getSiteDetails } from "@/cms/content/settings";
import { mailConfig, getTransport } from "@/staff/mail/transport";
import {
  createApplication,
  cvPath,
  markNotified,
} from "@/staff/queries/applications";

/**
 * An application against a vacancy.
 *
 * Recorded first, emailed second, and the two are reported separately. This is
 * the opposite arrangement to `/api/contact`, which refuses outright when no
 * mail provider is configured — right for a message whose only destination is
 * an inbox, wrong here. An application has a home in the database whatever the
 * mail server is doing, so the applicant is told it arrived, because it has,
 * and the row carries `notified: false` for staff to act on.
 *
 * Multipart rather than JSON, because a CV is a file.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "That did not arrive complete. Please try again." },
      { status: 400 },
    );
  }

  const opportunityId = Number(form.get("opportunityId"));
  if (!Number.isInteger(opportunityId)) {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const cv = form.get("cv");

  const result = await createApplication({
    opportunityId,
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    message: String(form.get("message") ?? ""),
    cv: cv instanceof File ? cv : null,
  });

  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

  // Everything past here is notification. It has already been recorded, so a
  // failure is logged and swallowed rather than shown to the applicant — there
  // is nothing they could do about it and nothing for them to fix.
  void notify(result, form).catch((error) =>
    console.error("[applications] notification failed", error),
  );

  return Response.json({
    message:
      "Thank you — your application has been received. We read every one, and will be in touch if we would like to take it further.",
  });
}

async function notify(
  application: { id: number; cvFilename: string | null; cvOriginalName: string | null },
  form: FormData,
): Promise<void> {
  const { id } = application;
  const config = mailConfig();
  if (!config) {
    console.warn(`[applications] #${id} recorded but SMTP is not configured`);
    return;
  }

  const details = await getSiteDetails();
  const title = String(form.get("title") ?? "an opening");
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();

  const lines = [
    `A new application for: ${title}`,
    "",
    `Name:  ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    "",
    message ? "Covering note:" : "No covering note.",
    message || null,
    "",
    `Recorded as application #${id}. The CV is attached and is also on file in the staff panel.`,
  ].filter((line) => line !== null);

  const attachments: { filename: string; content: Buffer }[] = [];
  if (application.cvFilename) {
    const full = cvPath(application.cvFilename);
    if (full) {
      try {
        attachments.push({
          filename: application.cvOriginalName ?? application.cvFilename,
          content: await readFile(full),
        });
      } catch {
        // The row still points at the file and the panel can still serve it;
        // the email simply goes without the attachment.
      }
    }
  }

  await getTransport(config).sendMail({
    from: `"${config.fromName}" <${config.fromAddress}>`,
    to: details.email,
    // So a reply from the office goes to the candidate rather than to FXB's
    // own sending address.
    replyTo: email,
    subject: `Application: ${title} — ${name}`,
    text: lines.join("\n"),
    attachments,
  });

  await markNotified(id);
}
