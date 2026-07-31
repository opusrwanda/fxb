/**
 * Prepare Rwanda's district boundaries for the Where We Work map.
 *
 * Boundaries are never hand-drawn. The source is the National Institute of
 * Statistics of Rwanda's official ADM2 dataset, redistributed by geoBoundaries
 * under CC BY 4.0 and pinned to a commit so a rebuild is reproducible:
 *
 *   Source:  Open Data Rwanda / NISR (geodata-nisr.opendata.arcgis.com)
 *   Via:     geoBoundaries gbOpen RWA ADM2
 *   Licence: CC BY 4.0 — attribution is rendered beneath the map.
 *
 * The upstream file is 6.3MB of full-resolution polygons, far more detail than
 * a 900px-wide map can show. This takes the pre-simplified release (289KB) and
 * simplifies again in screen space, where the tolerance means something: 1.5
 * SVG units on a 1000-unit-wide viewBox is roughly one pixel at render size,
 * which drops two thirds of the vertices without a visible change to any
 * border, and lands the payload at 28KB.
 *
 *   node scripts/prepare-districts.mjs [outFile]
 */
import { writeFile } from "node:fs/promises";

const COMMIT = "9469f09";
const SOURCE = `https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/${COMMIT}/releaseData/gbOpen/RWA/ADM2/geoBoundaries-RWA-ADM2_simplified.geojson`;

const outFile = process.argv[2] ?? "src/lib/districts.json";

/** Width of the generated viewBox. Height follows from Rwanda's aspect ratio. */
const VIEWBOX_WIDTH = 1000;
/** Simplification tolerance, in SVG units — about a pixel at render size. */
const TOLERANCE = 1.5;
/** Coordinate precision. Tenths of an SVG unit; more is noise in the payload. */
const PRECISION = 1;

/**
 * Rwanda's five provinces and the districts within them.
 *
 * ADM2 carries no parent reference, and fetching ADM1 only to point-in-polygon
 * 30 districts back into 5 provinces would be a lot of work to rediscover a
 * fixed administrative fact. This is the structure as established by the 2006
 * territorial reform: 30 districts, unchanged since.
 */
const provinces = {
  "City of Kigali": ["Nyarugenge", "Gasabo", "Kicukiro"],
  Southern: [
    "Nyanza",
    "Gisagara",
    "Nyaruguru",
    "Huye",
    "Nyamagabe",
    "Ruhango",
    "Muhanga",
    "Kamonyi",
  ],
  Western: [
    "Karongi",
    "Rutsiro",
    "Rubavu",
    "Nyabihu",
    "Ngororero",
    "Rusizi",
    "Nyamasheke",
  ],
  Northern: ["Rulindo", "Gakenke", "Musanze", "Burera", "Gicumbi"],
  Eastern: [
    "Rwamagana",
    "Nyagatare",
    "Gatsibo",
    "Kayonza",
    "Kirehe",
    "Ngoma",
    "Bugesera",
  ],
};

const provinceOf = new Map(
  Object.entries(provinces).flatMap(([province, districts]) =>
    districts.map((district) => [district, province])
  )
);

/**
 * Ramer–Douglas–Peucker, run in projected space.
 *
 * Simplifying in degrees would thin the north–south edges harder than the
 * east–west ones, because a degree of longitude is shorter than a degree of
 * latitude at this latitude. Projecting first makes the tolerance isotropic.
 */
function simplify(points, tolerance) {
  if (points.length < 3) return points;

  const [start] = points;
  const end = points[points.length - 1];

  let index = -1;
  let maxDistance = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance <= tolerance) return [start, end];

  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

function perpendicularDistance([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  // Degenerate segment — the ring closed on itself. Fall back to point distance.
  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);

  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)
  );
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Signed area and area centroid of a ring, by the shoelace formula.
 *
 * The area comes back alongside the centroid because the map uses it to rank
 * labels: where two district names would collide, the larger district keeps
 * its label, since it has the room to hold one.
 */
function measure(ring) {
  let twiceArea = 0;
  let x = 0;
  let y = 0;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const cross = xj * yi - xi * yj;
    twiceArea += cross;
    x += (xj + xi) * cross;
    y += (yj + yi) * cross;
  }

  // A zero-area ring has no meaningful centroid; the bounding-box middle is the
  // only sensible answer and never happens with real district geometry.
  if (twiceArea === 0) {
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    return {
      cx: (Math.min(...xs) + Math.max(...xs)) / 2,
      cy: (Math.min(...ys) + Math.max(...ys)) / 2,
      area: 0,
    };
  }

  return {
    cx: x / (3 * twiceArea),
    cy: y / (3 * twiceArea),
    // Winding order is whatever the source used; only magnitude matters here.
    area: Math.abs(twiceArea) / 2,
  };
}

const round = (n) => Number(n.toFixed(PRECISION));

const response = await fetch(SOURCE);
if (!response.ok) {
  console.error(`Could not fetch boundaries: ${response.status} ${SOURCE}`);
  process.exit(1);
}

const geojson = await response.json();
const features = geojson.features;

// Every ring, in lon/lat, so the projection can be fitted to the true extent.
const rings = features.map((feature) => {
  if (feature.geometry.type === "Polygon") return feature.geometry.coordinates;
  // MultiPolygon: flatten one level so each entry is still a list of rings.
  return feature.geometry.coordinates.flat();
});

const allPoints = rings.flat(2);
const lons = allPoints.map((p) => p[0]);
const lats = allPoints.map((p) => p[1]);
const [minLon, maxLon] = [Math.min(...lons), Math.max(...lons)];
const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];

/*
  Equidistant cylindrical, with longitude scaled by the cosine of the mid
  latitude. Over a country two degrees tall this is visually identical to
  Mercator, and unlike raw lon/lat it does not stretch Rwanda sideways: at
  1.9°S a degree of longitude covers ~99.95% of a degree of latitude on the
  ground, and dropping that correction is what makes naive maps look wrong.
*/
const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
const lonScale = Math.cos(midLat);

const spanX = (maxLon - minLon) * lonScale;
const spanY = maxLat - minLat;
const scale = VIEWBOX_WIDTH / spanX;
const viewBoxHeight = round(spanY * scale);

/** lon/lat -> SVG. y is flipped: latitude climbs north, SVG y climbs south. */
const project = ([lon, lat]) => [
  (lon - minLon) * lonScale * scale,
  (maxLat - lat) * scale,
];

const districts = [];
let rawPoints = 0;
let keptPoints = 0;

for (const [index, feature] of features.entries()) {
  const name = feature.properties.shapeName;
  const province = provinceOf.get(name);

  if (!province) {
    console.error(`Unknown district in source data: ${name}`);
    process.exit(1);
  }

  const projected = rings[index].map((ring) => ring.map(project));
  rawPoints += projected.reduce((sum, ring) => sum + ring.length, 0);

  const simplified = projected.map((ring) => {
    const reduced = simplify(ring, TOLERANCE);
    // Simplification can eat a ring down to a degenerate sliver; keep the
    // original rather than emit a path that renders as a line.
    return reduced.length >= 4 ? reduced : ring;
  });
  keptPoints += simplified.reduce((sum, ring) => sum + ring.length, 0);

  const d = simplified
    .map(
      (ring) =>
        `M${ring
          .map(([x, y]) => `${round(x)} ${round(y)}`)
          .join("L")}Z`
    )
    .join("");

  // The first ring is the outer boundary; holes never carry the label.
  const { cx, cy, area } = measure(simplified[0]);

  districts.push({
    name,
    province,
    d,
    cx: round(cx),
    cy: round(cy),
    area: Math.round(area),
  });
}

districts.sort((a, b) => a.name.localeCompare(b.name));

const payload = {
  viewBox: `0 0 ${VIEWBOX_WIDTH} ${viewBoxHeight}`,
  attribution:
    "District boundaries: National Institute of Statistics of Rwanda, via geoBoundaries (CC BY 4.0)",
  districts,
};

await writeFile(outFile, JSON.stringify(payload) + "\n");

const bytes = JSON.stringify(payload).length;
console.log(
  `${districts.length} districts  ${rawPoints} -> ${keptPoints} points  ` +
    `${(bytes / 1024).toFixed(0)}KB  -> ${outFile}`
);
