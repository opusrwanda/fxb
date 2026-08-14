import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate } from "@/cms/content/date";
import { getNews, getNewsItem } from "@/cms/content/news";
import { ArticleBody } from "@/components/layout/article-body";

/**
 * Every published item is known at build time, so every article is prerendered.
 *
 * `dynamicParams` stays on, unlike the programme pages: news is published from
 * `/staff` between deploys, and an item added on a Tuesday has to be reachable
 * on the Tuesday rather than at the next build.
 */
export async function generateStaticParams() {
  const news = await getNews();
  return news.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  props: PageProps<"/news-insights/news/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const item = await getNewsItem(slug);
  if (!item) return {};

  return { title: item.title, description: item.excerpt };
}

export default async function NewsArticlePage(
  props: PageProps<"/news-insights/news/[slug]">,
) {
  const { slug } = await props.params;
  const item = await getNewsItem(slug);
  if (!item) notFound();

  /**
   * What to read next: the most recent news, minus this piece.
   *
   * Recency rather than similarity, and deliberately. "Related" on a site with
   * a few dozen articles and no tags means either a keyword match nobody
   * curated or a category of one — both produce a column that looks
   * hand-picked and is not. The newest four are honestly what they are, and on
   * a site publishing a handful of items a month they are also usually the
   * most relevant thing available.
   *
   * Five are fetched so that removing the current article still leaves four.
   */
  const related = (await getNews(5))
    .filter((other) => other.slug !== item.slug)
    .slice(0, 4)
    .map((other) => ({
      href: `/news-insights/news/${other.slug}`,
      title: other.title,
      date: formatDate(other.date),
      image: other.image,
      language: other.language,
    }));

  return (
    <ArticleBody
      eyebrow="NEWS"
      breadcrumbs={[
        { label: "News & Insights", href: "/news-insights" },
        { label: "Latest News", href: "/news-insights/news" },
      ]}
      title={item.title}
      date={formatDate(item.date)}
      excerpt={item.excerpt}
      body={item.body}
      image={item.image}
      language={item.language}
      backHref="/news-insights/news"
      backLabel="All news"
      related={related}
      relatedHeading="MORE NEWS"
    />
  );
}
