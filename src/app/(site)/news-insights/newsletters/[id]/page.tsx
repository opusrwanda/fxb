import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate } from "@/cms/content/date";
import {
  getEmailNewsletter,
  getEmailNewsletters,
} from "@/cms/content/email-newsletters";
import { ArticleBody } from "@/components/layout/article-body";

/**
 * One emailed newsletter, as a page.
 *
 * The same article layout a news item has, because that is what it is to
 * somebody reading it here: a headline, a photograph and the text. The email's
 * own furniture — the greeting, the unsubscribe footer — belongs to the email.
 *
 * Addressed by its number rather than a slug. An edition has no slug column,
 * and its title is a subject line somebody may still reword after sending; the
 * number is the one thing about it that will not move.
 */
export async function generateStaticParams() {
  const editions = await getEmailNewsletters();
  return editions.map((edition) => ({ id: String(edition.id) }));
}

async function find(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) ? getEmailNewsletter(id) : null;
}

export async function generateMetadata(
  props: PageProps<"/news-insights/newsletters/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const edition = await find(id);
  if (!edition) return {};

  return { title: edition.title, description: edition.excerpt || undefined };
}

export default async function EmailNewsletterPage(
  props: PageProps<"/news-insights/newsletters/[id]">,
) {
  const { id } = await props.params;
  const edition = await find(id);
  if (!edition) notFound();

  const related = (await getEmailNewsletters())
    .filter((other) => other.id !== edition.id)
    .slice(0, 4)
    .map((other) => ({
      href: `/news-insights/newsletters/${other.id}`,
      title: other.title,
      date: formatDate(other.date),
      image: other.image,
    }));

  return (
    <ArticleBody
      eyebrow="NEWSLETTER"
      breadcrumbs={[
        { label: "News & Insights", href: "/news-insights" },
        { label: "Newsletters", href: "/news-insights/newsletters" },
      ]}
      title={edition.title}
      date={formatDate(edition.date)}
      excerpt={edition.excerpt}
      body={edition.body}
      image={edition.image}
      backHref="/news-insights/newsletters"
      backLabel="All newsletters"
      related={related}
      relatedHeading="MORE NEWSLETTERS"
    />
  );
}
