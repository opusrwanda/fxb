/**
 * Prepare supplied photography for the CDN.
 *
 * The originals are 24MP camera files averaging 7MB. They are never served as
 * they arrive: each is capped at 2400px on the long edge, re-encoded, and
 * stripped of metadata (camera serials and GPS coordinates have no business on
 * a public NGO site, least of all one photographing vulnerable households).
 *
 * 2400px is deliberate: the content measure is 1200px, so this still covers a
 * full-bleed image on a 2× display. next/image resizes down from here per
 * breakpoint and converts to AVIF/WebP.
 *
 *   node scripts/prepare-photos.mjs <sourceDir> <outDir>
 */
import { execFile } from "node:child_process";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const [sourceDir, outDir] = process.argv.slice(2);
if (!sourceDir || !outDir) {
  console.error("Usage: node scripts/prepare-photos.mjs <sourceDir> <outDir>");
  process.exit(1);
}

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** "FXBVillag TLF (10).jpg" -> { group: "fxbvillage-tlf", index: 10 } */
function parseName(file) {
  const name = basename(file, extname(file));
  const match = name.match(/^(.*?)\s*\((\d+)\)\s*$/);
  const rawGroup = (match ? match[1] : name).trim();
  return {
    // The supplied folder spells it "FXBVillag"; normalise the typo.
    group: slug(rawGroup).replace(/^fxbvillag-/, "fxbvillage-"),
    index: match ? Number(match[2]) : 1,
  };
}

await mkdir(outDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((f) => /\.jpe?g$/i.test(f));
const parsed = files
  .map((file) => ({ file, ...parseName(file) }))
  .sort((a, b) => a.group.localeCompare(b.group) || a.index - b.index);

const manifest = [];

for (const { file, group, index } of parsed) {
  const outName = `${group}-${String(index).padStart(2, "0")}.jpg`;
  const outPath = join(outDir, outName);

  await run("ffmpeg", [
    "-v", "error",
    "-i", join(sourceDir, file),
    "-vf", "scale='min(2400,iw)':'min(2400,ih)':force_original_aspect_ratio=decrease:flags=lanczos",
    "-map_metadata", "-1",
    "-q:v", "4",
    outPath,
    "-y",
  ]);

  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v",
    "-show_entries", "stream=width,height",
    "-of", "csv=p=0:s=x",
    outPath,
  ]);
  const [width, height] = stdout.trim().split("x").map(Number);
  const { size } = await stat(outPath);

  manifest.push({
    src: `images/${group}/${outName}`,
    group,
    width,
    height,
    orientation: width >= height ? "landscape" : "portrait",
    bytes: size,
  });

  console.log(
    `${file}  ->  ${outName}  ${width}x${height}  ${(size / 1024).toFixed(0)}KB`
  );
}

await writeFile(
  join(outDir, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);

const total = manifest.reduce((sum, m) => sum + m.bytes, 0);
console.log(
  `\n${manifest.length} images, ${(total / 1024 / 1024).toFixed(1)} MB total`
);
