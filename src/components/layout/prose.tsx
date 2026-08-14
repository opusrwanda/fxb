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
 *
 * NORMAL BLOCK FLOW, NOT FLEX. This was `flex flex-col gap-6`, which is a
 * tidier way to space a column of blocks and is also why a picture could never
 * have text beside it: `float` does nothing to a flex item, so the wrapping
 * FXB asked for was not a rule away — it was impossible while this was a flex
 * container.
 *
 * So the gap became a top margin per element type. Written per type rather
 * than as one `* + *` rule on purpose: headings want more room above them than
 * paragraphs do, and with a generic rule and an override of the same
 * specificity, which one wins depends on the order Tailwind happens to emit
 * them in. One rule per element is boring and cannot lose.
 *
 * The spacing is unchanged from the flex version — 24px between blocks, 40
 * above an h2, 32 above an h3 — because flex `gap` and the old margins added
 * together, and these numbers are those sums.
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
      // Pictures and video run to the full width of the column rather than the
      // 62ch the text is held to. A body of type wants a measure it is
      // comfortable to read along; a photograph wants to be seen, and capping
      // it at the same 62ch would leave it the width of a paragraph on a
      // desktop. The caption goes back to 62ch, because a caption is text.
      className={`article-prose
        [&>*:first-child]:mt-0
        [&>p]:mt-6 [&_p]:max-w-[62ch] [&_p]:text-base [&_p]:leading-relaxed [&_p]:text-gray lg:[&_p]:text-[17px]
        [&>h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_h2]:text-blue
        [&>h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:tracking-[-0.01em] [&_h3]:text-blue
        [&>h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-blue
        [&_strong]:font-semibold [&_strong]:text-blue
        [&_a]:font-semibold [&_a]:text-blue [&_a]:underline [&_a]:underline-offset-4
        [&>ul]:mt-6 [&>ol]:mt-6 [&_ul]:max-w-[62ch] [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:max-w-[62ch] [&_ol]:list-decimal [&_ol]:pl-6
        [&_li]:mt-2 [&_li]:text-base [&_li]:leading-relaxed [&_li]:text-gray lg:[&_li]:text-[17px]
        [&>blockquote]:mt-6 [&_blockquote]:border-l-2 [&_blockquote]:border-blue [&_blockquote]:pl-6 [&_blockquote]:text-[26px] [&_blockquote]:leading-[1.45] [&_blockquote]:font-extralight [&_blockquote]:tracking-[-0.01em] [&_blockquote]:text-gray
        [&_figure]:flex [&_figure]:flex-col [&_figure]:gap-3
        [&_figure_img]:h-auto [&_figure_img]:w-full [&_figure_img]:rounded-card
        [&_figcaption]:text-sm [&_figcaption]:leading-relaxed [&_figcaption]:text-gray-80
        [&>div]:mt-6 [&_video]:h-auto [&_video]:w-full [&_video]:rounded-card [&_video]:bg-blue
        ${className}`}
    >
      <RenderRichText data={data} />
    </div>
  );
}
