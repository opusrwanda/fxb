import path from "node:path";
import { readFile } from "node:fs/promises";
import { getPayload } from "payload";
import config from "../payload.config";

import { news } from "../src/lib/news";
import { stories } from "../src/lib/stories";
import { projects } from "../src/lib/projects";
import { board } from "../src/lib/leadership";
import { partners } from "../src/lib/partners";
import { publications } from "../src/lib/publications";
import { reach } from "../src/lib/impact";
import { projectsDelivered } from "../src/lib/fxbvillage";
import { photo } from "../src/lib/photos";
import { org, socials, externalSystems } from "../src/lib/site";

/**
 * Move the site's existing content into the CMS.
 *
 * Everything the site renders was written as TypeScript modules under
 * `src/lib` — fine for a build and useless for FXB, because publishing a news
 * item meant editing a file and a missing comma took the site down. This lifts
 * it into Payload once so the team can take it from there.
 *
 * Run it with Payload's own runner, which loads the config and the env:
 *
 *   npx payload run scripts/seed-cms.ts
 *
 * IT IS SAFE TO RUN AGAIN. Every document is looked up by its slug (or its
 * name, for the two collections that have none) and updated rather than
 * duplicated, and media is keyed on filename, so a second run does not upload
 * ninety images a second time. That matters more than it sounds: this will be
 * run once against the local database and again against production, and the
 * source files will have moved on in between.
 *
 * WHAT IS DELIBERATELY NOT PUBLISHED
 *
 * The eighteen publications are placeholders — the brief lists documents FXB
 * has not yet supplied, and the `file` field is required for good reason. They
 * arrive as Payload drafts: the team attaches the real PDF and presses
 * Publish. An annual report the site claims to have and cannot produce is
 * worse than a page saying it is coming.
 *
 * The six programmes are published, because the programmes are real — but the
 * descriptions were written to show the template carrying copy, so each one
 * carries `unconfirmed` and its page keeps saying so until FXB approves the
 * wording.
 */

const payload = await getPayload({ config });

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? "";

/** Paragraphs in, the Lexical document Payload stores rich text as out. */
function richText(paragraphs: string[]) {
  const children = paragraphs.map((text) => ({
    type: "paragraph",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    textFormat: 0,
    children: [
      {
        type: "text",
        text,
        format: 0,
        style: "",
        detail: 0,
        mode: "normal",
        version: 1,
      },
    ],
  }));

  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: children.length
        ? children
        : [
            {
              type: "paragraph",
              format: "",
              indent: 0,
              version: 1,
              direction: "ltr",
              textFormat: 0,
              children: [],
            },
          ],
    },
  };
}

/**
 * The one document matching `field`, or null.
 *
 * The collection slug is a string here rather than a union, because every
 * caller passes a different one; the generated types cannot follow that, hence
 * the casts. The return type is narrowed by hand to the one property this
 * script uses.
 */
async function findBy(
  collection: string,
  field: string,
  value: string
): Promise<{ id: number | string } | null> {
  const { docs } = await payload.find({
    collection: collection as never,
    where: { [field]: { equals: value } },
    limit: 1,
    depth: 0,
    pagination: false,
  });
  return (docs[0] as { id: number | string } | undefined) ?? null;
}

const mediaByFilename = new Map<string, number | string>();

function mimeFor(filename: string) {
  if (filename.endsWith(".webp")) return "image/webp";
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".pdf")) return "application/pdf";
  return "image/jpeg";
}

/**
 * Put a file in the media library, once.
 *
 * `source` is either an absolute CDN URL or a path under `public/`. Both end
 * up as a genuine upload, so from here on the CMS owns the image and the team
 * can replace one without anybody touching the storage zone.
 */
async function upload(source: string, alt: string) {
  const filename = path.basename(source);

  const cached = mediaByFilename.get(filename);
  if (cached !== undefined) return cached;

  const existing = await findBy("media", "filename", filename);
  if (existing) {
    mediaByFilename.set(filename, existing.id);
    return existing.id;
  }

  let data: Buffer;
  if (source.startsWith("http")) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`${response.status} fetching ${source}`);
    data = Buffer.from(await response.arrayBuffer());
  } else {
    data = await readFile(path.join("public", source.replace(/^\//, "")));
  }

  const doc = await payload.create({
    collection: "media",
    data: { alt },
    file: { data, name: filename, mimetype: mimeFor(filename), size: data.length },
  });

  mediaByFilename.set(filename, doc.id);
  return doc.id;
}

/**
 * What to put in `alt` for a photograph nobody has described.
 *
 * The impact figures and the publication covers both render their photograph
 * decoratively, behind type, with `alt=""` — so the site asks nothing of these
 * strings. The library still does: someone browsing the Media collection needs
 * to know what they are looking at, and "2025 Annual Report" is a title, not a
 * description of a photograph of people.
 *
 * Where the codebase already has a real description — every news photo, story
 * photo and programme photo carries one — that wins, because those collections
 * are seeded first and `upload()` keeps the first alt it is given. This is only
 * for the frames nothing has ever described, and it says so rather than
 * inventing a caption for a photograph of a household.
 */
const UNDESCRIBED = "FXB Rwanda programme photograph — description to be written.";

const created: Record<string, number> = {};

/** Create, or update what is already there. Keyed on `field`. */
async function upsert(
  collection: string,
  field: string,
  value: string,
  data: Record<string, unknown>
) {
  // `_status` in the data sets what the document is; `draft` tells the
  // operation how to treat it. Both are needed: without the flag, a document
  // saved as a draft still has its required fields validated, and the eighteen
  // publications have no PDF to attach yet.
  const draft = data._status === "draft";

  const existing = await findBy(collection, field, value);
  if (existing) {
    await payload.update({
      collection: collection as never,
      id: existing.id,
      data: data as never,
      draft,
    });
    return;
  }
  await payload.create({ collection: collection as never, data: data as never, draft });
  created[collection] = (created[collection] ?? 0) + 1;
}

// ── News ───────────────────────────────────────────────────────────────────

console.log("News…");
for (const item of news) {
  await upsert("news", "slug", item.slug, {
    title: item.title,
    slug: item.slug,
    date: item.date,
    language: item.language === "fr" ? "fr" : "en",
    photo: await upload(photo(item.photo).url, item.alt),
    excerpt: item.excerpt,
    // Four of the four have no body yet — the site shows the excerpt and links
    // out. Seeding the excerpt as the first paragraph gives the team something
    // to open and extend rather than an empty editor.
    body: richText(item.body ?? [item.excerpt]),
    _status: "published",
  });
}

// ── Stories ────────────────────────────────────────────────────────────────

console.log("Stories…");
for (const item of stories) {
  await upsert("stories", "slug", item.slug, {
    title: item.title,
    slug: item.slug,
    date: item.date,
    photo: await upload(photo(item.photo).url, item.alt),
    excerpt: item.excerpt,
    body: richText(item.body ?? [item.excerpt]),
    _status: "published",
  });
}

// ── Programmes ─────────────────────────────────────────────────────────────

console.log("Programmes…");
for (const [index, project] of projects.entries()) {
  await upsert("programmes", "slug", project.id, {
    name: project.name,
    slug: project.id,
    stage: project.active ? "current" : "phased-out",
    order: index + 1,
    districts: project.districts,
    photo: project.photo
      ? await upload(photo(project.photo).url, project.photoAlt ?? project.name)
      : undefined,
    summary: project.summary,
    body: richText(project.body ?? []),
    components: (project.components ?? []).map((item) => ({ item })),
    runs: project.runs,
    funder: project.funder,
    externalUrl: project.href,
    unconfirmed: project.draft === true,
    _status: "published",
  });
}

// ── Board of Directors ─────────────────────────────────────────────────────

console.log("Board…");
for (const [index, member] of board.entries()) {
  await upsert("board", "name", member.name, {
    name: member.name,
    role: member.role,
    // The order FXB numbered them: Chairperson first, advisors last.
    order: index + 1,
    portrait: await upload(member.src, `${member.name}, ${member.role}`),
  });
}

// ── Partners ───────────────────────────────────────────────────────────────

console.log("Partners…");
for (const partner of partners) {
  await upsert("partners", "name", partner.name, {
    name: partner.name,
    category: partner.category,
    logo: await upload(`${CDN}/${partner.src}`, `${partner.name} logo`),
  });
}

// ── Publications ───────────────────────────────────────────────────────────

console.log("Publications…");
for (const publication of publications) {
  await upsert("publications", "slug", publication.slug, {
    title: publication.title,
    slug: publication.slug,
    category: publication.category,
    date: publication.date,
    cover: publication.cover
      ? await upload(photo(publication.cover).url, UNDESCRIBED)
      : undefined,
    // No `file`: the documents themselves do not exist yet. Drafts skip the
    // required-field check, which is precisely the state these are in.
    _status: "draft",
  });
}

// ── Impact figures ─────────────────────────────────────────────────────────

console.log("Impact figures…");
await payload.updateGlobal({
  slug: "impact",
  data: {
    figures: await Promise.all(
      reach.map(async (figure) => ({
        label: figure.label,
        value: figure.value,
        caption: figure.caption,
        areas: figure.areas.map((item) => ({ item })),
        photo: await upload(photo(figure.photo).url, UNDESCRIBED),
      }))
    ),
    projectsDelivered,
    note: "Figures are drawn from FXB Rwanda's monitoring and evaluation records, covering the period since 2012, and are being confirmed with MEL for the current reporting cycle.",
  } as never,
});

// ── Site details ───────────────────────────────────────────────────────────

console.log("Site details…");
await payload.updateGlobal({
  slug: "site-settings",
  data: {
    email: org.email,
    phone: org.phone,
    phoneHref: org.phoneHref,
    addressLine: org.address.line,
    addressDistrict: org.address.district,
    addressCountry: org.address.country,
    officeHours: org.officeHours,
    mapUrl: org.mapUrl,
    mapEmbedUrl: org.mapEmbedUrl,
    vision: org.vision,
    visionEmphasis: org.visionEmphasis.map((phrase) => ({ phrase })),
    mission: org.mission,
    socials: socials.map((social) => ({ platform: social.icon, url: social.href })),
    externalSystems: externalSystems.map((system) => ({
      label: system.label,
      url: system.href,
    })),
  } as never,
});

const counts = Object.entries(created)
  .map(([collection, n]) => `${n} ${collection}`)
  .join(", ");

console.log(`\nCreated: ${counts || "nothing new"}`);
console.log(`Media: ${mediaByFilename.size} files in the library`);
process.exit(0);
