import type { Metadata } from "next";
import { formatDate } from "@/cms/content/date";
import { getNews } from "@/cms/content/news";
import { ArticleCard } from "@/components/cards/article-card";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { SubNav, newsInsightsNav } from "@/components/layout/sub-nav";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Latest News",
  description:
    "Announcements, programme updates, partnership news, project launches and milestones from FXB Rwanda.",
};

/**
 * Latest News.
 *
 * Newest first, as the query orders it. The set is small enough that it does
 * not need paging yet; when the team has brought the rest of the newsroom
 * across, this is where a pager goes.
 */
export default async function NewsPage() {
  const news = await getNews();

  return (
    <>
      <PageHeader
        path="/news-insights/news"
        breadcrumbs={[{ label: "News & Insights", href: "/news-insights" }]}
        eyebrow="LATEST NEWS"
        title="News from FXB Rwanda"
        intro="Keep up with the latest developments: announcements, programme updates, partnership news, project launches, achievements and other organisational milestones."
      />

      <SubNav items={newsInsightsNav} ariaLabel="News and Insights" />

      <section className="bg-white pt-14 pb-24 lg:pt-16 lg:pb-32">
        {news.length > 0 ? (
          <Container>
            <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item, index) => (
                <ArticleCard
                  key={item.slug}
                  href={`/news-insights/news/${item.slug}`}
                  title={item.title}
                  excerpt={item.excerpt}
                  date={formatDate(item.date)}
                  image={item.image}
                  language={item.language}
                  delay={Math.min(index, 3) * 60}
                />
              ))}
            </ul>
          </Container>
        ) : (
          // Reachable now that the newsroom is edited rather than compiled in —
          // everything could be unpublished at once. Better than a heading over
          // nothing.
          <EmptyState
            title="No news published yet"
            body="Announcements, programme updates and partnership news will appear here as they are published."
            actions={[
              {
                label: "Read our stories",
                href: "/news-insights/stories",
                primary: true,
              },
            ]}
          />
        )}
      </section>
    </>
  );
}
