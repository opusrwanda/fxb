"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import {
  districts,
  districtsAttribution,
  districtsViewBox,
} from "@/lib/districts";
import { activeProjects, projectsByDistrict } from "@/lib/projects";

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
 * The map is not the only way to read this section. Every project lists its
 * districts in words in the panel beside it, so the same information survives
 * without a pointer, without sight, and without JavaScript. The map paths are
 * focusable in turn, and the readout is announced politely so tabbing through
 * them is as informative as hovering.
 *
 * A note on hit areas: the paths are the hit areas, so a small district like
 * Nyarugenge is a small target. That is why the panel is a list of projects
 * rather than a list of districts — the coarse control is always reachable.
 */

/**
 * Label metrics, in SVG user units.
 *
 * Poppins Semibold averages a little over half its point size per character
 * across mixed-case Latin text; 0.58 is that average with enough headroom for
 * a name like "Rwamagana" that runs wide. It only has to be good enough to
 * decide whether two labels would touch.
 */
const LABEL_SIZE = 20;
const LABEL_ADVANCE = 0.58 * LABEL_SIZE;
/** Breathing room between two labels before they count as colliding. */
const LABEL_GUTTER = 8;

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
export function WhereWeWork() {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);

  const visible = useMemo(
    () => activeProjects.filter((project) => !hidden.has(project.id)),
    [hidden]
  );

  const byDistrict = useMemo(() => projectsByDistrict(visible), [visible]);

  function toggle(id: string) {
    setHidden((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /**
   * Only the district that is leaving clears the readout. Without the guard, a
   * pointer crossing from one district straight into its neighbour fires the
   * leave after the enter, and the panel blanks out mid-move.
   */
  function clear(name: string) {
    setActive((current) => (current === name ? null : current));
  }

  const activeDistrict = active
    ? districts.find((district) => district.name === active)
    : undefined;
  const activeProjectsHere = active ? (byDistrict.get(active) ?? []) : [];

  /**
   * Which districts get a name printed on the map.
   *
   * Rwanda's districts are small and unevenly sized, and several of the ones we
   * work in sit shoulder to shoulder — Kamonyi and Nyarugenge are eight units
   * apart vertically, so their names would sit on top of each other. Largest
   * first, keep a label only where it clears everything already placed. The
   * dropped names are not lost: they are on every path's accessible name, in
   * the readout, and spelled out under each project in the panel.
   *
   * The active district always gets its label, and anything it would collide
   * with steps aside for it, so pointing at a small district still names it.
   */
  const labelled = useMemo(() => {
    const placed: Box[] = [];
    const keep = new Set<string>();

    const activeGeometry = activeDistrict && byDistrict.has(activeDistrict.name)
      ? activeDistrict
      : undefined;

    if (activeGeometry) {
      placed.push(
        labelBox(activeGeometry.name, activeGeometry.cx, activeGeometry.cy)
      );
      keep.add(activeGeometry.name);
    }

    const candidates = districts
      .filter((district) => byDistrict.has(district.name))
      .sort((a, b) => b.area - a.area);

    for (const district of candidates) {
      if (keep.has(district.name)) continue;

      const box = labelBox(district.name, district.cx, district.cy);
      if (placed.some((other) => overlaps(box, other))) continue;

      placed.push(box);
      keep.add(district.name);
    }

    return keep;
  }, [byDistrict, activeDistrict]);

  return (
    <section
      id="where-we-work"
      className="scroll-mt-32 bg-white py-24 lg:py-32"
    >
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                WHERE WE WORK
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[40px] lg:leading-[1.1]">
              {byDistrict.size} districts, {visible.length}{" "}
              {visible.length === 1 ? "project" : "projects"}
            </h2>
          </div>
          <p className="max-w-[46ch] text-base leading-relaxed text-gray lg:text-right lg:text-[17px]">
            Across all four provinces and the City of Kigali. Select a district
            to see what runs there, or filter by project.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
          <Reveal delay={80} className="flex flex-col gap-4">
            <svg
              viewBox={districtsViewBox}
              className="w-full"
              role="group"
              aria-label="Map of Rwanda's districts, showing where FXB Rwanda works"
            >
              {districts.map((district) => {
                const here = byDistrict.get(district.name);
                const isActive = district.name === active;

                if (!here) {
                  return (
                    <path
                      key={district.name}
                      d={district.d}
                      className="fill-white stroke-gray-15"
                      strokeWidth={1.5}
                      // Not a target: no project runs here, so there is nothing
                      // to announce and nothing to select.
                      aria-hidden="true"
                    />
                  );
                }

                return (
                  <path
                    key={district.name}
                    d={district.d}
                    tabIndex={0}
                    role="button"
                    aria-label={`${district.name}, ${district.province} — ${here
                      .map((project) => project.name)
                      .join(", ")}`}
                    onMouseEnter={() => setActive(district.name)}
                    onMouseLeave={() => clear(district.name)}
                    onFocus={() => setActive(district.name)}
                    onBlur={() => clear(district.name)}
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
                    className={`cursor-pointer outline-offset-2 transition-colors duration-200 ${
                      isActive ? "fill-blue stroke-blue" : "fill-blue-16 stroke-blue"
                    }`}
                    strokeWidth={1.5}
                  />
                );
              })}

              {/* Labels last, so no neighbouring shape paints over them. They
                  are decorative here: the name is already in each path's
                  accessible name and in the readout below. */}
              {districts.map((district) => {
                if (!labelled.has(district.name)) return null;
                const isActive = district.name === active;

                return (
                  <text
                    key={district.name}
                    x={district.cx}
                    y={district.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    aria-hidden="true"
                    className={`pointer-events-none font-semibold ${
                      isActive ? "fill-white" : "fill-blue"
                    }`}
                    // A casing in the opposite colour, so a name stays readable
                    // where it crosses a border into a neighbouring district.
                    // paint-order puts the stroke behind the fill.
                    style={{
                      fontSize: LABEL_SIZE,
                      paintOrder: "stroke",
                      stroke: isActive ? "#0472c2" : "#ffffff",
                      strokeWidth: 4,
                    }}
                  >
                    {district.name}
                  </text>
                );
              })}
            </svg>

            <p className="text-xs leading-relaxed text-gray-40">
              {districtsAttribution}
            </p>
          </Reveal>

          <Reveal delay={160} className="flex flex-col gap-8">
            {/* The readout. Announced politely so tabbing the map is as
                informative as pointing at it. */}
            <div
              role="status"
              aria-live="polite"
              className="wedge min-h-40 bg-blue-08 p-7"
            >
              {activeDistrict ? (
                <>
                  <h3 className="text-2xl font-bold tracking-[-0.02em] text-blue">
                    {activeDistrict.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-40">
                    {activeDistrict.province}
                    {activeDistrict.province === "City of Kigali"
                      ? ""
                      : " Province"}
                  </p>
                  <ul className="mt-5 flex flex-col gap-2">
                    {activeProjectsHere.map((project) => (
                      <li
                        key={project.id}
                        className="text-base font-medium text-blue"
                      >
                        {project.name}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-base leading-relaxed text-gray">
                  Hover or focus a highlighted district to see which projects
                  run there.
                </p>
              )}
            </div>

            <fieldset>
              <legend className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                OUR PROJECTS
              </legend>

              <ul className="mt-5 flex flex-col">
                {activeProjects.map((project) => {
                  const shown = !hidden.has(project.id);

                  return (
                    <li key={project.id} className="border-b border-gray-15">
                      <label className="flex cursor-pointer items-start gap-3.5 py-4">
                        <input
                          type="checkbox"
                          checked={shown}
                          onChange={() => toggle(project.id)}
                          className="mt-1 size-4 shrink-0 accent-blue"
                        />
                        <span className="flex flex-col gap-1">
                          <span
                            className={`text-base font-semibold transition-colors duration-200 ${
                              shown ? "text-blue" : "text-gray-40"
                            }`}
                          >
                            {project.name}
                          </span>
                          <span className="text-sm leading-snug text-gray">
                            {project.districts.join(", ")}
                          </span>
                        </span>
                      </label>
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
