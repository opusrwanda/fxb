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
    <section id="leadership" className="scroll-mt-32 bg-green-10 py-24 lg:py-32">
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

        {/* Two across, and the name beside the portrait rather than under it.
            Four up with centred captions is what every board page does, this
            one included until now. */}
        {board.length > 0 ? (
          <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:gap-x-16 lg:gap-y-12">
            {board.map((member, index) => (
              <Reveal
                as="li"
                key={member.name}
                delay={60 + Math.min(index, 3) * 60}
                className="flex items-center gap-5 lg:gap-7"
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
                <div className="relative size-28 shrink-0 overflow-hidden rounded-full lg:size-36">
                  {member.portrait && (
                    <Image
                      src={member.portrait.url}
                      alt=""
                      width={member.portrait.width}
                      height={member.portrait.height}
                      sizes="(min-width: 1024px) 144px, 112px"
                      className="size-full object-cover object-top"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg leading-snug font-semibold tracking-[-0.02em] text-blue lg:text-xl">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray">{member.role}</p>
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
    </section>
  );
}
