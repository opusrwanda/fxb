import type { Metadata } from "next";
import { ArticleCard } from "@/components/cards/article-card";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { formatNewsDate, news } from "@/lib/news";

export const metadata: Metadata = {
  title: "Latest News",
  description:
    "Announcements, programme updates, partnership news, project launches and milestones from FXB Rwanda.",
};

/**
 * Latest News.
 *
 * Newest first, as the data is ordered. The set is small enough that it does
 * not need paging yet; when the migration brings the rest of the newsroom
 * across, this is where a pager goes.
 */
export default function NewsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "News & Insights", href: "/news-insights" }]}
        eyebrow="LATEST NEWS"
        title="News from FXB Rwanda"
        intro="Keep up with the latest developments: announcements, programme updates, partnership news, project launches, achievements and other organisational milestones."
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item, index) => (
              <ArticleCard
                key={item.slug}
                href={`/news-insights/news/${item.slug}`}
                title={item.title}
                excerpt={item.excerpt}
                date={formatNewsDate(item.date)}
                photo={item.photo}
                alt={item.alt}
                language={item.language}
                delay={Math.min(index, 3) * 60}
              />
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
