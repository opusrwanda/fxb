/**
 * Prepare the official UN Sustainable Development Goal tiles.
 *
 * FXB supplied the ten goals the FXBVillage model claims — 1, 2, 3, 4, 5, 6,
 * 8, 13, 16 and 17 — as PNGs pulled from various sources, so they arrive with
 * unrelated filenames and at three different resolutions (447, 1440 and 1536
 * square). Neither the names nor the sizes belong in the repository.
 *
 * Each file is:
 *
 *   1. Renamed by its goal number, which is the only stable identifier these
 *      tiles have. Source names like "images (2).png" are mapped explicitly
 *      below rather than parsed — a filename that says nothing about its
 *      contents cannot be parsed, only looked up, and getting a goal wrong here
 *      would put the UN's Zero Hunger mark under Climate Action.
 *   2. Capped at 512px square. The tiles render at ~150px, so 512 covers 3x on
 *      the densest screen anyone will read this on. Not enlarged: goal 4
 *      arrives at 447 and stays there rather than being upscaled to match.
 *   3. Re-encoded to WebP. All ten together come to a few tens of kilobytes.
 *
 * What is NOT done to them: nothing. The UN's guidelines for the SDG icons are
 * explicit that the tiles must not be recoloured, cropped, stretched, or have
 * their proportions altered — each goal's colour and layout are fixed parts of
 * the mark. Resizing proportionally and changing container format are not
 * modifications of the artwork; anything else here would be. That is also why
 * the component renders them square and never applies a filter, an overlay or
 * a brand tint, even though ten saturated colours are otherwise well outside
 * this site's four-value palette.
 *
 *   node scripts/prepare-sdg.mjs <sourceDir>
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/** Long edge in the output. See note 2 above. */
const MAX = 512;
const QUALITY = 90;

const OUT_DIR = "public/img/sdg";
const MANIFEST = "src/lib/sdg.json";

/**
 * Source filename -> goal number and official title.
 *
 * Titles are the UN's own wording. They are duplicated in `fxbvillage.ts`
 * today; this manifest is what the site will read once the tiles land, so the
 * two want reconciling rather than both being edited by hand.
 */
const GOALS = [
  { file: "Sustainable_Development_Goal_1.png", number: 1, title: "No Poverty" },
  { file: "Sustainable_Development_Goal_2.png", number: 2, title: "Zero Hunger" },
  { file: "images.png", number: 3, title: "Good Health and Well-being" },
  { file: "images (1).png", number: 4, title: "Quality Education" },
  { file: "E-Goal-05-1024x1024.png", number: 5, title: "Gender Equality" },
  { file: "Sustainable_Development_Goal_6.png", number: 6, title: "Clean Water and Sanitation" },
  { file: "Sustainable_Development_Goal_8.png", number: 8, title: "Decent Work and Economic Growth" },
  { file: "E_SDG-goals_icons-individual-rgb-13.png", number: 13, title: "Climate Action" },
  { file: "E_SDG-goals_icons-individual-rgb-16.png", number: 16, title: "Peace, Justice and Strong Institutions" },
  { file: "images (2).png", number: 17, title: "Partnerships for the Goals" },
];

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("usage: node scripts/prepare-sdg.mjs <sourceDir>");
  process.exit(1);
}

const present = new Set(await readdir(sourceDir));
const missing = GOALS.filter((goal) => !present.has(goal.file));
if (missing.length > 0) {
  console.error(
    `Missing source files:\n${missing.map((g) => `  SDG ${g.number}: ${g.file}`).join("\n")}`
  );
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const manifest = [];

for (const goal of GOALS) {
  const id = String(goal.number).padStart(2, "0");
  const name = `sdg-${id}.webp`;

  const { data, info } = await sharp(join(sourceDir, goal.file))
    // `withoutEnlargement` so a 447px source is not invented up to 512.
    .resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer({ resolveWithObject: true });

  await writeFile(join(OUT_DIR, name), data);

  manifest.push({
    number: goal.number,
    title: goal.title,
    src: `/img/sdg/${name}`,
    width: info.width,
    height: info.height,
  });

  console.log(
    `SDG ${String(goal.number).padStart(2)} -> ${name}  ${info.width}x${info.height}  ${(data.length / 1024).toFixed(1)}KB`
  );
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\n${manifest.length} tiles written to ${OUT_DIR}/ and ${MANIFEST}`);
