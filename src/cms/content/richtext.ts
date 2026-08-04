import { plainText } from "@/staff/lexical/plaintext";
import type { RichText } from "@/staff/db/schema";

export { plainText };

/** True when the editor is empty, or holds nothing but whitespace. */
export function isEmpty(data: RichText | null | undefined): boolean {
  return plainText(data).length === 0;
}

/**
 * True when the body says no more than the excerpt already did.
 *
 * The migration seeded each article's excerpt as its opening paragraph, so the
 * team had something to open and extend rather than an empty editor. Until
 * somebody does extend it, rendering both would print the same sentence twice —
 * once as the standfirst and once as the article. The page shows its "full
 * piece is on its way" panel instead, and stops the moment a second sentence is
 * written.
 */
export function saysNoMoreThan(
  data: RichText | null | undefined,
  excerpt: string,
): boolean {
  const body = plainText(data);
  return body.length === 0 || body === excerpt.trim();
}
