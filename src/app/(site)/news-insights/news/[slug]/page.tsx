import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/layout/article-body";
import { formatNewsDate, news } from "@/lib/news";

/** Every item is known at build time, so every article is prerendered. */
export function generateStaticParams() {
  return news.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(
  props: PageProps<"/news-insights/news/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const item = news.find((entry) => entry.slug === slug);
  if (!item) return {};

  return { title: item.title, description: item.excerpt };
}

export default async function NewsArticlePage(
  props: PageProps<"/news-insights/news/[slug]">,
) {
  const { slug } = await props.params;
  const item = news.find((entry) => entry.slug === slug);
  if (!item) notFound();

  return (
    <ArticleBody
      eyebrow="NEWS"
      breadcrumbs={[
        { label: "News & Insights", href: "/news-insights" },
        { label: "Latest News", href: "/news-insights/news" },
      ]}
      title={item.title}
      date={formatNewsDate(item.date)}
      excerpt={item.excerpt}
      body={item.body}
      photo={item.photo}
      alt={item.alt}
      language={item.language}
      backHref="/news-insights/news"
      backLabel="All news"
    />
  );
}
