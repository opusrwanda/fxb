"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type NodeKey,
} from "lexical";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  WrapText,
} from "lucide-react";

import {
  $isImageNode,
  clampImageWidth,
  MAX_IMAGE_WIDTH,
  MIN_IMAGE_WIDTH,
  type ImageAlign,
  type ImageLayout,
} from "./nodes";

/**
 * A picture in the editor, with its handles.
 *
 * Everything here is about placing one photograph: click to select it, drag a
 * corner to resize, and a bar of controls for which side it sits on, whether
 * text flows around it, and where in the article it belongs.
 *
 * THE CONTROLS APPEAR ON SELECTION AND NOT ON HOVER. A bar that appears under
 * the pointer covers the paragraph somebody is reading on the way past, and it
 * cannot be reached from the keyboard. Selection is a state you enter
 * deliberately and leave deliberately, which is the right shape for controls
 * that change what the page looks like.
 *
 * Resizing is in pixels and stored as a percentage — see `nodes.tsx`. The
 * conversion happens against the editor's own content width, so dragging to
 * "half the column" stores 50 and stays half the column on a phone.
 */

const HANDLES = [
  { corner: "nw", className: "-top-1.5 -left-1.5 cursor-nwse-resize" },
  { corner: "ne", className: "-top-1.5 -right-1.5 cursor-nesw-resize" },
  { corner: "sw", className: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
  { corner: "se", className: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
] as const;

export function EditorImage({
  nodeKey,
  src,
  alt,
  layout,
}: {
  nodeKey: NodeKey;
  src: string;
  alt: string;
  layout: ImageLayout;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelected] = useLexicalNodeSelection(nodeKey);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /**
   * The width mid-drag, before it is committed.
   *
   * Held in React state rather than written to the node on every mouse move:
   * one Lexical update per pixel would put a hundred entries in the undo
   * history for a single drag, so Ctrl+Z after resizing would walk back
   * through every intermediate width instead of undoing the resize.
   */
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  /**
   * A drag has just finished and its click has not arrived yet.
   *
   * Releasing the mouse after a resize also fires a `click`, and by then the
   * pointer is wherever the drag ended — usually over a paragraph rather than
   * over the picture. Lexical reads that as "the writer clicked into the text"
   * and drops the node selection, so the handles vanished the instant a resize
   * finished and every further adjustment needed the picture selecting again.
   *
   * This swallows exactly that one click.
   */
  const justResized = useRef(false);

  const update = useCallback(
    (next: Partial<ImageLayout>) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) node.setLayout(next);
      });
    },
    [editor, nodeKey],
  );

  /** Take it out of the article. */
  const remove = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) node.remove();
    });
  }, [editor, nodeKey]);

  /**
   * Move the picture one block up or down.
   *
   * Alongside dragging, not instead of it. Dragging is what most people reach
   * for and it needs a mouse and a steady hand; this does the same job from
   * the keyboard, and is the only way to move a picture that is currently
   * floated to the edge of a paragraph you cannot easily drop below.
   */
  const move = useCallback(
    (direction: -1 | 1) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!$isImageNode(node)) return;

        const sibling =
          direction === -1 ? node.getPreviousSibling() : node.getNextSibling();
        if (!sibling) return;

        if (direction === -1) sibling.insertBefore(node);
        else sibling.insertAfter(node);
      });
    },
    [editor, nodeKey],
  );

  /* Selecting, and deleting what is selected. */
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (event) => {
          // The click that ends a resize. Consumed so the selection survives
          // it — see `justResized`.
          if (justResized.current) {
            justResized.current = false;
            return true;
          }

          // Only clicks that landed on this picture. The command fires for
          // every click in the editor, so without this every image in the
          // article would select itself whenever anybody clicked anywhere.
          if (!wrapperRef.current?.contains(event.target as Node)) return false;

          // A click on a resize handle is the start of a drag, not a
          // selection change — and clearing the selection here would take the
          // handles away from under the pointer mid-drag.
          if ((event.target as HTMLElement).dataset.resizeHandle) return true;

          clearSelected();
          setSelected(true);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      ...[KEY_DELETE_COMMAND, KEY_BACKSPACE_COMMAND].map((command) =>
        editor.registerCommand<KeyboardEvent>(
          command,
          (event) => {
            const selection = $getSelection();
            if (!$isNodeSelection(selection) || !isSelected) return false;
            // Without this the browser also treats Backspace as "go back".
            event.preventDefault();
            remove();
            return true;
          },
          COMMAND_PRIORITY_LOW,
        ),
      ),
    );
  }, [editor, isSelected, clearSelected, setSelected, remove]);

  /**
   * Dragging a corner.
   *
   * Bound on the window rather than on the handle, because a drag that is
   * faster than React re-renders leaves the pointer outside the six-pixel
   * handle it started on — and a `mousemove` listener on the handle stops
   * firing the moment that happens, freezing the resize halfway.
   */
  const startResize = (event: React.PointerEvent, corner: string) => {
    event.preventDefault();
    event.stopPropagation();

    const wrapper = wrapperRef.current;
    const column = wrapper?.closest<HTMLElement>("[data-editor-content]");
    if (!wrapper || !column) return;

    const columnWidth = column.getBoundingClientRect().width;
    const startX = event.clientX;
    const startWidth = wrapper.getBoundingClientRect().width;
    // Dragging the left-hand corners outward means moving the pointer left,
    // so the sign of the movement has to flip for them or the picture shrinks
    // when it should grow.
    const direction = corner.endsWith("w") ? -1 : 1;

    const onMove = (move: PointerEvent) => {
      const pixels = startWidth + (move.clientX - startX) * direction;
      setDragWidth(clampImageWidth((pixels / columnWidth) * 100));
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);

      justResized.current = true;
      // A release that moved no pixels may not produce a click at all, and a
      // flag left set would then eat the next real one. Cleared on the next
      // turn, by which time the click has been and gone.
      setTimeout(() => {
        justResized.current = false;
      }, 250);

      // One update, at the end — see `dragWidth` above.
      setDragWidth((finalWidth) => {
        if (finalWidth !== null) update({ width: finalWidth });
        return null;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const width = dragWidth ?? layout.width;
  const floating = layout.wrap && layout.align !== "center";

  return (
    <div
      ref={wrapperRef}
      // Draggable so it can be moved through the article — the drop is handled
      // by `ImageDragPlugin`, which is the half that knows where the cursor is.
      draggable={isSelected}
      onDragStart={(event) => {
        event.dataTransfer.setData("application/x-fxb-image", nodeKey);
        event.dataTransfer.effectAllowed = "move";
      }}
      className={`relative ${isSelected ? "z-10" : ""}`}
    >
      <figure
        className={`overflow-hidden rounded-card border transition-colors duration-200 ${
          isSelected ? "border-blue ring-2 ring-blue/30" : "border-gray-15"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="block w-full select-none" draggable={false} />
        <figcaption className="border-t border-gray-15 bg-blue-08 px-4 py-2 text-[13px] text-gray">
          {alt || (
            // Said plainly rather than left blank. A missing description is
            // invisible on the page and total for somebody using a screen
            // reader, so the editor is the only place it can be noticed.
            <span className="text-gray-80">
              No description — add one on the Media page.
            </span>
          )}
        </figcaption>
      </figure>

      {isSelected && (
        <>
          {HANDLES.map((handle) => (
            <span
              key={handle.corner}
              data-resize-handle={handle.corner}
              onPointerDown={(event) => startResize(event, handle.corner)}
              className={`absolute size-3 rounded-full border-2 border-white bg-blue ${handle.className}`}
              aria-hidden="true"
            />
          ))}

          {/* The width, while it is being dragged. A percentage rather than
              pixels because a percentage is what is stored and what will still
              be true on a phone. */}
          {dragWidth !== null && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
              {dragWidth}%
            </span>
          )}

          <Controls
            layout={layout}
            floating={floating}
            onAlign={(align) => update({ align })}
            onWrap={(wrap) => update({ wrap })}
            onWidth={(value) => update({ width: value })}
            onMove={move}
            onRemove={remove}
          />
        </>
      )}

      <span className="sr-only">
        {width === null ? "Full width" : `${width}% wide`},{" "}
        {layout.align === "center" ? "centred" : `aligned ${layout.align}`}
        {floating ? ", text wraps around it" : ""}
      </span>
    </div>
  );
}

/**
 * The bar above a selected picture.
 *
 * Positioned above rather than below because a picture is usually followed by
 * the paragraph it illustrates, and a bar sitting over that paragraph hides
 * the thing the author is comparing it against.
 */
function Controls({
  layout,
  floating,
  onAlign,
  onWrap,
  onWidth,
  onMove,
  onRemove,
}: {
  layout: ImageLayout;
  floating: boolean;
  onAlign: (align: ImageAlign) => void;
  onWrap: (wrap: boolean) => void;
  onWidth: (width: number | null) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div
      // `contentEditable={false}` and the mousedown guard together stop the
      // editor treating a click on these buttons as a click into the text,
      // which would drop the selection and take the bar away before the
      // button's own handler ran.
      contentEditable={false}
      onMouseDown={(event) => event.preventDefault()}
      /**
       * `w-max`, and it is load-bearing.
       *
       * An absolutely positioned box shrinks to fit but is still capped by the
       * width of its containing block — which here is the picture. Shrink a
       * picture to a third of the column and the bar folded onto three rows and
       * covered the very thing it was there to adjust. `w-max` lets it keep its
       * own width and hang past the edge of a narrow picture, which is what
       * every toolbar of this kind does.
       */
      className="absolute -top-12 left-0 z-20 flex w-max items-center gap-1 rounded-full border border-gray-15 bg-white px-2 py-1.5 shadow-lg"
    >
      <Button
        label="Align left"
        active={layout.align === "left"}
        onClick={() => onAlign("left")}
      >
        <AlignLeft className="size-4" aria-hidden="true" />
      </Button>
      <Button
        label="Centre"
        active={layout.align === "center"}
        onClick={() => {
          // Centring and wrapping cannot both be true — there is no side for
          // text to run down. Choosing centre turns wrapping off rather than
          // leaving a setting that silently does nothing.
          onAlign("center");
          if (layout.wrap) onWrap(false);
        }}
      >
        <AlignCenter className="size-4" aria-hidden="true" />
      </Button>
      <Button
        label="Align right"
        active={layout.align === "right"}
        onClick={() => onAlign("right")}
      >
        <AlignRight className="size-4" aria-hidden="true" />
      </Button>

      <span className="mx-1 h-5 w-px bg-gray-15" aria-hidden="true" />

      <Button
        label={floating ? "Stop text wrapping around it" : "Wrap text around it"}
        active={floating}
        disabled={layout.align === "center"}
        onClick={() => onWrap(!layout.wrap)}
      >
        <WrapText className="size-4" aria-hidden="true" />
      </Button>

      <span className="mx-1 h-5 w-px bg-gray-15" aria-hidden="true" />

      {/* Three sizes worth having as one click. Dragging covers everything
          between them; these cover the three anybody actually asks for. */}
      {(
        [
          { label: "Small", value: 33 },
          { label: "Half", value: 50 },
          { label: "Full width", value: null },
        ] as const
      ).map((size) => (
        <button
          key={size.label}
          type="button"
          onClick={() => onWidth(size.value)}
          aria-pressed={layout.width === size.value}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${
            layout.width === size.value
              ? "bg-blue text-white"
              : "text-gray hover:bg-blue-08 hover:text-blue"
          }`}
        >
          {size.label}
        </button>
      ))}

      <span className="mx-1 h-5 w-px bg-gray-15" aria-hidden="true" />

      <Button label="Move up" onClick={() => onMove(-1)}>
        <ChevronUp className="size-4" aria-hidden="true" />
      </Button>
      <Button label="Move down" onClick={() => onMove(1)}>
        <ChevronDown className="size-4" aria-hidden="true" />
      </Button>

      <span className="mx-1 h-5 w-px bg-gray-15" aria-hidden="true" />

      <Button label="Remove picture" onClick={onRemove}>
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

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
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-full transition-colors duration-200 ${
        active ? "bg-blue text-white" : "text-gray hover:bg-blue-08 hover:text-blue"
      } disabled:pointer-events-none disabled:opacity-35`}
    >
      {children}
    </button>
  );
}

export { MIN_IMAGE_WIDTH, MAX_IMAGE_WIDTH };
