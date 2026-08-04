import type { Metadata } from "next";
import { ArticleCard } from "@/components/cards/article-card";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { SubNav, newsInsightsNav } from "@/components/layout/sub-nav";
import { formatDate } from "@/cms/content/date";
import { getStories } from "@/cms/content/stories";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "How the lives of children, families and communities are changing through the support of FXB Rwanda and its partners.",
};

/**
 * Stories.
 *
 * The canonical listing for impact stories. "Success Stories" in the Our Impact
 * menu redirects here rather than rendering the same three stories at a second
 * URL — see the redirect in `next.config.ts`.
 *
 * The brief's instruction for this section is one line and worth keeping in
 * view: "This section should focus on people, not projects."
 */
export default async function StoriesPage() {
  const stories = await getStories();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "News & Insights", href: "/news-insights" }]}
        eyebrow="STORIES"
        title="People, not projects"
        intro="Behind every programme is a story of hope, resilience and transformation. Discover how the lives of children, families and communities are changing through the support of FXB Rwanda and its partners."
      />

      <SubNav items={newsInsightsNav} ariaLabel="News and Insights" />

      <section className="bg-white pt-14 pb-24 lg:pt-16 lg:pb-32">
        {stories.length > 0 ? (
          <Container>
            <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story, index) => (
                <ArticleCard
                  key={story.slug}
                  href={`/news-insights/stories/${story.slug}`}
                  title={story.title}
                  excerpt={story.excerpt}
                  date={formatDate(story.date)}
                  image={story.image}
                  delay={Math.min(index, 3) * 60}
                />
              ))}
            </ul>
          </Container>
        ) : (
          <EmptyState
            title="Stories are on their way"
            body="Accounts of the families and young people our programmes work with are being prepared for publication."
            actions={[
              { label: "Read our news", href: "/news-insights/news", primary: true },
            ]}
          />
        )}
      </section>
    </>
  );
}
