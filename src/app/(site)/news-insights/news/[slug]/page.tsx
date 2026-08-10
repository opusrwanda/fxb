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
    />
  );
}
