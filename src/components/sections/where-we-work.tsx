"use client";

import Link from "next/link";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import {
  districts,
  districtsAttribution,
  districtsViewBox,
} from "@/lib/districts";
import type { Programme } from "@/cms/content/programmes";

/**
 * Where We Work — the district map.
 *
 * The brief asks for a map you can "hover over and visualize which project we
 * are implementing in that district", with the ability to drop a district once
 * a project ends there. Both come from the same place: `projects.ts` is the only
 * input, the map is derived from it, and ending a project is a data edit rather
 * than a design change.
 *
 * Geometry is the National Institute of Statistics of Rwanda's official
 * boundaries — see `scripts/prepare-districts.mjs`. The CC BY 4.0 licence
 * requires the attribution rendered beneath the map.
 *
 * Two things were wrong with the first build of this section, and both are
 * about information rather than decoration:
 *
 *   The panel was empty until you touched something. A quarter of the section
 *   was a box that said "hover a district" — prime space spent on an
 *   instruction, on a section whose whole job is to answer "where do you work".
 *   The readout now answers that before anyone moves the pointer.
 *
 *   It only worked one way. You could ask a district what runs there and never
 *   ask a project where it runs, which is the more common question and the one
 *   the six project names invite. Both directions now light the same map.
 *
 * The map is not the only way to read this. Every project spells out its own
 * districts, so the same information survives without a pointer, without sight,
 * and without a map at all — including Nyarugenge, which sits eight units from
 * Kamonyi, loses the label collision on the map every time, and is therefore
 * named nowhere else. The readout is announced politely, so tabbing the map is
 * as informative as hovering it.
 */

/**
 * Label metrics, in SVG user units.
 *
 * Poppins Semibold averages a little over half its point size per character
 * across mixed-case Latin text; 0.58 is that average with enough headroom for
 * a name like "Rwamagana" that runs wide. It only has to be good enough to
 * decide whether two labels would touch.
 */
/**
 * Rwanda's outline, as one path.
 *
 * Every district `d` concatenated into a single multi-subpath path. Filled, the
 * subpaths union into the country silhouette; the internal boundaries only
 * exist as edges between them, and an edge two shapes share is not an outline.
 *
 * Getting a stroke onto only the outside of that union is the trick. Stroking
 * this path plainly would draw every district boundary too, because each
 * subpath is stroked in turn. `paint-order: stroke` paints the stroke first and
 * the fill over it, so the opaque silhouette covers every internal segment and
 * the inner half of the outer one — what is left is the outer half, all the way
 * round the country and nowhere else. The stroke is doubled to account for
 * losing that half.
 */
const countryOutline = districts.map((district) => district.d).join(" ");

/**
 * The viewBox, opened up by a few units on every side.
 *
 * Rwanda touches all four edges of its own bounding box, and an SVG clips to
 * its viewBox — so the border drawn round the country was being sliced off flat
 * at the top, the left and the right. The stroke is `non-scaling`, which makes
 * it worse to reason about: it is 2px on screen whatever the map is scaled to,
 * so the room it needs in user units changes with the size of the map. Eight
 * units is comfortably more than it can ever want at the sizes this renders at.
 */
const PADDING = 8;
const paddedViewBox = (() => {
  const [x, y, width, height] = districtsViewBox.split(/\s+/).map(Number);
  return [
    x - PADDING,
    y - PADDING,
    width + PADDING * 2,
    height + PADDING * 2,
  ].join(" ");
})();

const LABEL_SIZE = 20;
const LABEL_ADVANCE = 0.58 * LABEL_SIZE;
/** Breathing room between two labels before they count as colliding. */
const LABEL_GUTTER = 8;

/**
 * District name -> the programmes running there.
 *
 * Derived rather than stored, so the map and the programme list can never
 * disagree. Districts with no programme simply have no entry.
 *
 * It lives here rather than beside the query it indexes because this is the
 * only thing that needs it, and this is a client component: importing a value
 * from the content layer would pull Payload — and with it `node:fs` — into the
 * browser bundle. The type comes across, because types are erased.
 */
function programmesByDistrict(
  programmes: readonly Programme[],
): Map<string, Programme[]> {
  const index = new Map<string, Programme[]>();

  for (const programme of programmes) {
    for (const district of programme.districts) {
      const existing = index.get(district);
      if (existing) existing.push(programme);
      else index.set(district, [programme]);
    }
  }

  return index;
}

type Box = { x0: number; x1: number; y0: number; y1: number };

function labelBox(name: string, cx: number, cy: number): Box {
  const halfWidth = (name.length * LABEL_ADVANCE + LABEL_GUTTER) / 2;
  const halfHeight = (LABEL_SIZE + LABEL_GUTTER) / 2;
  return {
    x0: cx - halfWidth,
    x1: cx + halfWidth,
    y0: cy - halfHeight,
    y1: cy + halfHeight,
  };
}

const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/**
 * A project name that goes somewhere.
 *
 * Two of the six have a destination in `projects.ts` — the FXBVillage model
 * section on What We Do, and Sugira Muryango's own dashboard — and neither was
 * reachable from this section. The arrow only appears where there is genuinely
 * something on the other end, so it stays a signal rather than a decoration
 * every row wears.
 */
function ProjectLink({
  href,
  external,
  shown,
  children,
  ...handlers
}: {
  href: string;
  external?: boolean;
  shown: boolean;
  children: React.ReactNode;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const className = `group/link inline-flex items-center gap-1.5 text-base leading-snug font-semibold transition-colors duration-300 ${
    shown ? "text-blue" : "text-gray-80"
  }`;

  const label = (
    <>
      {children}
      <ArrowUpRight
        className="size-4 shrink-0 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
        aria-hidden="true"
      />
    </>
  );

  // An external dashboard is a different promise from an in-site anchor, so it
  // opens in its own tab and says so to a screen reader.
  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={className}
      {...handlers}
    >
      {label}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <Link href={href} className={className} {...handlers}>
      {label}
    </Link>
  );
}

export function WhereWeWork({
  programmes,
  completed = [],
}: {
  programmes: Programme[];
  /** Phased-out projects. They colour their districts and nothing else. */
  completed?: Programme[];
}) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);
  /** The project row under the pointer, which previews its districts. */
  const [preview, setPreview] = useState<string | null>(null);

  const visible = useMemo(
    () => programmes.filter((project) => !hidden.has(project.slug)),
    [hidden, programmes]
  );

  const byDistrict = useMemo(() => programmesByDistrict(visible), [visible]);

  /**
   * Where work has finished.
   *
   * Kept apart from `byDistrict` rather than merged into it, because a district
   * with a running project and a district with a closed one are not the same
   * answer to "where do you work" — and merging them would let a finished
   * project turn a district green.
   */
  const finishedByDistrict = useMemo(
    () => programmesByDistrict(completed),
    [completed]
  );

  function toggle(id: string) {
    setHidden((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /**
   * Only the thing that is leaving clears the readout. Without the guard, a
   * pointer crossing from one district straight into its neighbour fires the
   * leave after the enter, and the panel blanks out mid-move.
   */
  const clearIf = <T,>(value: T) =>
    (current: T | null) => (current === value ? null : current);

  const activeDistrict = active
    ? districts.find((district) => district.name === active)
    : undefined;
  const activeProjectsHere = active ? (byDistrict.get(active) ?? []) : [];
  /** Finished work in the district being pointed at, if that is all there is. */
  const activeFinishedHere =
    active && activeProjectsHere.length === 0
      ? (finishedByDistrict.get(active) ?? [])
      : [];
  const previewProject = preview
    ? visible.find((project) => project.slug === preview)
    : undefined;

  /**
   * The districts painted solid right now — either the one being pointed at, or
   * every district of the project being pointed at. One set drives the map, so
   * the two directions cannot disagree about what "highlighted" means.
   */
  const highlighted = useMemo(() => {
    if (previewProject) return new Set(previewProject.districts);
    return new Set(active ? [active] : []);
  }, [previewProject, active]);

  /**
   * Which districts get a name printed on the map.
   *
   * Rwanda's districts are small and unevenly sized, and several of the ones we
   * work in sit shoulder to shoulder, so their names would sit on top of each
   * other. Highlighted first, then largest first, keeping a label only where it
   * clears everything already placed — so pointing at a district always names
   * it, and pointing at a project names as many of its districts as will fit.
   * Whatever is dropped is still on the path's accessible name, in the readout,
   * and spelled out under each project in the panel.
   */
  const labelled = useMemo(() => {
    const placed: Box[] = [];
    const keep = new Set<string>();

    const worked = districts.filter((district) => byDistrict.has(district.name));
    const byArea = (a: (typeof districts)[number], b: typeof a) =>
      b.area - a.area;

    const ordered = [
      ...worked.filter((d) => highlighted.has(d.name)).sort(byArea),
      ...worked.filter((d) => !highlighted.has(d.name)).sort(byArea),
    ];

    for (const district of ordered) {
      const box = labelBox(district.name, district.cx, district.cy);
      if (placed.some((other) => overlaps(box, other))) continue;
      placed.push(box);
      keep.add(district.name);
    }

    return keep;
  }, [byDistrict, highlighted]);

  return (
    <section id="where-we-work" className="scroll-mt-32 bg-gray-06 py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
              <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                WHERE WE WORK
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
              {byDistrict.size} districts, {visible.length}{" "}
              {visible.length === 1 ? "project" : "projects"}
            </h2>
          </div>
          <p className="max-w-[46ch] text-base leading-relaxed text-gray lg:text-[17px]">
            Across all four provinces and the City of Kigali. Point at a district
            to see what runs there, or at a project to see where it runs.
          </p>
        </Reveal>

        {/* `items-start`, so the map column is only as tall as the map. A grid
            item stretches to the row by default, and a sticky element the full
            height of its own track has nowhere to travel — it would sit there
            looking static while the list moved beside it. */}
        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
          {/* The map holds its place while the projects scroll past it.
              A district turns green on the left as its project is pointed at on
              the right, and the two are useless to each other if the map has
              already left the screen — which it does as soon as the list grows
              past a handful of projects.

              88px clears the pinned header with room to breathe. Desktop only:
              on a phone the two are stacked, so there is no beside for it to
              stay beside. */}
          <Reveal
            delay={140}
            className="flex flex-col gap-4 lg:sticky lg:top-[88px]"
          >
            <svg
              viewBox={paddedViewBox}
              className="w-full"
              role="group"
              aria-label="Map of Rwanda's districts, showing where FXB Rwanda works"
            >
              {/* The country first, so everything else sits inside it. */}
              <path
                d={countryOutline}
                className="fill-white stroke-blue"
                strokeWidth={9}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ paintOrder: "stroke" }}
                aria-hidden="true"
              />
              {/* And again in white, to plug the seams.
                  The boundaries are simplified geometry, so a few neighbours
                  fail to meet by a fraction of a unit. Those slivers are holes
                  in the union, and the edge of a hole gets stroked like any
                  other edge — which drew a dark seam down the middle of the
                  country. A 2px white stroke on the same path closes them, and
                  costs the outer border a pixel of its inner half, which was
                  going to be covered by the districts anyway. */}
              <path
                d={countryOutline}
                className="fill-white stroke-white"
                strokeWidth={5}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                aria-hidden="true"
              />

              {districts.map((district) => {
                const here = byDistrict.get(district.name);
                const finished = finishedByDistrict.get(district.name);

                if (!here && !finished) {
                  return (
                    <path
                      key={district.name}
                      d={district.d}
                      className="fill-white stroke-gray-15"
                      strokeWidth={1}
                      // The stroke is a screen width, not a map width. The
                      // viewBox is 1000 units wide inside roughly 700px, so
                      // every border was being scaled to about two thirds of
                      // what it asked for — 1.5 came out under a pixel and the
                      // country read as one pale shape.
                      vectorEffect="non-scaling-stroke"
                      // Not a target: nothing has ever run here, so there is
                      // nothing to announce and nothing to select.
                      aria-hidden="true"
                    />
                  );
                }

                // Grey is for a district we have left: work happened, and it
                // has finished. It is deliberately quiet — the section answers
                // "where do you work", present tense, and a closed project
                // should not read as loudly as a running one.
                const closed = !here;
                const projectsHere = here ?? finished ?? [];

                return (
                  <path
                    key={district.name}
                    d={district.d}
                    tabIndex={0}
                    role="button"
                    aria-label={`${district.name}, ${district.province} — ${projectsHere
                      .map((project) => project.name)
                      .join(", ")}${closed ? " (completed)" : ""}`}
                    onMouseEnter={() => setActive(district.name)}
                    onMouseLeave={() => setActive(clearIf(district.name))}
                    onFocus={() => setActive(district.name)}
                    onBlur={() => setActive(clearIf(district.name))}
                    // A phone has no hover, so a tap has to do the selecting.
                    // It sets rather than toggles: a touch also fires an
                    // emulated mouseenter first, and a toggle here would undo
                    // that enter and leave the first tap looking dead.
                    onClick={() => setActive(district.name)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      // Space would otherwise scroll the page out from under
                      // the district the reader just chose.
                      event.preventDefault();
                      setActive(district.name);
                    }}
                    // Green where we are working, grey where we have finished,
                    // blue only under the pointer. Blue was the resting colour
                    // and the highlight both, a tint apart, which asked the
                    // reader to tell two shades of one hue apart to know which
                    // district they were on.
                    className={`cursor-pointer outline-offset-2 transition-colors duration-300 ${
                      highlighted.has(district.name)
                        ? "fill-blue stroke-blue"
                        : closed
                          ? "fill-gray-15 stroke-gray-40"
                          : "fill-green-16 stroke-green"
                    }`}
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}

              {/* Labels last, so no neighbouring shape paints over them. They
                  are decorative here: the name is already in each path's
                  accessible name, in the readout, and under each project. */}
              {districts.map((district) => {
                if (!labelled.has(district.name)) return null;
                const isHot = highlighted.has(district.name);

                return (
                  <text
                    key={district.name}
                    x={district.cx}
                    y={district.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    aria-hidden="true"
                    className={`pointer-events-none font-semibold ${
                      isHot ? "fill-white" : "fill-blue"
                    }`}
                    // A casing in the opposite colour, so a name stays readable
                    // where it crosses a border into a neighbouring district.
                    // paint-order puts the stroke behind the fill.
                    style={{
                      fontSize: LABEL_SIZE,
                      paintOrder: "stroke",
                      stroke: isHot ? "#0472c2" : "#ffffff",
                      strokeWidth: 4,
                    }}
                  >
                    {district.name}
                  </text>
                );
              })}
            </svg>

            {/* Three colours are three statements, and a map that does not say
                which is which is a map the reader has to guess at. */}
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-80">
              <li className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full border border-green bg-green-16"
                  aria-hidden="true"
                />
                Working here now
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full border border-gray-40 bg-gray-15"
                  aria-hidden="true"
                />
                Project completed
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full border border-blue bg-blue"
                  aria-hidden="true"
                />
                Selected
              </li>
            </ul>

            <p className="text-xs leading-relaxed text-gray-80">
              {districtsAttribution}
            </p>
          </Reveal>

          <Reveal delay={290} className="flex flex-col gap-8">
            {/* The readout. Announced politely so tabbing is as informative as
                pointing. It answers whichever question was asked last — what
                runs in this district, or where does this project run. */}
            <div
              role="status"
              aria-live="polite"
              className="wedge min-h-36 bg-blue-08 p-7"
            >
              {previewProject ? (
                <>
                  <h3 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                    {previewProject.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-80">
                    Running in {previewProject.districts.length}{" "}
                    {previewProject.districts.length === 1
                      ? "district"
                      : "districts"}
                  </p>
                  <p className="mt-4 text-base leading-relaxed font-medium text-blue">
                    {previewProject.districts.join(" · ")}
                  </p>
                </>
              ) : activeDistrict ? (
                <>
                  <h3 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                    {activeDistrict.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-80">
                    {activeDistrict.province}
                    {activeDistrict.province === "City of Kigali"
                      ? ""
                      : " Province"}
                  </p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {activeProjectsHere.map((project) => (
                      <li
                        key={project.slug}
                        className="text-base font-medium text-blue"
                      >
                        {project.name}
                      </li>
                    ))}
                    {/* Named, and named as finished. A district we have left
                        with the project unnamed would read as a district we
                        have nothing to say about. */}
                    {activeFinishedHere.map((project) => (
                      <li key={project.slug} className="text-base text-gray">
                        {project.name}
                        <span className="ml-2 text-sm text-gray-80">
                          Completed
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                // Not an instruction. The section is asked "where do you work",
                // and this is the shortest true answer to it.
                <>
                  <h3 className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                    Every province, and Kigali
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-gray">
                    Point at any district on the map, or any project below, and
                    this panel will tell you the rest.
                  </p>
                </>
              )}
            </div>

            {/* The project list.

                It was six checkboxes with a bare numeral hanging off the right
                of each — a settings form standing in for the section's main
                navigation, and a "4" with nothing to say what it counted. Three
                things are true of a project here and all three are now visible:
                what it is called, how many districts and which, and whether
                there is more of it to read. The `href` in `projects.ts` had
                never been surfaced anywhere on this page. */}
            <fieldset onMouseLeave={() => setPreview(null)} className="min-w-0">
              <legend className="text-xs font-semibold tracking-[0.14em] text-gray-80">
                OUR PROJECTS
              </legend>

              <ul className="mt-5 flex flex-col">
                {programmes.map((project) => {
                  const shown = !hidden.has(project.slug);
                  const previewing = preview === project.slug;
                  const external = project.href?.startsWith("http");

                  return (
                    <li key={project.slug} className="border-b border-gray-15">
                      <div
                        // A tap fires an emulated mouseenter, so touch gets the
                        // preview from the same handler the pointer uses.
                        onMouseEnter={() => shown && setPreview(project.slug)}
                        className={`flex items-start gap-3 border-l-2 py-4 pr-1 pl-4 transition-colors duration-300 ${
                          // The accent is the row saying which districts on the
                          // map are currently its own — the same job the solid
                          // fill is doing up there, at the other end of the
                          // gesture.
                          previewing
                            ? "border-blue bg-blue-08"
                            : "border-transparent"
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            {project.href ? (
                              <ProjectLink
                                href={project.href}
                                external={external}
                                shown={shown}
                                onFocus={() => shown && setPreview(project.slug)}
                                onBlur={() => setPreview(clearIf(project.slug))}
                              >
                                {project.name}
                              </ProjectLink>
                            ) : (
                              <span
                                className={`text-base leading-snug font-semibold transition-colors duration-300 ${
                                  shown ? "text-blue" : "text-gray-80"
                                }`}
                              >
                                {project.name}
                              </span>
                            )}

                            {/* The count, with its unit. A numeral on its own
                                at the end of a row could have been districts,
                                years, beneficiaries or a rank. */}
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors duration-300 ${
                                shown
                                  ? "bg-blue-08 text-blue"
                                  : "bg-gray-15 text-gray-80"
                              }`}
                            >
                              {project.districts.length}{" "}
                              {project.districts.length === 1
                                ? "district"
                                : "districts"}
                            </span>
                          </div>

                          {/* Middot rather than commas, so each district reads
                              as one of a set rather than as a sentence. */}
                          <p
                            className={`text-sm leading-snug transition-colors duration-300 ${
                              shown ? "text-gray" : "text-gray-80"
                            }`}
                          >
                            {project.districts.join(" · ")}
                          </p>
                        </div>

                        {/* An eye, not a tick box. The state being toggled is
                            "on the map or not", which is what an eye means and
                            is not what a checkbox means — and the two icon
                            colours are both text-safe tokens, where a switch
                            track would have needed a grey too faint to clear
                            3:1 against white. */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={shown}
                          aria-label={`Show ${project.name} on the map`}
                          onClick={() => {
                            toggle(project.slug);
                            setPreview(null);
                          }}
                          onFocus={() => shown && setPreview(project.slug)}
                          onBlur={() => setPreview(clearIf(project.slug))}
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 hover:bg-blue-16 ${
                            shown ? "text-blue" : "text-gray-80"
                          }`}
                        >
                          {shown ? (
                            <Eye className="size-[18px]" aria-hidden="true" />
                          ) : (
                            <EyeOff className="size-[18px]" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </Reveal>
        </div>

      </Container>
    </section>
  );
}
