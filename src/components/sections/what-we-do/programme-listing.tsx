import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import type { Programme, ProgrammeGroup } from "@/cms/content/programmes";

/**
 * The programmes, as a grid of cards.
 *
 * This used to be a section headed "OUR PROGRAMMES" on `/what-we-do`, sitting
 * a few thousand pixels below the FXBVillage model — and the site also had a
 * Current Projects page listing the same six programmes again, from the same
 * table, in a different shape. Two listings of one thing, and the one on the
 * page called Current Projects was the poorer of the two: a row of name,
 * photograph and district chips where only the name was a link, and only on
 * the two programmes that happened to carry an external URL.
 *
 * So there is one listing now and Current Projects is where it lives, which is
 * what the menu said all along. `/what-we-do` is the model; this is the work.
 *
 * The whole card is the link, photograph included — a reader aiming at the
 * picture is aiming at the programme.
 */
export function ProgrammeListing({ groups }: { groups: ProgrammeGroup[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {groups.map((group, index) => (
        <Reveal
          as="li"
          key={group.slug}
          delay={Math.min(index, 3) * 60}
          // A programme with projects under it takes the full row, because the
          // blocks have to sit beside it rather than under the grid.
          className={
            group.children.length > 0 ? "sm:col-span-2 lg:col-span-3" : ""
          }
        >
          {group.children.length > 0 ? (
            <Group group={group} />
          ) : (
            <Card project={group} />
          )}
        </Reveal>
      ))}
    </ul>
  );
}

/**
 * A programme that is delivered as several projects.
 *
 * FXBVillage is the one this exists for. It is a model rather than a project,
 * and the projects under it — Mageragere in Nyarugenge, the one with The Light
 * Foundation, whichever starts next — each have their own districts, funder and
 * period. A flat grid could name the model or the projects; it could not say
 * that these belong to that.
 *
 * The parent keeps its own card and the children sit beside it under a rule, so
 * adding October's project is a row in `/staff` with "Part of: FXBVillage" set
 * and nothing here to change.
 */
function Group({ group }: { group: ProgrammeGroup }) {
  return (
    <div className="wedge border border-gray-15 p-6 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="lg:w-72 lg:shrink-0">
          <Card project={group} />
        </div>

        <div className="flex-1 lg:border-l lg:border-gray-15 lg:pl-10">
          <p className="text-xs font-semibold tracking-[0.14em] text-gray-80">
            {group.children.length} PROJECT
            {group.children.length === 1 ? "" : "S"} UNDER THIS MODEL
          </p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {group.children.map((child) => (
              <li key={child.slug}>
                <Link
                  href={`/what-we-do/programmes/${child.slug}`}
                  className="group flex h-full flex-col gap-2 border-t border-gray-15 pt-4 transition-colors duration-500 hover:border-blue"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-lg leading-snug font-semibold tracking-[-0.02em] text-blue">
                      {child.name}
                    </span>
                    <ArrowUpRight
                      className="mt-1 size-4 shrink-0 text-gray-80 transition-colors duration-500 group-hover:text-blue"
                      aria-hidden="true"
                    />
                  </span>
                  {child.districts.length > 0 && (
                    <span className="text-[15px] leading-snug text-gray">
                      {child.districts.join(" · ")}
                    </span>
                  )}
                  {child.runs && (
                    <span className="text-sm text-gray-80">{child.runs}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Card({ project }: { project: Programme }) {
  return (
    <Link
      href={`/what-we-do/programmes/${project.slug}`}
      className="wedge group flex h-full flex-col overflow-hidden border border-gray-15 transition-colors duration-500 hover:border-blue"
    >
      {project.image && (
        <div className="relative aspect-16/10 overflow-hidden bg-blue-08">
          <Image
            src={project.image.url}
            alt={project.image.alt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="motion-transform object-cover transition-transform duration-700 ease-(--ease-standard) group-hover:scale-[1.04]"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-2xl leading-snug font-semibold tracking-[-0.02em] text-blue">
            {project.name}
          </h3>

          <span className="wedge-nudge motion-transform mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-08 transition-colors duration-500 group-hover:bg-blue">
            <ArrowUpRight
              className="size-4 text-blue transition-colors duration-500 group-hover:text-white"
              aria-hidden="true"
            />
          </span>
        </div>

        {/* The programme's own one-liner, where it has one. A card
                      with a name and a district count tells a reader where it
                      happens and nothing about what it is. */}
        {project.summary && (
          <p className="text-[15px] leading-relaxed text-gray">
            {project.summary}
          </p>
        )}

        {/* Middots rather than commas, so the districts read as a
                      set rather than as a sentence — the same treatment they
                      get on the Who We Are map. */}
        <p className="mt-auto pt-1 text-[15px] leading-snug text-gray-80">
          <span className="font-semibold text-gray-80">
            {project.districts.length}{" "}
            {project.districts.length === 1 ? "district" : "districts"}
          </span>
          <span aria-hidden="true"> · </span>
          {project.districts.join(" · ")}
        </p>
      </div>
    </Link>
  );
}
