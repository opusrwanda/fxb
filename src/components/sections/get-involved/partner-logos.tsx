import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { getPartnersIn, type PartnerCategory } from "@/cms/content/people";

/**
 * A static grid of partner logos for one category.
 *
 * The home page runs these as a moving marquee, which is right for a glance in
 * passing. This page is where somebody has come specifically to see who FXB
 * works with, and a moving target is the wrong shape for reading a list —
 * so here they sit still and can be scanned.
 *
 * Each tile is a fixed box with the logo contained inside it. The supplied
 * marks run from 0.72:1 to 10.9:1 in aspect ratio, so anything that stretched
 * them to fill would distort two thirds of the set.
 */
export async function PartnerLogos({
  category,
}: {
  category: PartnerCategory;
}) {
  const logos = await getPartnersIn(category);
  if (logos.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {logos.map((partner, index) => (
        <Reveal
          as="li"
          key={partner.name}
          delay={Math.min(index, 3) * 60}
          className="flex h-28 items-center justify-center rounded-card border border-gray-15 p-5 lg:h-32"
        >
          {partner.logo && (
            <Image
              src={partner.logo.url}
              alt={partner.name}
              width={partner.logo.width}
              height={partner.logo.height}
              sizes="(min-width: 1024px) 22vw, 44vw"
              className="max-h-full w-auto max-w-full object-contain"
            />
          )}
        </Reveal>
      ))}
    </ul>
  );
}
