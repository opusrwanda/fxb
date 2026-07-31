import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Hero } from "@/components/sections/hero";
import { LatestNews } from "@/components/sections/latest-news";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "News & Insights",
  description:
    "News, stories, publications and newsletters from FXB Rwanda — how we are working with communities and partners to create lasting impact across Rwanda.",
};

/**
 * News & Insights — the hub.
 *
 * Four routes hang off this section in the header menu, so the page's job is to
 * name them and get out of the way, then show the newest material underneath.
 * The latest-news band is the home page's, reused rather than reimplemented.
 */
const sections = [
  {
    href: "/news-insights/news",
    label: "Latest News",
    body: "Programme launches, new partnerships, project updates, community campaigns, awards and recognitions.",
  },
  {
    href: "/news-insights/stories",
    label: "Stories",
    body: "Behind every programme is a story of hope, resilience and transformation. These are about people, not projects.",
  },
  {
    href: "/news-insights/publications",
    label: "Publications",
    body: "Reports, research, policy documents and brochures that show our work, impact and learning.",
  },
  {
    href: "/news-insights/newsletters",
    label: "Newsletters",
    body: "Our quarterly newsletter, gathering the districts, the programmes and the people in one place.",
  },
];

export default function NewsInsightsPage() {
  return (
    <>
      <Hero
        headline="What is happening, and who it is happening to."
        body="Stay informed with the latest updates from FXB Rwanda. Explore our news, stories, events and publications to learn how we are working with communities and partners to create lasting impact across Rwanda."
        ctas={[
          { label: "Latest News", href: "/news-insights/news", primary: true },
          { label: "Stories", href: "/news-insights/stories" },
        ]}
      />

      <section className="bg-white py-24 lg:py-32">
        <Container>
          <ul className="grid gap-6 sm:grid-cols-2">
            {sections.map((section, index) => (
              <Reveal as="li" key={section.href} delay={(index % 2) * 80}>
                <Link
                  href={section.href}
                  className="wedge group flex h-full flex-col gap-4 bg-blue-08 p-8 transition-colors duration-300 hover:bg-blue-16 lg:p-10"
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="text-2xl font-bold tracking-[-0.02em] text-blue lg:text-[28px]">
                      {section.label}
                    </span>
                    <span className="motion-transform mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-15 transition-colors duration-300 group-hover:border-blue group-hover:bg-blue">
                      <ArrowUpRight
                        className="size-4 text-blue transition-colors duration-300 group-hover:text-white"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                  <span className="max-w-[46ch] text-base leading-relaxed text-gray">
                    {section.body}
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <LatestNews />
    </>
  );
}
