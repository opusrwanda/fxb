import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/layout/article-body";
import { formatStoryDate, stories } from "@/lib/stories";

export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata(
  props: PageProps<"/news-insights/stories/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const story = stories.find((entry) => entry.slug === slug);
  if (!story) return {};

  return { title: story.title, description: story.excerpt };
}

export default async function StoryPage(
  props: PageProps<"/news-insights/stories/[slug]">
) {
  const { slug } = await props.params;
  const story = stories.find((entry) => entry.slug === slug);
  if (!story) notFound();

  return (
    <ArticleBody
      eyebrow="STORY"
      breadcrumbs={[
        { label: "News & Insights", href: "/news-insights" },
        { label: "Stories", href: "/news-insights/stories" },
      ]}
      title={story.title}
      date={formatStoryDate(story.date)}
      excerpt={story.excerpt}
      body={story.body}
      photo={story.photo}
      alt={story.alt}
      backHref="/news-insights/stories"
      backLabel="All stories"
    />
  );
}
