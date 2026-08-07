import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { getBoard } from "@/cms/content/people";
import { getSiteDetails } from "@/cms/content/settings";

/**
 * Leadership — the Board of Directors.
 *
 * The portraits are cut-outs on transparency, so each one sits on a tinted
 * ground rather than on the white of the page: without one behind them the
 * shoulders end in mid-air and the row reads as eight floating heads.
 *
 * That ground is a circle, because the portraits already are. FXB supplied them
 * masked to a circle inscribed in a square frame — `prepare-board.mjs` only
 * re-encodes and keeps the alpha, it does not cut the shape. Sitting a circular
 * cut-out on a rounded square put two different silhouettes on top of each
 * other, and the portrait's own bottom arc, with tint either side of it, read
 * as a torso sliced off by the tile. One shape, and the ground now ends exactly
 * where the photograph does.
 *
 * Portraits carry an empty alt. The name is the next thing in the DOM, and a
 * screen reader announcing "Emmanuel KAYITANA" immediately before the heading
 * that says Emmanuel KAYITANA is noise, not information.
 */
export async function Leadership() {
  const [board, details] = await Promise.all([getBoard(), getSiteDetails()]);

  return (
    <section id="leadership" className="scroll-mt-32 bg-blue-08 py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
            <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
              LEADERSHIP
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
            Board of Directors
          </h2>
        </Reveal>

        {/* Two up even on the narrowest phone. Eight full-bleed squares
            stacked one per row turns a board of directors into a scroll. */}
        {board.length > 0 ? (
          <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {board.map((member, index) => (
              <Reveal
                as="li"
                key={member.name}
                delay={60 + Math.min(index, 3) * 60}
                // Portrait, name and role are three tracks of the list's own
                // grid rather than three blocks stacked inside a card, so the
                // roles line up across a row because the rows themselves line
                // up. `gap-y-0` because a subgrid inherits its parent's gutters
                // — without it the 48px between rows would also open up between
                // each portrait and its name.
                className="row-span-3 grid grid-rows-subgrid gap-y-0"
              >
                <div className="relative mb-5 aspect-square overflow-hidden rounded-full bg-blue-16">
                  {member.portrait && (
                    <Image
                      src={member.portrait.url}
                      alt=""
                      width={member.portrait.width}
                      height={member.portrait.height}
                      sizes="(min-width: 1024px) 23vw, 45vw"
                      className="size-full object-cover"
                    />
                  )}
                </div>
                {/* Ranged to the bottom of its track, which is what keeps a name
                    and its role together.

                    Exactly one name on this board runs to two lines — "Fr.
                    Pierre Celestin NGOBOKA (PhD)" — and it sets the height of
                    the name track for its whole row. Left ranged to the top, the
                    other three names sat against the portrait and left a blank
                    line between themselves and their role, so one long name put
                    a hole under three short ones.

                    Ranged to the bottom, the slack moves above the name instead,
                    where it reads as breathing room under a portrait rather than
                    as a gap in the middle of a caption. The three short names
                    land on the same baseline as NGOBOKA's second line, and every
                    role sits 4px under its own name.

                    This is also why the earlier `min-h-[2lh]` had to go: it
                    reserved the second line on every card in the section, so the
                    four advisors — all one-line names — each paid for a blank
                    line the row never needed. */}
                <h3 className="self-end text-center text-base leading-snug font-semibold tracking-[-0.02em] text-blue lg:text-lg">
                  {member.name}
                </h3>
                <p className="mt-1 text-center text-sm text-gray">
                  {member.role}
                </p>
              </Reveal>
            ))}
          </ul>
        ) : (
          <Reveal delay={80} className="mt-10 flex flex-col items-start gap-7">
            <p className="max-w-[58ch] text-lg leading-relaxed text-gray">
              FXB Rwanda is governed by a Board of Directors. Full profiles are
              being prepared for publication here.
            </p>
            <Pill href={`mailto:${details.email}`} variant="outline">
              Ask about our governance
            </Pill>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
