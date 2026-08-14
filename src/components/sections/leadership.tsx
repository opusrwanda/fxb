import Image from "next/image";
import { Container } from "@/components/layout/container";
import { SectionBand } from "@/components/layout/section-band";
import { getSection } from "@/cms/content/sections";
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
  const copy = await getSection("who-we-are:leadership");
  const [board, details] = await Promise.all([getBoard(), getSiteDetails()]);

  return (
    <SectionBand section={copy} id="leadership" className="scroll-mt-32 bg-white py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
            <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
              {copy.eyebrow}
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
            {copy.heading}
          </h2>
        </Reveal>

        {/* Two across, with the name under the portrait.

            The name sat beside it for a while, on the reasoning that four up
            with centred captions is what every board page does. Two of those
            three things were the problem: at two across, a portrait with the
            name alongside can only be as tall as two lines of type, which held
            these to 144px on a page with a thousand pixels of room. Under the
            portrait, the picture gets the width of the column — 288px, twice
            what it was — and the caption still has somewhere to go.

            Centred, because the portrait is a circle. A circle with its
            caption ranged left has no edge for the text to line up against,
            so the words read as having slipped off it. */}
        {board.length > 0 ? (
          <ul className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:gap-x-16">
            {board.map((member, index) => (
              <Reveal
                as="li"
                key={member.name}
                delay={60 + Math.min(index, 3) * 60}
                className="group flex flex-col items-center text-center"
              >
                {/* No disc behind the portrait.

                    These are cut-outs — half of every file is transparent — and
                    they were being dropped onto a blue circle, which put each
                    person in a coloured bubble and made the section read as
                    eight badges. With the fill gone the circular clip is still
                    doing the work, but the only part of it anyone sees is where
                    it crosses the shoulders: the figure stands on the white and
                    the crop curves away under it.

                    Which is also why `object-top`. The clip takes the bottom of
                    the frame, and on a cut-out that is the torso — the thing you
                    can afford to lose. Centred, it took a slice of chin. */}
                <div className="relative size-56 overflow-hidden rounded-full lg:size-72">
                  {member.portrait && (
                    <Image
                      src={member.portrait.url}
                      alt=""
                      width={member.portrait.width}
                      height={member.portrait.height}
                      sizes="(min-width: 1024px) 288px, 224px"
                      // The zoom is on the picture inside a clip that does not
                      // move, so the portrait grows within its circle rather
                      // than the circle growing on the page and shoving the
                      // row. `motion-transform` is what drops it for a reader
                      // who asked for less movement.
                      className="motion-transform size-full object-cover object-top transition-transform duration-700 ease-(--ease-standard) group-hover:scale-110"
                    />
                  )}
                </div>

                <div className="mt-6 min-w-0">
                  <h3 className="text-xl leading-snug font-semibold tracking-[-0.02em] text-blue lg:text-[22px]">
                    {member.name}
                  </h3>
                  <p className="mt-1.5 text-[15px] text-gray">{member.role}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        ) : (
          <Reveal delay={140} className="mt-10 flex flex-col items-start gap-7">
            <p className="max-w-[58ch] text-lg leading-relaxed text-gray font-light">
              FXB Rwanda is governed by a Board of Directors. Full profiles are
              being prepared for publication here.
            </p>
            <Pill href={`mailto:${details.email}`} variant="outline">
              Ask about our governance
            </Pill>
          </Reveal>
        )}
      </Container>
    </SectionBand>
  );
}
