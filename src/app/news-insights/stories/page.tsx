import type { Metadata } from "next";
import { ArticleCard } from "@/components/cards/article-card";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { formatStoryDate, stories } from "@/lib/stories";

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
export default function StoriesPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "News & Insights", href: "/news-insights" }]}
        eyebrow="STORIES"
        title="People, not projects"
        intro="Behind every programme is a story of hope, resilience and transformation. Discover how the lives of children, families and communities are changing through the support of FXB Rwanda and its partners."
      />

      <section className="bg-white pb-24 lg:pb-32">
        <Container>
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story, index) => (
              <ArticleCard
                key={story.slug}
                href={`/news-insights/stories/${story.slug}`}
                title={story.title}
                excerpt={story.excerpt}
                date={formatStoryDate(story.date)}
                photo={story.photo}
                alt={story.alt}
                delay={Math.min(index, 3) * 60}
              />
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
