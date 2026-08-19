import type { Metadata } from "next";
import { getSection, paragraphs } from "@/cms/content/sections";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Hero } from "@/components/sections/hero";
import { getPageBanner } from "@/cms/content/page-headers";
import { Partners } from "@/components/sections/partners";
import { PhotoBand } from "@/components/sections/photo-band";
import { getPhotos } from "@/cms/content/photos";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "Partner with FXB Rwanda, work with us, supply us, or donate. Sustainable development requires collaboration.",
};

const routes = [
  {
    href: "/get-involved/partners",
    label: "Partner With Us",
    body: "Development partners, government, institutional donors and companies — and how to start a conversation.",
  },
  {
    href: "/get-involved/careers",
    label: "Careers",
    body: "Our people are at the heart of our mission. Current openings are posted here as they arise.",
  },
  {
    href: "/get-involved/procurement",
    label: "Procurement",
    body: "Open tenders for suppliers, consultants and service providers, published transparently.",
  },
  {
    href: "/get-involved/donate",
    label: "Donate",
    body: "Every contribution helps restore dignity and build resilience. Bank details and guidance here.",
  },
];

export default async function GetInvolvedPage() {
  const copy = await getSection("header:/get-involved");
  const waysCopy = await getSection("get-involved:ways-in");
  const photos = await getPhotos(["fostering-03.jpg"]);
  const banner = await getPageBanner("/get-involved");
  return (
    <>
      <Hero
        image={banner.image}
        video={banner.video}
        eyebrow={copy.eyebrow}
        headline={copy.heading ?? ""}
        body={copy.body}
        ctas={[
          {
            label: "Become a Partner",
            href: "/get-involved/partners#become-a-partner",
            primary: true,
          },
          { label: "Donate", href: "/get-involved/donate" },
        ]}
      />

      <section className="bg-white py-24 lg:py-32">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
            <Reveal className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
              <div className="flex items-center gap-4">
                <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
                <span className="text-[24px] font-semibold tracking-[0.14em] text-gray-80">
                  GET INVOLVED
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[42px] lg:leading-[1.08]">
                {waysCopy.heading}
              </h2>
            </Reveal>

            <Reveal delay={140} className="flex flex-col gap-6 lg:col-span-7 lg:col-start-6">
              {paragraphs(waysCopy.body).map((paragraph, index) => (
                <p
                  key={index}
                  className="max-w-[58ch] text-base leading-relaxed text-gray lg:text-[17px]"
                >
                  {paragraph}
                </p>
              ))}
              <div className="mt-2 flex flex-wrap gap-4">
                <Pill href="/what-we-do" variant="primary" size="lg">
                  Explore Our Work
                </Pill>
                <Pill href="/contact" variant="outline" size="lg">
                  Contact Us
                </Pill>
              </div>
            </Reveal>
          </div>

          <ul className="mt-16 grid gap-6 sm:grid-cols-2">
            {routes.map((route, index) => (
              <Reveal as="li" key={route.href} delay={Math.min(index, 3) * 60}>
                <Link
                  href={route.href}
                  className="wedge group flex h-full flex-col gap-4 bg-blue-08 p-8 transition-colors duration-500 hover:bg-blue-16 lg:p-10"
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                      {route.label}
                    </span>
                    <span className="motion-transform mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-15 transition-colors duration-500 group-hover:border-blue group-hover:bg-blue">
                      <ArrowUpRight
                        className="size-4 text-blue transition-colors duration-500 group-hover:text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                  <span className="max-w-[46ch] text-base leading-relaxed text-gray">
                    {route.body}
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <Partners />
      <PhotoBand
        sectionKey="photo:/get-involved"
        image={photos["fostering-03.jpg"]}
      />

    </>
  );
}
