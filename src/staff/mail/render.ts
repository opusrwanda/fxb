import type { RichText, RichTextNode } from "../db/schema";

/**
 * A campaign, as an email.
 *
 * Email is not the web. Every rule below exists because a mail client breaks
 * something a browser handles:
 *
 *   Styles are inline. Gmail strips `<style>` blocks in some contexts and
 *   Outlook has never reliably supported them, so each element carries its own
 *   `style` attribute — which is why this is not the site's `Prose` component
 *   with a stylesheet.
 *
 *   The layout is a table. Not nostalgia: Outlook on Windows renders through
 *   Word, which does not do flexbox or grid, and a div-based centred column
 *   collapses to the full window width there.
 *
 *   Colours are hex, not CSS variables. There is no cascade to resolve them.
 *
 * A plain text alternative is built alongside, because a message with no text
 * part scores worse with spam filters and is unreadable to anyone who has
 * images and HTML switched off.
 */

const BLUE = "#0472c2";
const GRAY = "#535353";
const LIGHT = "#f3f7fb";

/** Escape for HTML. Subjects and body text both come from the editor. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BOLD = 1;
const ITALIC = 1 << 1;
const STRIKETHROUGH = 1 << 2;
const UNDERLINE = 1 << 3;

function inlineText(node: RichTextNode): string {
  let html = esc(node.text ?? "");
  const format = typeof node.format === "number" ? node.format : 0;

  if (format & BOLD) html = `<strong>${html}</strong>`;
  if (format & ITALIC) html = `<em>${html}</em>`;
  if (format & UNDERLINE) html = `<u>${html}</u>`;
  if (format & STRIKETHROUGH) html = `<s>${html}</s>`;

  return html;
}

function children(nodes: RichTextNode[] | undefined): string {
  return (nodes ?? []).map(toHtml).join("");
}

function toHtml(node: RichTextNode): string {
  switch (node.type) {
    case "text":
      return inlineText(node);

    case "linebreak":
      return "<br />";

    case "paragraph": {
      if (!node.children?.length) return "";
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${GRAY};">${children(node.children)}</p>`;
    }

    case "heading": {
      const tag = (node.tag as string) ?? "h2";
      const size = tag === "h3" ? 19 : 23;
      return `<${tag} style="margin:28px 0 12px;font-size:${size}px;line-height:1.3;color:${BLUE};font-weight:700;">${children(node.children)}</${tag}>`;
    }

    case "quote":
      return `<blockquote style="margin:20px 0;padding:4px 0 4px 20px;border-left:3px solid ${BLUE};font-size:17px;line-height:1.6;color:${BLUE};">${children(node.children)}</blockquote>`;

    case "list": {
      const tag = node.listType === "number" ? "ol" : "ul";
      return `<${tag} style="margin:0 0 16px;padding-left:22px;font-size:16px;line-height:1.6;color:${GRAY};">${children(node.children)}</${tag}>`;
    }

    case "listitem":
      return `<li style="margin:0 0 8px;">${children(node.children)}</li>`;

    case "horizontalrule":
      return `<hr style="border:none;border-top:1px solid #e0e0e0;margin:28px 0;" />`;

    case "link":
    case "autolink": {
      const fields = (node.fields ?? {}) as { url?: string };
      const url = fields.url ?? (node.url as string) ?? "#";
      return `<a href="${esc(url)}" style="color:${BLUE};text-decoration:underline;">${children(node.children)}</a>`;
    }

    default:
      return children(node.children);
  }
}

function toText(node: RichTextNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "linebreak") return "\n";

  const inner = (node.children ?? []).map(toText).join("");

  switch (node.type) {
    case "paragraph":
    case "heading":
    case "quote":
      return `${inner}\n\n`;
    case "listitem":
      return `  - ${inner}\n`;
    case "horizontalrule":
      return "\n---\n\n";
    default:
      return inner;
  }
}

export type RenderedEmail = { html: string; text: string };

/**
 * Wrap the body in the message everybody actually receives.
 *
 * The unsubscribe link is not decoration and not optional. It is required by
 * law in every jurisdiction this list reaches, and its absence is the single
 * fastest way to have a sending domain marked as spam.
 */
export function renderCampaign({
  subject,
  preheader,
  body,
  unsubscribeUrl,
  siteUrl,
  organisation,
  address,
}: {
  subject: string;
  preheader?: string | null;
  body: RichText | null;
  unsubscribeUrl: string;
  siteUrl: string;
  organisation: string;
  address: string;
}): RenderedEmail {
  const content = (body?.root?.children ?? []).map(toHtml).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${LIGHT};">
${
  preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>`
    : ""
}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${LIGHT};padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:${BLUE};padding:22px 32px;">
            <a href="${esc(siteUrl)}" style="color:#ffffff;font-size:18px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;">${esc(organisation)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;font-family:Helvetica,Arial,sans-serif;">
            <h1 style="margin:0 0 20px;font-size:26px;line-height:1.25;color:${BLUE};font-weight:700;">${esc(subject)}</h1>
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:22px 32px;background:${LIGHT};font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b6b6b;">
            <p style="margin:0 0 8px;">${esc(organisation)} — ${esc(address)}</p>
            <p style="margin:0;">
              You are receiving this because you asked for updates from ${esc(organisation)}.
              <a href="${esc(unsubscribeUrl)}" style="color:${BLUE};">Unsubscribe</a>.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    subject,
    "",
    (body?.root?.children ?? []).map(toText).join("").trim(),
    "",
    "—",
    `${organisation} — ${address}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { html, text };
}
