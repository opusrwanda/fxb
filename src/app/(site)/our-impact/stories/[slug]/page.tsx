import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate } from "@/cms/content/date";
import { getStories, getStory } from "@/cms/content/stories";
import { ArticleBody } from "@/components/layout/article-body";

export async function generateStaticParams() {
  const stories = await getStories();
  return stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata(
  props: PageProps<"/our-impact/stories/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const story = await getStory(slug);
  if (!story) return {};

  return { title: story.title, description: story.excerpt };
}

export default async function StoryPage(
  props: PageProps<"/our-impact/stories/[slug]">,
) {
  const { slug } = await props.params;
  const story = await getStory(slug);
  if (!story) notFound();

  // The newest stories, minus this one. See the news article page for why
  // recency rather than a similarity nobody curated. Five fetched so that
  // dropping the current one still leaves four.
  const related = (await getStories(5))
    .filter((other) => other.slug !== story.slug)
    .slice(0, 4)
    .map((other) => ({
      href: `/our-impact/stories/${other.slug}`,
      title: other.title,
      date: formatDate(other.date),
      image: other.image,
    }));

  return (
    <ArticleBody
      eyebrow="IMPACT STORY"
      breadcrumbs={[
        { label: "Our Impact", href: "/our-impact" },
        { label: "Impact Stories", href: "/our-impact/stories" },
      ]}
      title={story.title}
      date={formatDate(story.date)}
      excerpt={story.excerpt}
      body={story.body}
      image={story.image}
      backHref="/our-impact/stories"
      backLabel="All stories"
      related={related}
      relatedHeading="MORE STORIES"
    />
  );
}
