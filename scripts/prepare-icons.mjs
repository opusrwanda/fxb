/**
 * Extract the brand icon set from the Brand Guiding Tool.
 *
 * The guide draws every icon four times — blue, green, gray, white — one
 * column per sanctioned colour, on pages 9 (Areas of Intervention) and 10
 * (FXBVillage Pillars). Shipping four rasters of each would be four files to
 * keep in step and still no way to put an icon on a photograph.
 *
 * So only the blue column is read, and what is written out is an **alpha mask**
 * rather than a picture: the strokes are opaque, everything else transparent,
 * and no colour survives the process. The component paints it with a
 * background, which means one file per icon serves all four colourways and
 * anything else the palette later sanctions. That is what the guide's four
 * columns are actually saying — the same drawing, in whichever brand colour the
 * ground calls for.
 *
 * Bounds are found by colour, not by coordinates. An earlier pass measured the
 * grid by eye and the row labels sit close enough to the icons that the bands
 * overlapped — "Health" is further left than the health icon's own left edge.
 * Scanning for pixels near #0472c2 isolates the artwork exactly, because the
 * labels are grey and the page ground is a pale blue-grey: nothing else on the
 * page is that colour. Rows then fall out of the gaps in the vertical
 * histogram, so the script does not care where the grid happens to sit.
 *
 * The mask comes from blue-minus-red, not from any single channel. Brand blue
 * is #0472c2, so B-R is 190; the page ground is a pale blue-grey, so B-R is
 * about 8; and grey or black type has B-R of roughly nothing. Ramping on that
 * difference keeps the antialiased edge — no thresholding, so no stair-stepping
 * on the curves — while dropping the row labels, which a red-channel ramp
 * happily baked into the first four masks because dark grey text is just as
 * dark as a dark blue stroke.
 *
 *   node scripts/prepare-icons.mjs <brandGuidePdfRenderDir>
 *
 * where the directory holds `brand-p9.png` and `brand-p10.png` rendered from
 * the PDF at 6x. See the note in the repo README on regenerating them.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/** Long edge of each written mask. Icons render at ~72px, so this covers 4x. */
const OUT_SIZE = 288;
/** Transparent breathing room inside the square, as a fraction of the box. */
const PAD = 0.06;

const OUT_DIR = "public/img/icons";
const MANIFEST = "src/lib/icons.json";

/** How close a pixel must be to #0472c2 to count as artwork. */
const BLUE = { r: 4, g: 114, b: 194 };
const TOLERANCE = 90;

/** Blue-minus-red of a full-strength brand-blue stroke. See the note above. */
const STROKE_BR = 190;

/**
 * The icons, in the order the guide lists them down each page.
 *
 * Two of the pillar icons are the same drawing as an area icon — the hand and
 * seedling, and the figure with a book — because the guide reuses them. They
 * are still written twice under both names: an icon set keyed by what the thing
 * is called is worth more than nine unique files, and the duplicates cost 3KB.
 */
const PAGES = [
  {
    file: "brand-p9.png",
    group: "areas",
    ids: [
      "socio-economic-strengthening",
      "ecd-education",
      "health",
      "herbal-medicine",
    ],
  },
  {
    file: "brand-p10.png",
    group: "pillars",
    ids: [
      "home-visits-and-coaching",
      "economic-empowerment",
      "nutrition-and-food-security",
      "education-and-access-to-information",
      "wash-and-health",
    ],
  },
];

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("usage: node scripts/prepare-icons.mjs <renderDir>");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });
const manifest = [];

for (const page of PAGES) {
  const input = sharp(join(sourceDir, page.file));
  const { width, height } = await input.metadata();

  // Stride from the file, not assumed. These renders carry an alpha channel, so
  // reading them three bytes to the pixel walks progressively out of phase and
  // every colour test after the first row is nonsense — which is exactly what
  // the first run of this script did.
  const { data, info } = await input
    .clone()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const stride = info.channels;

  /**
   * The page ground, taken as the most common blue-minus-red in the scanned
   * region rather than sampled from a single pixel.
   *
   * An earlier version read pixel (10,10), which is the white margin the render
   * paints around the page, not the guide's own pale blue-grey ground. The two
   * differ by about 8 — small, but it is the black point of the ramp, so every
   * ground pixel came out at roughly 4% alpha instead of nothing. That painted a
   * faint tinted square behind every icon, which reads exactly like a container
   * with no padding in it, because the artwork runs to the edge of the square.
   *
   * The ground is the overwhelming majority of pixels here, so the mode is it.
   */
  const histogram = new Int32Array(512);

  // Only the leftmost (blue) column. Half the page comfortably clears it and
  // excludes the green column, whose hue would otherwise also register.
  const limitX = Math.floor(width * 0.45);

  // Each column is headed by its own name and hex set in that very colour, so
  // "Blue #0472c2" is itself brand blue and scans as artwork. It cannot be
  // separated by gap size — it sits ~100px above the first icon, while the WASH
  // drawing has a ~250px gap between its tap and the hand beneath it, so any
  // threshold that splits the header also splits that icon in two. Position is
  // the only thing that actually distinguishes them, and both pages put the
  // headers in the same band.
  const startY = Math.floor(height * 0.14);

  /** Blue pixels per row, and the horizontal extent of each. */
  const rows = new Array(height).fill(0);
  const minX = new Array(height).fill(Infinity);
  const maxX = new Array(height).fill(-1);

  for (let y = startY; y < height; y++) {
    for (let x = 0; x < limitX; x++) {
      const i = (y * width + x) * stride;
      histogram[data[i + 2] - data[i] + 255]++;
      const dr = data[i] - BLUE.r;
      const dg = data[i + 1] - BLUE.g;
      const db = data[i + 2] - BLUE.b;
      if (Math.hypot(dr, dg, db) > TOLERANCE) continue;
      rows[y]++;
      if (x < minX[y]) minX[y] = x;
      if (x > maxX[y]) maxX[y] = x;
    }
  }

  let mode = 0;
  for (let v = 1; v < histogram.length; v++) {
    if (histogram[v] > histogram[mode]) mode = v;
  }
  // A couple of levels of headroom above the ground, so its own antialiasing
  // against the white margin does not survive either.
  const groundBR = mode - 255 + 3;

  // Contiguous runs of blue rows are the icons. A short gap inside a drawing —
  // the space between a tap and the hand under it — must not split it in two,
  // so runs closer together than this merge.
  const MIN_RUN = Math.floor(height * 0.004);
  const MAX_GAP = Math.floor(height * 0.02);

  const runs = [];
  let start = -1;
  let gap = 0;

  for (let y = startY; y < height; y++) {
    if (rows[y] > 0) {
      if (start === -1) start = y;
      gap = 0;
    } else if (start !== -1) {
      gap++;
      if (gap > MAX_GAP) {
        const end = y - gap;
        if (end - start >= MIN_RUN) runs.push([start, end]);
        start = -1;
        gap = 0;
      }
    }
  }
  if (start !== -1 && height - start >= MIN_RUN) runs.push([start, height - 1]);

  // The column header is set in the same blue as the artwork — "Blue" and
  // "#0472c2" are literally #0472c2 — so it registers as a run too. Rather than
  // excluding a hard-coded band at the top of the page, keep the N tallest runs
  // and put them back in page order: a line of type is a fraction of the height
  // of a drawing, so the header falls out on its own and the script stays
  // indifferent to where the grid sits.
  if (runs.length < page.ids.length) {
    console.error(
      `${page.file}: found ${runs.length} icons, expected ${page.ids.length}`
    );
    process.exit(1);
  }

  const icons = runs
    .slice()
    .sort((a, b) => b[1] - b[0] - (a[1] - a[0]))
    .slice(0, page.ids.length)
    .sort((a, b) => a[0] - b[0]);

  if (runs.length > page.ids.length) {
    console.log(
      `  ${page.file}: ${runs.length} runs, kept the ${page.ids.length} tallest`
    );
  }

  for (const [index, [y0, y1]] of icons.entries()) {
    let x0 = Infinity;
    let x1 = -1;
    for (let y = y0; y <= y1; y++) {
      if (minX[y] < x0) x0 = minX[y];
      if (maxX[y] > x1) x1 = maxX[y];
    }

    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;

    // Square the crop around the drawing's own centre, so a wide icon and a
    // tall one still hang on the same optical grid in the component.
    const side = Math.max(w, h);
    const cx = x0 + w / 2;
    const cy = y0 + h / 2;
    const left = Math.max(0, Math.round(cx - side / 2));
    const top = Math.max(0, Math.round(cy - side / 2));
    const size = Math.min(side, width - left, height - top);

    // Blue-minus-red -> alpha. sharp does the cropping and hands back a small
    // buffer to walk linearly; an earlier version indexed the full-page buffer
    // by hand and got the arithmetic subtly wrong, which came out as icons
    // squashed vertically and shot through with scanlines.
    const { data: cd, info: ci } = await sharp(join(sourceDir, page.file))
      .extract({ left, top, width: size, height: size })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const crop = Buffer.alloc(size * size);
    for (let p = 0, i = 0; p < size * size; p++, i += ci.channels) {
      const br = cd[i + 2] - cd[i];
      const t = (br - groundBR) / (STROKE_BR - groundBR);
      crop[p] = Math.max(0, Math.min(255, Math.round(t * 255)));
    }

    // The pad is rounded once and the inner size derived from it, rather than
    // both being rounded off OUT_SIZE independently — that way round(0.88 *
    // 288) + 2 * round(0.06 * 288) cannot come to 287 and hand sharp a buffer
    // one row short of the canvas it is filling.
    const pad = Math.round(OUT_SIZE * PAD);
    const inner = OUT_SIZE - pad * 2;
    const alpha = await sharp(crop, {
      raw: { width: size, height: size, channels: 1 },
    })
      .resize(inner, inner)
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: { r: 0, g: 0, b: 0 },
      })
      // `extend` with an r/g/b background promotes the single-channel image to
      // three. Declaring the result as one channel to `joinChannel` below then
      // makes it read RGB triplets as consecutive alpha pixels — which renders
      // as the drawing squashed to a third of its width and shot through with
      // scanlines. Forced back to greyscale, and asserted, because the failure
      // is silent: sharp accepts the buffer and writes a plausible-looking PNG.
      .toColourspace("b-w")
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (alpha.info.channels !== 1) {
      console.error(
        `alpha buffer has ${alpha.info.channels} channels, expected 1`
      );
      process.exit(1);
    }

    const id = page.ids[index];
    const name = `${id}.png`;

    // Black artwork, with the ramp above as its alpha. Only the alpha is ever
    // read — the component supplies the colour.
    const png = await sharp({
      create: {
        width: OUT_SIZE,
        height: OUT_SIZE,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .joinChannel(alpha.data, {
        raw: { width: OUT_SIZE, height: OUT_SIZE, channels: 1 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    await writeFile(join(OUT_DIR, name), png);
    manifest.push({ id, group: page.group, src: `/img/icons/${name}` });

    console.log(
      `${page.group.padEnd(7)} ${id.padEnd(36)} ${size}px source -> ${name}  ${(png.length / 1024).toFixed(1)}KB`
    );
  }
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\n${manifest.length} masks written to ${OUT_DIR}/ and ${MANIFEST}`);
