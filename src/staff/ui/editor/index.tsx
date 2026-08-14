"use client";

import { useEffect, useMemo, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import type { EditorState } from "lexical";

import { ImageDragPlugin } from "./image-drag-plugin";
import { ImageNode, VideoNode } from "./nodes";
import { Toolbar } from "./toolbar";

/**
 * The rich text editor.
 *
 * Lexical, which is Meta's — the editing engine is the one part of a CMS worth
 * renting, because contenteditable, selection, undo and paste sanitisation are
 * specialist work measured in years. Payload made the same call. Everything
 * around it is ours.
 *
 * HOW IT REACHES THE SERVER
 *
 * The document form is a plain form posting to a server action, which is what
 * lets the panel save without JavaScript. The editor keeps that arrangement
 * intact by writing its state into a hidden input on every change, so the form
 * posts the Lexical JSON as an ordinary field. Nothing about the save path
 * knows an editor is involved.
 *
 * The class names on each node come from `theme` below and deliberately match
 * `Prose`, the component that renders this same content on the website. What
 * the writer sees is what the reader gets, which is the entire point of the
 * exercise.
 */

/**
 * The editor's typography, which is `Prose`'s.
 *
 * Every value here is the one the website renders with, and that is the whole
 * job of this object — the claim in the comment above is only true if these
 * two stay in step.
 *
 * THE 62ch MEASURE IS THE IMPORTANT ONE. It was missing, so the editor set
 * paragraphs across the full width of its box while the site holds them to 62
 * characters. The words were identical and the lines broke in different
 * places, which is invisible on ragged-right text and glaring the moment
 * something is justified: the panel showed even columns and the website showed
 * the same paragraph with different gaps in it. The type size had the same
 * problem — 16px here against 17px on a large screen there.
 */
const theme = {
  paragraph: "mb-6 max-w-[62ch] text-base leading-relaxed text-gray lg:text-[17px]",
  heading: {
    h2: "mt-6 mb-3 text-2xl font-bold tracking-[-0.02em] text-blue",
    h3: "mt-4 mb-2 text-xl font-bold tracking-[-0.01em] text-blue",
  },
  // Body colour, not blue. Quoting a passage was recolouring it, which reads
  // as the text having been changed rather than set apart — the rule down the
  // left, the size and the light weight already say "this is a quotation", and
  // they say it without touching the words. Matches `Prose`.
  quote:
    "my-6 border-l-2 border-blue pl-6 text-[26px] leading-[1.45] font-extralight tracking-[-0.01em] text-gray",
  list: {
    ul: "mb-6 max-w-[62ch] list-disc pl-6",
    ol: "mb-6 max-w-[62ch] list-decimal pl-6",
    listitem: "mt-2 text-base leading-relaxed text-gray lg:text-[17px]",
  },
  link: "font-semibold text-blue underline underline-offset-4",
  text: {
    bold: "font-semibold text-blue",
    italic: "italic",
    underline: "underline underline-offset-2",
    strikethrough: "line-through",
  },
};

/**
 * Every node type this editor can read, including the ones Lexical registers
 * for itself. Kept next to the `nodes` list above, which is what makes it true.
 */
const KNOWN = new Set([
  "root",
  "text",
  "linebreak",
  "tab",
  "paragraph",
  "heading",
  "quote",
  "list",
  "listitem",
  "link",
  "autolink",
  "image",
  "video",
  "horizontalrule",
]);

/**
 * Anything in this document the editor would drop on the floor.
 *
 * Read before Lexical is handed the document, because Lexical's own answer to a
 * type it does not know is to log to the console and stop reading — and the
 * console is not somewhere a communications officer in Kigali is looking. This
 * is the check that turns a silent truncation into a sentence on the screen.
 *
 * A document that will not parse as JSON at all counts as unreadable too. That
 * should not be possible, and if it happens the last thing anybody wants is for
 * this form to replace it with an empty one.
 */
function unreadableParts(json: string): string[] {
  if (!json) return [];

  try {
    const found = new Set<string>();

    const walk = (node: { type?: string; children?: unknown[] }) => {
      if (node?.type && !KNOWN.has(node.type)) found.add(node.type);
      for (const child of (node?.children ?? []) as { type?: string }[]) {
        walk(child);
      }
    };

    const root = (JSON.parse(json) as { root?: { type?: string } }).root;
    if (!root) return ["empty"];
    walk(root);

    return [...found];
  } catch {
    return ["unreadable"];
  }
}

/**
 * Keeps Lexical's own read/write flag in step with the prop.
 *
 * `initialConfig` is read once, when the composer is created, and never again —
 * the name is not a hint, it is the whole contract. Everything else on this
 * page reacted to pressing Edit: the toolbar appeared, the fieldset came alive,
 * the heading changed. The body did not, because React saw the same component
 * in the same place and kept the editor it already had, still holding the
 * `editable: false` it was born with. Reloading the page built a new one, which
 * is why the panel worked if you refreshed and looked broken if you did not.
 *
 * Setting it in an effect is the supported way round. Remounting the editor
 * would also work and would throw away the undo history and the cursor every
 * time somebody switched mode.
 */
function EditableSync({ editable }: { editable: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.setEditable(editable);
  }, [editor, editable]);

  return null;
}

export function RichTextEditor({
  name,
  initialJson,
  ariaLabelledBy,
  readOnly = false,
}: {
  /** The form field the JSON is posted under. */
  name: string;
  /** The stored Lexical document, as JSON. Empty for a new document. */
  initialJson: string;
  ariaLabelledBy?: string;
  /**
   * Show the document without offering to change it.
   *
   * For somebody whose role lets them read this collection and not write to
   * it. `disabled` on the surrounding fieldset takes care of every other
   * control on the page, because they are ordinary form elements and the
   * browser knows what disabling one means. A Lexical editor is a `div` with
   * `contenteditable` on it, so the browser does not: without this, a person
   * with read access could type into a body they have no way to save.
   */
  readOnly?: boolean;
}) {
  const [value, setValue] = useState(initialJson);

  /**
   * Whether this document contains something the editor cannot read.
   *
   * Computed once from the stored JSON, before Lexical touches it. When it does
   * find something, the text is shown but locked and the form keeps posting the
   * stored version — the writing survives, the other fields on the page still
   * save, and somebody is told why rather than discovering later that half an
   * article has gone.
   */
  const missing = useMemo(() => unreadableParts(initialJson), [initialJson]);
  const locked = missing.length > 0;

  return (
    <div className="overflow-hidden rounded-card border border-gray-15 bg-white focus-within:border-blue">
      {locked && (
        <p
          role="status"
          className="border-b border-gray-15 bg-blue-08 px-5 py-4 text-[15px] leading-relaxed text-gray"
        >
          <strong className="font-semibold text-blue">
            This text cannot be edited here.
          </strong>{" "}
          It contains something this editor does not know how to handle
          {missing[0] === "unreadable" || missing[0] === "empty"
            ? ""
            : ` (${missing.join(", ")})`}
          , and editing it would risk losing part of what is written. The words
          are safe and the website still shows them in full — everything else on
          this page can still be changed and saved. Tell whoever maintains the
          site, and this becomes a small fix.
        </p>
      )}

      <LexicalComposer
        initialConfig={{
          namespace: "fxb",
          theme,
          // Locked as well as read-only: an editor somebody can type into but
          // which will not save what they typed is worse than one that says so.
          editable: !readOnly && !locked,
          // ImageNode and VideoNode are ours — see `nodes.tsx`. A node type
          // that is not registered here throws when a stored document
          // containing it is loaded, so this list and `lexical/render.tsx`
          // have to move together.
          nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            LinkNode,
            AutoLinkNode,
            ImageNode,
            VideoNode,
            /**
             * The one that was missing, and what it cost.
             *
             * `render.tsx` has always drawn a `horizontalrule`, and Payload's
             * editor could insert one, so migrated articles contain them. This
             * editor could not, and an unregistered type does not fail loudly:
             * Lexical logs `parseEditorState: type "horizontalrule" not found`
             * to the console and stops reading the document there. Everything
             * past the rule was missing from the panel — and because the form
             * posts whatever the editor holds, saving the article would then
             * have written the truncated version back over the real one.
             *
             * The rule is what the story pages use between an account and the
             * note that follows it, so this was live content. Anything else the
             * renderer knows about belongs in this list too — the guard below
             * now refuses to save rather than let the next omission delete
             * somebody's paragraphs.
             */
            HorizontalRuleNode,
          ],
          // A stored document is handed to Lexical as its starting state. An
          // empty string means a new document, and Lexical starts blank.
          editorState: initialJson && initialJson !== "" ? initialJson : undefined,
          onError(error) {
            // Never swallow it — a broken editor that looks fine is worse than
            // one that says so.
            console.error("[editor]", error);
          },
        }}
      >
        {/* Keeps Lexical's flag in step with the prop — see above. Without it
            the panel needs a refresh before the body will accept typing. */}
        <EditableSync editable={!readOnly && !locked} />

        {!readOnly && !locked && <Toolbar />}

        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-labelledby={ariaLabelledBy}
              // The resize maths measures against this element: a width
              // dragged in pixels is stored as a percentage of the column the
              // picture actually sits in, not of the window.
              data-editor-content=""
              className="min-h-[24rem] px-5 py-4 outline-none"
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* Where a dragged picture lands. The drag itself starts on the
            image; this is the half that knows the document. */}
        <ImageDragPlugin />

        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        {/* Makes the toolbar's dividing line insertable. Registering the node
            is what lets an existing one be *read*; this is what adds one. */}
        <HorizontalRulePlugin />

        <OnChangePlugin
          ignoreSelectionChange
          onChange={(editorState: EditorState) =>
            setValue(JSON.stringify(editorState.toJSON()))
          }
        />
      </LexicalComposer>

      {/* What the form actually posts — the stored text, untouched, when the
          editor could not read all of it. This is the line that makes the
          warning above true. */}
      <input type="hidden" name={name} value={locked ? initialJson : value} />
    </div>
  );
}
