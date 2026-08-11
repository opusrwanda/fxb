import type {
  CampaignContent,
  CampaignStory,
  RichText,
  RichTextNode,
} from "../db/schema";

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

/**
 * The palette and the shell come from FXB's newsletter template.
 *
 * `FXB_Newsletter_Template_Proposal.html` is the design this renders: a 600px
 * column on #F2F5F7, white logo bar with rounded top, hero photograph, an
 * eyebrow of edition and date over a heavy blue headline, the body, an impact
 * band, social icons, and a blue footer with rounded bottom.
 *
 * What is not carried over is the template's per-story scaffolding — the
 * repeated story modules, the quote blocks, the paired photographs, the
 * per-story banners. Those are a proposal for how an edition can be laid out,
 * not fields: reproducing them literally would mean a campaign form with forty
 * boxes, most of them empty most of the time. The editor writes the middle of
 * the letter instead, and a picture or a video placed in it renders in the
 * template's own style — see `toHtml`.
 */
const BLUE = "#0472c2";
const GREEN = "#008d00";
const GRAY = "#535353";
/** The template's ground, one step warmer than the old #f3f7fb. */
const LIGHT = "#f2f5f7";
const FONT = "'Poppins',Arial,Helvetica,sans-serif";

/**
 * A site-relative path, made absolute.
 *
 * An email is not served from the site, so `/media/photo.jpg` resolves against
 * nothing and every picture in the letter is a broken box. Set at render time
 * from the site URL rather than stored, so moving the site does not rewrite
 * every campaign that has already been written.
 */
let ORIGIN = "";
function absolute(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

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
      return `<hr style="border:none;border-top:1px solid #e7ecf0;margin:28px 0;" />`;

    // A picture placed in the editor. Rounded to 6px like the template's story
    // photographs, and full width of the column.
    case "image": {
      const src = typeof node.src === "string" ? node.src : "";
      if (!src) return "";
      const alt = typeof node.alt === "string" ? node.alt : "";
      return `<img src="${esc(absolute(src))}" alt="${esc(alt)}" width="540" style="display:block;width:100%;max-width:540px;height:auto;border-radius:6px;margin:0 0 18px;" />`;
    }

    /**
     * A video, as a link.
     *
     * No mail client plays an embed — Gmail and Outlook both strip the iframe —
     * so the template links out to it, and so does this. The play glyph and the
     * title are what the template puts under its thumbnail.
     */
    case "video": {
      const provider = node.provider as string;
      const id = typeof node.videoId === "string" ? node.videoId : "";
      if (!id) return "";
      const title = (typeof node.title === "string" && node.title) || "Watch the video";
      const url =
        provider === "vimeo"
          ? `https://vimeo.com/${id}`
          : provider === "file"
            ? absolute(id)
            : `https://www.youtube.com/watch?v=${id}`;
      return `<p style="margin:0 0 18px;font-family:${FONT};font-weight:600;font-size:14px;"><a href="${esc(url)}" style="color:${BLUE};text-decoration:none;">&#9658;&nbsp; ${esc(title)}</a></p>`;
    }

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
  edition,
  editionDate,
  heroUrl,
  logoUrl,
  content,
  legacyBody,
  firstName,
  stats,
  news,
  socials,
  unsubscribeUrl,
  siteUrl,
  organisation,
  address,
  email,
}: {
  subject: string;
  preheader?: string | null;
  edition?: string | null;
  /** Already formatted for display. */
  editionDate?: string | null;
  heroUrl?: string | null;
  logoUrl: string;
  content: CampaignContent | null;
  /**
   * The rich-text body of a campaign written before the template existed.
   * Rendered in place of the story modules so an old draft still sends.
   */
  legacyBody?: RichText | null;
  /** The recipient's name, for the greeting. Blank becomes "our friend". */
  firstName?: string | null;
  stats?: { figure: string; label: string }[];
  news?: { headline: string; url: string; imageUrl?: string }[];
  socials?: { label: string; href: string }[];
  unsubscribeUrl: string;
  siteUrl: string;
  organisation: string;
  address: string;
  email?: string;
}): RenderedEmail {
  ORIGIN = siteUrl.replace(/\/$/, "");

  const stories = (content?.stories ?? []).filter(
    (story) => story.headline || story.excerpt || story.imageUrl,
  );
  const gallery = (content?.galleryImages ?? []).filter(Boolean);
  const band = content?.showStats === false ? [] : (stats ?? []).slice(0, 3);
  const teasers = content?.showNews === false ? [] : (news ?? []).slice(0, 2);

  /** One 600px table. Every block in the template is one of these. */
  const block = (inner: string, background = "#ffffff", extra = "") =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:${background};${extra}"><tr>${inner}</tr></table>`;

  const para = (text: string) =>
    esc(text)
      .split(/\n{2,}/)
      .map(
        (chunk, index) =>
          `<p style="margin:${index === 0 ? "0" : "14px 0 0"};">${chunk.replace(/\n/g, "<br />")}</p>`,
      )
      .join("");

  /**
   * One story module.
   *
   * Every part below the headline is optional and drops out entirely when it
   * is empty — an edition with a story that has no video should not send a
   * blank frame where the video would be. The banner alternates blue and green
   * down the letter, as the template does across its two worked examples.
   */
  const storyModule = (story: CampaignStory, index: number) => {
    const accent = index % 2 === 0 ? BLUE : GREEN;
    const parts: string[] = [];

    parts.push(
      block(
        `<td class="mobile-padding" style="padding:30px 30px 0;font-family:${FONT};">
          ${
            story.eyebrow
              ? `<p style="margin:0 0 12px;font-size:12px;font-weight:600;color:${BLUE};text-transform:uppercase;letter-spacing:1px;">${esc(story.eyebrow)}</p>`
              : ""
          }
          ${
            story.imageUrl
              ? `<img src="${esc(absolute(story.imageUrl))}" width="540" alt="" style="display:block;width:100%;height:auto;border-radius:6px;" />`
              : ""
          }
          ${
            story.headline
              ? `<h2 style="margin:16px 0 10px;font-size:20px;line-height:27px;font-weight:800;color:${BLUE};font-family:${FONT};">${esc(story.headline)}</h2>`
              : ""
          }
          ${
            story.excerpt
              ? `<div style="font-size:15px;line-height:24px;color:${GRAY};">${para(story.excerpt)}</div>`
              : ""
          }
          ${
            story.url
              ? `<p style="margin:14px 0 0;"><a href="${esc(story.url)}" style="font-family:${FONT};font-size:14px;font-weight:700;color:${BLUE};text-decoration:none;">Read the full story &rarr;</a></p>`
              : ""
          }
        </td>`,
      ),
    );

    if (story.quote) {
      parts.push(
        block(
          `<td class="mobile-padding" style="padding:24px 40px;font-family:${FONT};">
            <p style="margin:0 0 10px;font-size:32px;line-height:1;color:${GREEN};font-weight:700;">&ldquo;</p>
            <p style="margin:0 0 12px;font-size:16px;line-height:25px;font-style:italic;font-weight:300;color:${BLUE};">${esc(story.quote)}</p>
            ${
              story.quoteAuthor
                ? `<p style="margin:0;font-size:13px;font-weight:700;color:${GRAY};">&mdash; ${esc(story.quoteAuthor)}</p>`
                : ""
            }
          </td>`,
          LIGHT,
        ),
      );
    }

    if (story.videoUrl) {
      // A link, never an embed: Gmail and Outlook both strip the iframe, so
      // the template links out from a thumbnail and so does this.
      parts.push(
        block(
          `<td class="mobile-padding" style="padding:24px 30px 10px;">
            ${
              story.videoThumbnailUrl
                ? `<a href="${esc(story.videoUrl)}" style="text-decoration:none;display:block;"><img src="${esc(absolute(story.videoThumbnailUrl))}" width="540" alt="${esc(story.videoTitle ?? "")}" style="display:block;width:100%;height:auto;border-radius:6px;" /></a>`
                : ""
            }
            <p style="margin:12px 0 0;font-family:${FONT};font-weight:600;font-size:14px;">
              <a href="${esc(story.videoUrl)}" style="color:${BLUE};text-decoration:none;">&#9658;&nbsp; ${esc(story.videoTitle || "Watch the video")}</a>
            </p>
          </td>`,
        ),
      );
    }

    if (story.photoAUrl || story.photoBUrl) {
      const cell = (url?: string) =>
        url
          ? `<td class="stack-column two-col-photo" width="268" valign="top" style="width:268px;padding:0 4px;"><img src="${esc(absolute(url))}" width="268" alt="" style="display:block;width:100%;height:180px;object-fit:cover;border-radius:6px;" /></td>`
          : "";
      parts.push(
        block(
          `<td class="mobile-padding" style="padding:18px 22px 26px;">
            <table role="presentation" width="556" cellpadding="0" cellspacing="0" style="width:556px;max-width:556px;"><tr>${cell(story.photoAUrl)}${cell(story.photoBUrl)}</tr></table>
          </td>`,
        ),
      );
    }

    if (story.bannerHeadline || story.bannerCtaUrl) {
      parts.push(
        block(
          `<td align="center" style="padding:26px 30px;font-family:${FONT};">
            ${
              story.bannerHeadline
                ? `<p style="margin:0 0 6px;font-size:17px;font-weight:800;color:#ffffff;">${esc(story.bannerHeadline)}</p>`
                : ""
            }
            ${
              story.bannerSubtext
                ? `<p style="margin:0 0 16px;font-size:13px;font-weight:400;color:#ffffff;">${esc(story.bannerSubtext)}</p>`
                : ""
            }
            ${
              story.bannerCtaUrl
                ? `<a href="${esc(story.bannerCtaUrl)}" style="background-color:#ffffff;border-radius:24px;color:${accent};display:inline-block;font-family:${FONT};font-size:14px;font-weight:700;line-height:20px;text-align:center;text-decoration:none;padding:11px 26px;word-break:break-word;">${esc(story.bannerCtaLabel || "Find out more")}</a>`
                : ""
            }
          </td>`,
          accent,
        ),
      );
    }

    return parts.join("\n");
  };

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${esc(subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
  body{margin:0;padding:0;width:100%!important;background-color:${LIGHT};}
  @media screen and (max-width:600px){
    .email-container{width:100%!important;}
    .stack-column{display:block!important;width:100%!important;}
    .mobile-padding{padding-left:20px!important;padding-right:20px!important;}
    .hero-title{font-size:24px!important;line-height:32px!important;}
    .stat-number{font-size:26px!important;}
    .two-col-photo{width:100%!important;display:block!important;margin-bottom:12px;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${LIGHT};">
${
  preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}</div>`
    : ""
}
<center style="width:100%;background-color:${LIGHT};">
<div class="email-container" style="max-width:600px;margin:0 auto;">

  ${block(
    `<td align="center" style="padding:28px 20px 20px;"><img src="${esc(absolute(logoUrl))}" width="220" alt="${esc(organisation)}" style="display:block;width:220px;max-width:60%;height:auto;" /></td>`,
    "#ffffff",
    "border-radius:8px 8px 0 0;overflow:hidden;",
  )}

  ${
    heroUrl
      ? block(
          `<td style="padding:0;"><img src="${esc(absolute(heroUrl))}" width="600" alt="" style="display:block;width:100%;height:auto;" /></td>`,
        )
      : ""
  }

  ${block(
    `<td align="center" style="padding:28px 30px 8px;font-family:${FONT};">
      ${
        edition || editionDate
          ? `<p style="margin:0 0 6px;font-size:12px;letter-spacing:1.5px;font-weight:600;color:${BLUE};text-transform:uppercase;">${esc([edition, editionDate].filter(Boolean).join(" · "))}</p>`
          : ""
      }
      <h1 class="hero-title" style="margin:0;font-size:28px;line-height:36px;font-weight:900;color:${BLUE};font-family:${FONT};">${esc(subject)}</h1>
    </td>`,
  )}

  ${block(
    `<td class="mobile-padding" style="padding:12px 30px 24px;font-family:${FONT};font-weight:400;font-size:15px;line-height:24px;color:${GRAY};">
      <p style="margin:0 0 14px;">Dear ${esc(firstName?.trim() || "our friend")},</p>
      ${content?.intro ? para(content.intro) : ""}
    </td>`,
  )}

  ${block(
    `<td style="padding:0 30px;"><div style="border-top:3px solid ${GREEN};width:60px;"></div></td>`,
  )}

  ${
    stories.length > 0
      ? stories.map(storyModule).join("\n")
      : legacyBody
        ? block(
            `<td class="mobile-padding" style="padding:24px 30px 28px;font-family:${FONT};font-size:15px;line-height:24px;color:${GRAY};">${(legacyBody.root?.children ?? []).map(toHtml).join("")}</td>`,
          )
        : ""
  }

  ${
    gallery.length > 0
      ? block(
          `<td class="mobile-padding" style="padding:30px 22px 26px;font-family:${FONT};">
            ${
              content?.galleryTitle
                ? `<p style="margin:0 0 14px 8px;font-size:12px;font-weight:600;color:${BLUE};text-transform:uppercase;letter-spacing:1px;">${esc(content.galleryTitle)}</p>`
                : ""
            }
            <table role="presentation" width="556" cellpadding="0" cellspacing="0" style="width:556px;max-width:556px;"><tr>${gallery
              .slice(0, 3)
              .map(
                (url) =>
                  `<td class="stack-column two-col-photo" valign="top" style="padding:0 4px;"><img src="${esc(absolute(url))}" width="176" alt="" style="display:block;width:100%;height:130px;object-fit:cover;border-radius:6px;" /></td>`,
              )
              .join("")}</tr></table>
          </td>`,
        )
      : ""
  }

  ${
    band.length > 0
      ? block(
          `<td align="center" style="padding:26px 20px;font-family:${FONT};">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;"><tr>
              <td align="center" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:20px;padding:7px 18px;">
                <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:1px;color:${GREEN};text-transform:uppercase;white-space:nowrap;">Our impact</p>
              </td>
            </tr></table>
            <!-- table-layout:fixed is what stops a long figure forcing its
                 cell wider than its share and pushing past the container. -->
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;table-layout:fixed;"><tr>
              ${band
                .map(
                  (stat) =>
                    `<td class="stack-column" align="center" valign="top" style="font-family:${FONT};overflow:hidden;">
                      <p class="stat-number" style="margin:0;font-size:26px;font-weight:900;color:#ffffff;word-break:break-word;overflow-wrap:break-word;">${esc(stat.figure)}</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#e5e5e5;padding:0 8px;word-break:break-word;overflow-wrap:break-word;">${esc(stat.label)}</p>
                    </td>`,
                )
                .join("")}
            </tr></table>
          </td>`,
          BLUE,
        )
      : ""
  }

  ${
    teasers.length > 0
      ? block(
          `<td class="mobile-padding" style="padding:30px 30px 26px;font-family:${FONT};">
            <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:${BLUE};text-transform:uppercase;letter-spacing:1px;">More from ${esc(organisation)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              ${teasers
                .map(
                  (item, index) =>
                    `<td class="stack-column two-col-photo" width="48%" valign="top" style="padding-${index === 0 ? "right" : "left"}:10px;">
                      ${
                        item.imageUrl
                          ? `<img src="${esc(absolute(item.imageUrl))}" width="260" alt="" style="display:block;width:100%;height:auto;border-radius:6px;margin-bottom:10px;" />`
                          : ""
                      }
                      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:${BLUE};line-height:20px;">${esc(item.headline)}</p>
                      <a href="${esc(item.url)}" style="font-family:${FONT};font-size:13px;color:${BLUE};text-decoration:none;">Read more &rarr;</a>
                    </td>`,
                )
                .join("")}
            </tr></table>
          </td>`,
        )
      : ""
  }

  ${
    (socials ?? []).length > 0
      ? block(
          `<td align="center" style="padding:24px 30px;font-family:${FONT};font-size:13px;">${(socials ?? [])
            .map(
              (social) =>
                `<a href="${esc(social.href)}" style="color:${BLUE};text-decoration:none;font-weight:600;margin:0 8px;display:inline-block;">${esc(social.label)}</a>`,
            )
            .join("")}</td>`,
          "#ffffff",
          "border-top:1px solid #e7ecf0;",
        )
      : ""
  }

  ${block(
    `<td align="center" style="padding:26px 30px;font-family:${FONT};font-size:12px;line-height:20px;color:#e5e5e5;">
      <p style="margin:0 0 6px;font-weight:700;color:#ffffff;">${esc(organisation)} — Ending Poverty, Restoring Dignity</p>
      <p style="margin:0 0 12px;">${esc(address)}</p>
      <p style="margin:0 0 4px;">
        <a href="${esc(siteUrl)}" style="color:#ffffff;text-decoration:underline;">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a>${
          email
            ? `&nbsp;·&nbsp;<a href="mailto:${esc(email)}" style="color:#ffffff;text-decoration:underline;">${esc(email)}</a>`
            : ""
        }
      </p>
      <p style="margin:12px 0 0;">
        You are receiving this because you subscribed on our website.
        <a href="${esc(unsubscribeUrl)}" style="color:#ffffff;text-decoration:underline;">Unsubscribe</a>
      </p>
    </td>`,
    BLUE,
    "border-radius:0 0 8px 8px;",
  )}

</div>
</center>
</body>
</html>`;

  const text = [
    subject,
    [edition, editionDate].filter(Boolean).join(" · "),
    "",
    `Dear ${firstName?.trim() || "our friend"},`,
    content?.intro ?? "",
    "",
    ...stories.flatMap((story) =>
      [
        story.headline,
        story.excerpt,
        story.url ? `Read the full story: ${story.url}` : "",
        story.quote ? `"${story.quote}"${story.quoteAuthor ? ` — ${story.quoteAuthor}` : ""}` : "",
        story.videoUrl ? `${story.videoTitle || "Watch the video"}: ${story.videoUrl}` : "",
        story.bannerHeadline,
        story.bannerCtaUrl ? `${story.bannerCtaLabel || "Find out more"}: ${story.bannerCtaUrl}` : "",
        "",
      ].filter(Boolean),
    ),
    stories.length === 0 && legacyBody
      ? (legacyBody.root?.children ?? []).map(toText).join("")
      : "",
    ...band.map((stat) => `${stat.figure} — ${stat.label}`),
    "",
    ...teasers.map((item) => `${item.headline}: ${item.url}`),
    "",
    organisation,
    address,
    siteUrl,
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter((line) => line !== undefined && line !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return { html, text };
}
