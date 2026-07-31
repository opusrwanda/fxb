import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { board } from "@/lib/leadership";
import { org } from "@/lib/site";

/**
 * Leadership — the Board of Directors.
 *
 * The portraits are cut-outs on transparency, so each one sits on a tinted
 * wedge rather than on the white of the page: without a ground behind them the
 * shoulders end in mid-air and the row reads as eight floating heads. The tint
 * is blue at 8%, the lightest step in the palette, so it holds the figure
 * without competing with it.
 *
 * Portraits carry an empty alt. The name is the next thing in the DOM, and a
 * screen reader announcing "Emmanuel KAYITANA" immediately before the heading
 * that says Emmanuel KAYITANA is noise, not information.
 */
export function Leadership() {
  return (
    <section id="leadership" className="scroll-mt-32 bg-blue-08 py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.14em] text-gray-80">
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
          <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {board.map((member, index) => (
              <Reveal as="li" key={member.id} delay={60 + Math.min(index, 3) * 60}>
                <div className="wedge relative aspect-square overflow-hidden bg-blue-16">
                  <Image
                    src={member.src}
                    alt=""
                    width={member.width}
                    height={member.height}
                    sizes="(min-width: 1024px) 23vw, 45vw"
                    className="size-full object-cover"
                  />
                </div>
                {/* Two lines' worth of room whether or not the name needs it,
                    so one long name — "Fr. Pierre Celestin NGOBOKA (PhD)" —
                    does not push its role out of line with the rest of the
                    row. Browsers without `lh` simply lose the alignment. */}
                <h3 className="mt-5 min-h-[2lh] text-base leading-snug font-semibold tracking-[-0.02em] text-blue lg:text-lg">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm text-gray">{member.role}</p>
              </Reveal>
            ))}
          </ul>
        ) : (
          <Reveal delay={80} className="mt-10 flex flex-col items-start gap-7">
            <p className="max-w-[58ch] text-lg leading-relaxed text-gray">
              FXB Rwanda is governed by a Board of Directors. Full profiles are
              being prepared for publication here.
            </p>
            <Pill href={`mailto:${org.email}`} variant="outline">
              Ask about our governance
            </Pill>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
