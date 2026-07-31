/**
 * Prepare Board of Directors portraits.
 *
 * The supplied files are 1266px square PNG cut-outs with transparent
 * backgrounds, averaging 1.5MB each — 12MB for eight portraits. They are
 * re-encoded to WebP, which keeps the alpha channel (a JPEG would flatten it
 * onto black and lose the cut-out) at roughly a twentieth of the weight.
 *
 * Name and role are read from the filename rather than typed out here, so the
 * spelling on the site is the spelling FXB supplied. The convention is:
 *
 *   "3. Emmanuel KAYITANA _ Executive Director.png"
 *    ^ order            ^ name        ^ role
 *
 * Capitalisation is preserved exactly as delivered — several surnames arrive in
 * upper case, which is the usual Rwandan and Francophone way of marking the
 * family name, and quietly title-casing someone's name is not a formatting
 * decision, it is getting their name wrong.
 *
 * sharp comes with Next.js, which uses it for image optimisation; unlike the
 * ffmpeg the photo pipeline shells out to, it needs nothing installed.
 *
 *   node scripts/prepare-board.mjs <sourceDir>
 */
import sharp from "sharp";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("Usage: node scripts/prepare-board.mjs <sourceDir>");
  process.exit(1);
}

const OUT_DIR = "public/img/board";
const MANIFEST = "src/lib/board.json";

/**
 * Portraits render at about 300px wide, so 720 covers a 2× display with room
 * to spare. next/image resizes down from here and converts to AVIF per
 * browser; this is only the master.
 */
const SIZE = 720;
const QUALITY = 82;

/** Honorifics and post-nominals belong in the displayed name, not the URL. */
const HONORIFICS = /^(fr|dr|prof|mr|mrs|ms|rev)\.?\s+/i;

const slug = (name) =>
  name
    .replace(/\([^)]*\)/g, "")
    .replace(HONORIFICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** "3. Emmanuel KAYITANA _ Executive Director.png" */
function parse(file) {
  const stem = basename(file, extname(file));
  const match = stem.match(/^\s*(\d+)\s*\.\s*(.+?)\s*_\s*(.+?)\s*$/);

  if (!match) {
    console.error(
      `Filename does not match "<order>. <Name> _ <Role>": ${file}`
    );
    process.exit(1);
  }

  const [, order, name, role] = match;
  // Collapse the double spaces a couple of the supplied names carry.
  return {
    order: Number(order),
    name: name.replace(/\s+/g, " "),
    role: role.replace(/\s+/g, " "),
  };
}

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(sourceDir)).filter((file) =>
  /\.(png|webp|jpe?g)$/i.test(file)
);

if (files.length === 0) {
  console.error(`No images found in ${sourceDir}`);
  process.exit(1);
}

const members = files.map((file) => ({ file, ...parse(file) }));
members.sort((a, b) => a.order - b.order);

const manifest = [];

for (const { file, name, role } of members) {
  const id = slug(name);
  const outName = `${id}.webp`;

  const { width, height } = await sharp(join(sourceDir, file))
    // `fit: "contain"` with a transparent background rather than "cover": these
    // are cut-outs, and cropping one to fill a square would clip a shoulder.
    .resize(SIZE, SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: QUALITY, alphaQuality: 100 })
    .toFile(join(OUT_DIR, outName));

  manifest.push({ id, name, role, src: `/img/board/${outName}`, width, height });

  console.log(`${name.padEnd(34)} ${role.padEnd(18)} -> ${outName}`);
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

console.log(`\n${manifest.length} portraits -> ${OUT_DIR}/, ${MANIFEST}`);
