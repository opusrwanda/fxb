"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, Upload, X } from "lucide-react";

import { DropVeil, useFileDrop } from "../file-drop";

import type { PickerOption } from "@/staff/ui/media-picker";

/** What may be inserted into an article, by the button and by a drop. */
const PICTURES =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml";

/**
 * Choosing a picture to put in an article.
 *
 * The same job as `MediaPicker`, from a different place: that one is a form
 * field and writes an id into a hidden input, this one hands a file back to
 * the editor to insert at the cursor. They deliberately look identical — grid
 * of pictures, search, Upload — because to whoever is using the panel it is
 * the same act, and a second, differently-shaped dialog for it would be a
 * second thing to learn.
 *
 * They are not shared as one component because almost nothing behind the
 * markup is: the field version manages selected state and a native `<select>`
 * fallback and takes its options as props; this one has no fallback (there is
 * no editor at all without JavaScript), fetches its own options, and returns a
 * value instead of holding one.
 */

/** The smallest rendition, or the original. Same order as the field picker. */
function preview(option: PickerOption) {
  const sizes = option.thumb ?? {};
  return sizes.thumbnail?.url ?? sizes.card?.url ?? sizes.wide?.url ?? option.url;
}

export function ImageDialog({
  onChoose,
  onClose,
}: {
  onChoose: (option: PickerOption) => void;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<PickerOption[] | null>(null);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetched on open rather than held by the page — see the GET handler.
  useEffect(() => {
    let live = true;
    fetch("/staff/api/media")
      .then((response) => response.json())
      .then((result) => {
        if (!live) return;
        if (result.ok) setOptions(result.media);
        else setError(result.error ?? "The library could not be loaded.");
      })
      .catch(() => live && setError("The library could not be loaded."));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Chosen the moment it lands, which is the only reason somebody opened this
  // dialog and then reached for Upload.
  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/staff/api/media", { method: "POST", body });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          setError(result?.error ?? "The upload failed. Try again.");
          return;
        }
        onChoose(result.media as PickerOption);
      } catch {
        setError("The upload could not reach the server. Check the connection and try again.");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [onChoose],
  );

  const { dragging, handlers: dropHandlers } = useFileDrop({
    accept: PICTURES,
    onFile: (file) => void upload(file),
    onReject: (file) => setError(`${file.name} is not a picture.`),
  });

  const needle = query.trim().toLowerCase();
  // Only pictures. A PDF has no pixels and would insert as a broken frame.
  const pictures = (options ?? []).filter((option) =>
    option.mimeType.startsWith("image/"),
  );
  const shown = needle
    ? pictures.filter(
        (option) =>
          option.filename.toLowerCase().includes(needle) ||
          option.alt.toLowerCase().includes(needle),
      )
    : pictures;

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-gray/50 p-0 sm:items-center sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add a picture"
        {...dropHandlers}
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-t-card bg-white sm:rounded-card"
      >
        {dragging && <DropVeil label="Drop the picture to upload it" />}
        <div className="flex items-center gap-4 border-b border-gray-15 p-5">
          <label className="relative flex flex-1 items-center">
            <Search className="pointer-events-none absolute left-4 size-4 text-gray-80" aria-hidden="true" />
            <span className="sr-only">Search the library</span>
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by filename or description"
              className="w-full rounded-full border border-gray-15 bg-white py-2.5 pr-4 pl-11 text-[15px] text-gray outline-none focus:border-blue"
            />
          </label>

          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            accept={PICTURES}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-blue px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-90 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-gray transition-colors duration-300 hover:bg-blue-08 hover:text-blue"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <p role="alert" className="border-b border-gray-15 bg-blue-08 px-5 py-3 text-sm text-gray">
            <strong className="font-semibold text-blue">Not added.</strong> {error}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {options === null ? (
            <p className="py-16 text-center text-[15px] text-gray">Loading the library…</p>
          ) : shown.length === 0 ? (
            <p className="py-16 text-center text-[15px] text-gray">
              {needle ? `Nothing matches “${query}”.` : "No pictures yet. Upload the first one."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => onChoose(option)}
                    className="w-full overflow-hidden rounded-card border border-gray-15 text-left transition-colors duration-300 hover:border-blue"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview(option)}
                      alt=""
                      loading="lazy"
                      className="aspect-4/3 w-full bg-white object-contain p-2"
                    />
                    <span className="block p-3">
                      <span className="block truncate text-sm font-medium text-blue">
                        {option.filename}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-gray">
                        {option.alt || "No description"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
