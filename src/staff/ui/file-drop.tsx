"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

/**
 * Dropping a file onto something.
 *
 * Uploading meant finding a button, opening the operating system's file dialog,
 * and navigating to a folder the file was already visible in — which is a lot
 * of steps for a photograph that is sitting on the desktop behind the browser.
 * Every other place these people put a file takes a drop.
 *
 * AN ADDITION, NOT A REPLACEMENT. The button and the native `<input>` stay
 * exactly where they were: dragging is not available to somebody on a phone,
 * to somebody working from the keyboard, or to a screen reader, and a drop zone
 * that is the only way in is a control half the office cannot use.
 *
 * THE DEPTH COUNT is the whole trick. `dragenter` and `dragleave` fire for
 * every child element the pointer crosses, so a boolean set by whichever fired
 * last flickers the moment the pointer passes over a tile inside the zone.
 * Counting up and down and only clearing at zero is what makes it steady.
 *
 * `preventDefault` on dragover is not optional: without it the browser's own
 * handler wins and dropping a file navigates the tab to it, losing whatever
 * was on the page.
 */
export function useFileDrop({
  accept,
  onFile,
  onReject,
}: {
  /** A comma-separated list, exactly as an `accept` attribute carries. */
  accept: string;
  onFile: (file: File) => void;
  /** Called instead when the file is the wrong sort for this zone. */
  onReject?: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const stop = useCallback(() => {
    depth.current = 0;
    setDragging(false);
  }, []);

  const allowed = (file: File) => {
    const types = accept
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean);

    if (types.length === 0) return true;

    return types.some((type) =>
      type.startsWith(".")
        ? file.name.toLowerCase().endsWith(type.toLowerCase())
        : type.endsWith("/*")
          ? file.type.startsWith(type.slice(0, -1))
          : file.type === type,
    );
  };

  /**
   * Files only.
   *
   * Dragging selected text or a link across the panel also fires these events,
   * and lighting the whole dialog up for a dragged word would be noise. The
   * `types` list is the browser saying what is on the clipboard.
   */
  const isFiles = (event: React.DragEvent) =>
    event.dataTransfer.types.includes("Files");

  const handlers = {
    onDragEnter(event: React.DragEvent) {
      if (!isFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver(event: React.DragEvent) {
      if (!isFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    onDragLeave(event: React.DragEvent) {
      if (!isFiles(event)) return;
      depth.current -= 1;
      if (depth.current <= 0) stop();
    },
    onDrop(event: React.DragEvent) {
      if (!isFiles(event)) return;
      event.preventDefault();
      stop();

      // One file. The rest of the panel takes one at a time — a picker chooses
      // a single photograph, a form field holds a single upload — so quietly
      // taking the first of five would be worse than the person seeing that
      // only one arrived.
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      if (!allowed(file)) {
        onReject?.(file);
        return;
      }
      onFile(file);
    },
  };

  return { dragging, handlers };
}

/**
 * What a dialog shows while a file is over it.
 *
 * `pointer-events-none` is load-bearing rather than tidy: a veil that takes
 * the pointer swallows the drop it exists to advertise, and the dialog under
 * it never sees `dragleave` either — so the veil would come up and stay up.
 */
export function DropVeil({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-t-card border-2 border-dashed border-blue bg-blue-08/95 sm:rounded-card">
      <p className="flex items-center gap-3 text-lg font-semibold text-blue">
        <UploadCloud className="size-6" aria-hidden="true" />
        {label}
      </p>
    </div>
  );
}

/**
 * The file field on the Media form, as somewhere to drop.
 *
 * The `<input type="file">` is still the control: it is what the form posts,
 * it is what the browser validates, and it is what a keyboard reaches. It is
 * hidden and driven by the label beside it, which works without JavaScript —
 * a label opens the file dialog on its own. So with the bundle gone this is
 * still a working upload field, and the drop is what hydration adds.
 */
export function FileDrop({
  id,
  name,
  accept,
  required,
  describedBy,
}: {
  id: string;
  name: string;
  accept: string;
  required?: boolean;
  describedBy?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);

  /**
   * Put the dropped file into the input.
   *
   * Through a `DataTransfer`, because `input.files` takes a `FileList` and
   * there is no other way to build one. This is what keeps the form a plain
   * form — the file posts with everything else on submit rather than going up
   * on its own and needing an id threaded back into the page.
   */
  const take = useCallback((file: File) => {
    const input = inputRef.current;
    if (input) {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
    }
    setChosen(file.name);
    setRejected(null);
  }, []);

  const { dragging, handlers } = useFileDrop({
    accept,
    onFile: take,
    onReject: (file) =>
      setRejected(
        `${file.name} is not a sort of file this library takes. Photographs and PDFs only.`,
      ),
  });

  return (
    <div
      {...handlers}
      className={`flex flex-col items-center gap-3 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors duration-300 ${
        dragging ? "border-blue bg-blue-08" : "border-gray-15 bg-white"
      }`}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        required={required}
        aria-describedby={describedBy}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setChosen(file ? file.name : null);
          setRejected(null);
        }}
      />

      <UploadCloud
        className={`size-7 ${dragging ? "text-blue" : "text-gray-80"}`}
        aria-hidden="true"
      />

      <p className="text-[15px] leading-relaxed text-gray">
        {chosen ? (
          <span className="font-semibold text-blue">{chosen}</span>
        ) : (
          "Drag a file here, or choose one."
        )}
      </p>

      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-center rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
      >
        {chosen ? "Choose a different file" : "Choose a file"}
      </label>

      {rejected && (
        <p role="alert" className="text-[13px] leading-relaxed text-gray-80">
          {rejected}
        </p>
      )}
    </div>
  );
}
