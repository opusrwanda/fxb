import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { photo } from "@/lib/photos";
import { formatNewsDate, news } from "@/lib/news";

/**
 * Latest News.
 *
 * "News & Insights" is what the site's own navigation calls this material, and
 * this is the newest slice of it — so the band is headed Latest News and links
 * through to the full listing. It is deliberately not called Stories: that word
 * is already spoken for by the impact stories above, which are accounts of one
 * household, where these are announcements about the organisation.
 *
 * Lead item plus a stacked list, rather than another row of equal cards. Three
 * matching cards would say all three are equally important; news has a running
 * order, and the newest item earns the photograph.
 */
export function LatestNews() {
  const [lead, ...rest] = news;

  return (
    <section id="news" className="bg-white py-24 lg:py-32">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-green" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.22em] text-gray-40">
                NEWS &amp; INSIGHTS
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[44px] lg:leading-[1.1]">
              Latest from FXB Rwanda
            </h2>
          </div>

          <Link
            href="/news-insights/news"
            className="group flex items-center gap-2.5 text-base font-medium text-blue"
          >
            All news
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <article className="flex flex-col gap-6">
              <Link
                href={`/news-insights/news/${lead.slug}`}
                className="group relative block aspect-16/10 overflow-hidden rounded-[20px]"
              >
                <Image
                  src={photo(lead.photo).url}
                  alt={lead.alt}
                  fill
                  sizes="(min-width: 1024px) 58vw, 90vw"
                  className="motion-transform object-cover transition-transform duration-[700ms] ease-out group-hover:scale-105"
                />
              </Link>

              <div className="flex flex-col items-start gap-4">
                <time
                  dateTime={lead.date}
                  className="text-sm font-medium text-gray-40"
                >
                  {formatNewsDate(lead.date)}
                </time>

                <h3
                  lang={lead.language}
                  className="text-2xl leading-snug font-semibold tracking-[-0.02em] text-gray lg:text-[30px] lg:leading-[1.2]"
                >
                  <Link
                    href={`/news-insights/news/${lead.slug}`}
                    className="transition-colors duration-200 hover:text-blue"
                  >
                    {lead.title}
                  </Link>
                </h3>

                <p
                  lang={lead.language}
                  className="max-w-[62ch] text-base leading-relaxed text-gray"
                >
                  {lead.excerpt}
                </p>

                <Pill
                  href={`/news-insights/news/${lead.slug}`}
                  size="sm"
                  className="mt-2 gap-2"
                >
                  Read More
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Pill>
              </div>
            </article>
          </Reveal>

          <ul className="flex flex-col lg:col-span-5">
            {rest.map((item, index) => (
              <Reveal as="li" key={item.slug} delay={120 + index * 80}>
                {/* Rule above rather than below, so the list does not end on a
                    stray line under the last item. */}
                <article
                  className={`flex gap-5 py-7 ${
                    index === 0 ? "lg:pt-0" : "border-t border-gray-15"
                  }`}
                >
                  <Link
                    href={`/news-insights/news/${item.slug}`}
                    className="group relative block aspect-4/3 w-28 shrink-0 overflow-hidden rounded-[14px] sm:w-32"
                  >
                    <Image
                      src={photo(item.photo).url}
                      alt={item.alt}
                      fill
                      sizes="128px"
                      className="motion-transform object-cover transition-transform duration-[700ms] ease-out group-hover:scale-105"
                    />
                  </Link>

                  <div className="flex flex-col gap-2.5">
                    <time
                      dateTime={item.date}
                      className="text-sm font-medium text-gray-40"
                    >
                      {formatNewsDate(item.date)}
                    </time>
                    <h3
                      lang={item.language}
                      className="line-clamp-3 text-lg leading-snug font-semibold tracking-[-0.01em] text-gray"
                    >
                      <Link
                        href={`/news-insights/news/${item.slug}`}
                        className="transition-colors duration-200 hover:text-blue"
                      >
                        {item.title}
                      </Link>
                    </h3>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
