/**
 * Prepare the supplied partner logos for the CDN.
 *
 * The supplied set is 34 PNGs, every one of them exactly 765x331, because each
 * logo has been pasted into a template: a 3px rounded blue frame sits hard
 * against the image edge, and the padding between that frame and the mark
 * varies wildly from file to file. Neither belongs on the site — the frame is
 * someone else's card styling, and the inconsistent padding is what makes a
 * naive logo wall look drunk.
 *
 * So each file is:
 *
 *   1. Cropped 16px in on all sides. The frame's corner arcs reach x=0 at
 *      y=15, so 16 is the first inset that clears it completely. Measured, not
 *      guessed — see the crop constant below.
 *   2. Trimmed to its own content bounding box, throwing away the template's
 *      arbitrary padding. Every logo then sits flush in its own box and the
 *      component controls the breathing room, so the row reads as one rhythm.
 *   3. Capped at 600px on the long edge. The slider tile is 176px of content
 *      at most, so 600 covers 3x and leaves room for the tile to grow.
 *
 * Backgrounds are opaque white inside the frame (only the rounded corners
 * outside it were transparent, and those are cropped away), so these are meant
 * to sit on white. The component puts each on a white card.
 *
 *   node scripts/prepare-partner-logos.mjs <sourceDir> <outDir>
 */
import { execFile } from "node:child_process";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const [sourceDir, outDir] = process.argv.slice(2);
if (!sourceDir || !outDir) {
  console.error(
    "Usage: node scripts/prepare-partner-logos.mjs <sourceDir> <outDir>"
  );
  process.exit(1);
}

/** Inset that clears the template frame, corner arcs included. */
const FRAME_INSET = 16;
/** Long-edge cap for the uploaded master. */
const MAX_EDGE = 600;
/**
 * Anything at or above this on all three channels counts as background. Set
 * high deliberately: over-detecting content only grows the bounding box, while
 * under-detecting would clip a pale edge off a logo.
 */
const WHITE = 250;

/**
 * The filename prefix encodes the relationship, e.g. "GOV. NIRDA.png".
 * These are the four groups the site presents them in.
 */
const CATEGORIES = {
  "GOV.": "government",
  "DON.": "donor",
  "PARTN.": "development",
  "CORP.": "corporate",
};

const slug = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** "GOV. NIRDA.png" -> { category: "government", name: "NIRDA" } */
function parseName(file) {
  const name = basename(file, extname(file));
  const prefix = Object.keys(CATEGORIES).find((p) => name.startsWith(p));
  if (!prefix) throw new Error(`Unrecognised category prefix: ${file}`);
  return {
    category: CATEGORIES[prefix],
    name: name.slice(prefix.length).trim(),
  };
}

/** Decode to raw RGBA so the content bounds can be measured directly. */
async function decode(path, width, height) {
  const { stdout } = await run(
    "ffmpeg",
    ["-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgba", "-"],
    { encoding: "buffer", maxBuffer: width * height * 4 + (1 << 20) }
  );
  return stdout;
}

async function probe(path) {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v",
    "-show_entries", "stream=width,height",
    "-of", "csv=p=0:s=x",
    path,
  ]);
  const [width, height] = stdout.trim().split("x").map(Number);
  return { width, height };
}

/** Tightest box containing every pixel that is neither transparent nor white. */
function contentBox(pixels, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (pixels[i + 3] < 16) continue;
      if (pixels[i] >= WHITE && pixels[i + 1] >= WHITE && pixels[i + 2] >= WHITE)
        continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) throw new Error("no content found");
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

await mkdir(outDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((f) => /\.png$/i.test(f)).sort();
const manifest = [];

for (const file of files) {
  const { category, name } = parseName(file);
  const source = join(sourceDir, file);
  const outName = `${slug(name)}.png`;
  const outPath = join(outDir, outName);

  const { width, height } = await probe(source);

  // Crop the frame off first, then measure — so the frame cannot influence the
  // bounding box, and a logo running right up to it is still measured whole.
  const cropped = {
    width: width - FRAME_INSET * 2,
    height: height - FRAME_INSET * 2,
  };
  const framePixels = await decode(source, width, height);
  const inner = Buffer.allocUnsafe(cropped.width * cropped.height * 4);
  for (let y = 0; y < cropped.height; y++) {
    framePixels.copy(
      inner,
      y * cropped.width * 4,
      ((y + FRAME_INSET) * width + FRAME_INSET) * 4,
      ((y + FRAME_INSET) * width + FRAME_INSET + cropped.width) * 4
    );
  }

  const box = contentBox(inner, cropped.width, cropped.height);

  const scale = Math.min(1, MAX_EDGE / Math.max(box.width, box.height));
  const out = {
    width: Math.round(box.width * scale),
    height: Math.round(box.height * scale),
  };

  await run("ffmpeg", [
    "-v", "error",
    "-i", source,
    "-vf",
    [
      `crop=${box.width}:${box.height}:${FRAME_INSET + box.x}:${FRAME_INSET + box.y}`,
      `scale=${out.width}:${out.height}:flags=lanczos`,
    ].join(","),
    "-map_metadata", "-1",
    outPath,
    "-y",
  ]);

  const { size } = await stat(outPath);

  manifest.push({
    src: `images/partners/${outName}`,
    slug: slug(name),
    category,
    width: out.width,
    height: out.height,
    bytes: size,
  });

  console.log(
    `${file.padEnd(34)} -> ${outName.padEnd(28)} ${`${out.width}x${out.height}`.padEnd(10)} ${(size / 1024).toFixed(0)}KB`
  );
}

manifest.sort(
  (a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug)
);

await writeFile(
  join(outDir, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);

const total = manifest.reduce((sum, m) => sum + m.bytes, 0);
const counts = manifest.reduce(
  (acc, m) => ({ ...acc, [m.category]: (acc[m.category] ?? 0) + 1 }),
  {}
);
console.log(
  `\n${manifest.length} logos, ${(total / 1024).toFixed(0)}KB total`,
  counts
);
