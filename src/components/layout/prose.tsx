import type { RichText } from "@/staff/db/schema";
import { RenderRichText } from "@/staff/lexical/render";
import { isEmpty } from "@/cms/content/richtext";

/**
 * Body copy written in the staff panel.
 *
 * Styling is applied to the container rather than per node because there is
 * nothing to decide node by node — a paragraph is a paragraph. Descendant
 * selectors keep the rules in one place and mean a heading or a list the team
 * adds next month is already styled, instead of arriving unstyled and needing
 * code written for it.
 */
export function Prose({
  data,
  className = "",
  lang,
}: {
  data: RichText | null | undefined;
  className?: string;
  /** BCP 47 tag, where the article is not in the site's language. */
  lang?: string;
}) {
  if (isEmpty(data)) return null;

  return (
    <div
      lang={lang}
      className={`flex flex-col gap-6
        [&_p]:max-w-[62ch] [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-gray lg:[&_p]:text-[17px]
        [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_h2]:text-blue
        [&_h3]:mt-2 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:tracking-[-0.01em] [&_h3]:text-blue
        [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-blue
        [&_strong]:font-semibold [&_strong]:text-blue
        [&_a]:font-semibold [&_a]:text-blue [&_a]:underline [&_a]:underline-offset-4
        [&_ul]:max-w-[62ch] [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:max-w-[62ch] [&_ol]:list-decimal [&_ol]:pl-6
        [&_li]:mt-2 [&_li]:text-base [&_li]:leading-relaxed [&_li]:text-gray lg:[&_li]:text-[17px]
        [&_blockquote]:border-l-2 [&_blockquote]:border-blue [&_blockquote]:pl-6 [&_blockquote]:text-[26px] [&_blockquote]:leading-[1.45] [&_blockquote]:font-extralight [&_blockquote]:tracking-[-0.01em] [&_blockquote]:text-blue
        ${className}`}
    >
      <RenderRichText data={data} />
    </div>
  );
}
