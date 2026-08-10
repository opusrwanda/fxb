"use client";

import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline,
  Undo2,
  Video,
} from "lucide-react";

import type { PickerOption } from "@/staff/ui/media-picker";
import { ImageDialog } from "./image-dialog";
import { $createImageNode, $createVideoNode, readVideoUrl } from "./nodes";

/**
 * The editor's controls.
 *
 * Only what this site's articles actually use: emphasis, two heading levels,
 * lists, a quote, a link, a picture and a video. Every extra control is a
 * decision an editor has to make and a way for the page to stop looking like
 * the rest of the site — there is no font picker or colour swatch here on
 * purpose, because the typography is the design system's job, not the
 * writer's.
 *
 * That is also why the picture and video controls ask so little. Neither has a
 * size, an alignment or a float: a picture in an article is a band across the
 * measure, and which band is `Prose`'s decision, made once, for every article.
 * The writer chooses what goes in and where it sits in the flow.
 *
 * The buttons light up to show what the cursor is sitting in, so the toolbar
 * reports the state of the text rather than only acting on it.
 */

type Block = "paragraph" | "h2" | "h3" | "quote" | "bullet" | "number";

export function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [link, setLink] = useState(false);
  const [block, setBlock] = useState<Block>("paragraph");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [picking, setPicking] = useState(false);

  const sync = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setBold(selection.hasFormat("bold"));
    setItalic(selection.hasFormat("italic"));
    setUnderline(selection.hasFormat("underline"));

    const node = selection.anchor.getNode();
    setLink(
      Boolean($findMatchingParent(node, (parent) => $isLinkNode(parent))),
    );

    const top = node.getKey() === "root" ? node : node.getTopLevelElementOrThrow();

    if ($isListNode(top)) {
      setBlock((top as ListNode).getListType() === "number" ? "number" : "bullet");
    } else if ($isHeadingNode(top)) {
      setBlock(top.getTag() === "h3" ? "h3" : "h2");
    } else if (top.getType() === "quote") {
      setBlock("quote");
    } else {
      setBlock("paragraph");
    }
  }, []);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(sync);
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            sync();
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          CAN_UNDO_COMMAND,
          (payload) => {
            setCanUndo(payload);
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          CAN_REDO_COMMAND,
          (payload) => {
            setCanRedo(payload);
            return false;
          },
          COMMAND_PRIORITY_LOW,
        ),
      ),
    [editor, sync],
  );

  /** Turn the selected blocks into `target`, or back to paragraphs if already it. */
  const setBlockType = (target: Block) => {
    if (target === "bullet" || target === "number") {
      if (block === target) {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
        return;
      }
      editor.dispatchCommand(
        target === "bullet"
          ? INSERT_UNORDERED_LIST_COMMAND
          : INSERT_ORDERED_LIST_COMMAND,
        undefined,
      );
      return;
    }

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // Pressing the active button again returns the block to a paragraph,
      // which is what people expect from a toggle and saves hunting for a
      // "normal text" option that does not exist.
      if (block === target) {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }

      if (target === "quote") $setBlocksType(selection, () => $createQuoteNode());
      else if (target === "h2") $setBlocksType(selection, () => $createHeadingNode("h2"));
      else if (target === "h3") $setBlocksType(selection, () => $createHeadingNode("h3"));
      else $setBlocksType(selection, () => $createParagraphNode());
    });
  };

  const toggleLink = () => {
    if (link) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      return;
    }
    const url = window.prompt("Address to link to", "https://");
    if (!url) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  const insertImage = (option: PickerOption) => {
    setPicking(false);
    editor.update(() => {
      // `$insertNodeToNearestRoot` rather than inserting into the selection: a
      // picture is a block, and dropping a block node inside the paragraph the
      // cursor happens to be in splits the paragraph in a way Lexical then has
      // to repair. This puts it between blocks, where it belongs.
      $insertNodeToNearestRoot(
        $createImageNode(option.url, option.alt, option.id),
      );
    });
  };

  const insertVideo = () => {
    const url = window.prompt(
      "Paste a YouTube or Vimeo address, or a link to a video file.",
      "https://",
    );
    if (!url) return;

    const video = readVideoUrl(url);
    if (!video) {
      // Said rather than swallowed. Inserting a block that cannot resolve to
      // anything would put an empty frame on the published page, and the
      // person who pasted the address is the only one who can fix it.
      window.alert(
        "That address was not recognised. Use a YouTube or Vimeo link, or a direct link to an .mp4 or .webm file.",
      );
      return;
    }

    const title = window.prompt("A title for the video, for screen readers and search.", "") ?? "";

    editor.update(() => {
      $insertNodeToNearestRoot(
        $createVideoNode(video.provider, video.videoId, title.trim()),
      );
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-15 bg-blue-08 px-2 py-2">
      <Button
        label="Bold"
        active={bold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        <Bold className="size-4" aria-hidden="true" />
      </Button>
      <Button
        label="Italic"
        active={italic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        <Italic className="size-4" aria-hidden="true" />
      </Button>
      <Button
        label="Underline"
        active={underline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
      >
        <Underline className="size-4" aria-hidden="true" />
      </Button>

      <Divider />

      <Button label="Heading" active={block === "h2"} onClick={() => setBlockType("h2")}>
        <span className="text-[13px] font-bold">H2</span>
      </Button>
      <Button label="Sub-heading" active={block === "h3"} onClick={() => setBlockType("h3")}>
        <span className="text-[13px] font-bold">H3</span>
      </Button>

      <Divider />

      <Button label="Bulleted list" active={block === "bullet"} onClick={() => setBlockType("bullet")}>
        <List className="size-4" aria-hidden="true" />
      </Button>
      <Button label="Numbered list" active={block === "number"} onClick={() => setBlockType("number")}>
        <ListOrdered className="size-4" aria-hidden="true" />
      </Button>
      <Button label="Quote" active={block === "quote"} onClick={() => setBlockType("quote")}>
        <Quote className="size-4" aria-hidden="true" />
      </Button>

      <Divider />

      <Button label={link ? "Remove link" : "Add link"} active={link} onClick={toggleLink}>
        <Link2 className="size-4" aria-hidden="true" />
      </Button>
      <Button label="Add a picture" onClick={() => setPicking(true)}>
        <ImageIcon className="size-4" aria-hidden="true" />
      </Button>
      <Button label="Add a video" onClick={insertVideo}>
        <Video className="size-4" aria-hidden="true" />
      </Button>

      <Divider />

      <Button
        label="Undo"
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Undo2 className="size-4" aria-hidden="true" />
      </Button>
      <Button
        label="Redo"
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Redo2 className="size-4" aria-hidden="true" />
      </Button>

      {picking && (
        <ImageDialog onChoose={insertImage} onClose={() => setPicking(false)} />
      )}
    </div>
  );
}

const Divider = () => (
  <span className="mx-1 h-5 w-px bg-gray-15" aria-hidden="true" />
);

function Button({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      // Never a submit button: this sits inside the document form, and a bare
      // button in a form submits it — pressing Bold would save the article.
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex size-8 items-center justify-center rounded-md transition-colors duration-300 disabled:pointer-events-none disabled:opacity-30 ${
        active
          ? "bg-blue text-white"
          : "text-gray hover:bg-white hover:text-blue"
      }`}
    >
      {children}
    </button>
  );
}
