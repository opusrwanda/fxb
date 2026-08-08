"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FileText, Search, X } from "lucide-react";

/** Never changes, so the store never notifies. */
const noop = () => () => {};

export type PickerOption = {
  id: number;
  filename: string;
  alt: string;
  mimeType: string;
  url: string;
  /** The generated renditions, keyed by name. Shapes vary by upload. */
  thumb: Record<string, { url?: string }> | null;
};

/**
 * The smallest rendition there is, or the original.
 *
 * The keys are not consistent across the library — a photograph has `card` and
 * `wide`, a partner logo has only `thumbnail` — so this asks for the ones it
 * knows in order of size rather than assuming any of them exist. Falling
 * through to the original is correct and not a failure: a 2400px file in a
 * 150px box is wasteful, not broken, and it is better than an empty tile.
 */
function preview(option: PickerOption) {
  const sizes = option.thumb ?? {};
  return (
    sizes.thumbnail?.url ?? sizes.card?.url ?? sizes.wide?.url ?? option.url
  );
}

/**
 * Choosing a file by looking at it.
 *
 * This was a `<select>` of filenames. `fxbvillage-tlf-09.jpg` and
 * `fxbvillage-tlf-11.jpg` are a tailor at his machine and a young man running
 * an airtime kiosk, and nothing in either name says so — so picking the
 * photograph for a programme meant remembering which number was which, or
 * saving and looking at the site. The alt text was appended to help, and it
 * helps, but a list of sentences is still not a picture.
 *
 * PROGRESSIVE, NOT REPLACED
 *
 * The panel's controls are plain HTML in a plain form on purpose: it has to
 * keep working on a bad connection in a district office, and nothing about
 * saving may depend on JavaScript. So the native `<select>` is what renders on
 * the server and what stands if the bundle never arrives — the grid takes over
 * only once this has hydrated. Both write the same field, so a form submitted
 * from either one saves identically.
 *
 * Documents get the same dialog without the pictures. A PDF has no thumbnail,
 * and a grid of identical file glyphs would be a list of filenames again with
 * more spacing — so those are listed as rows.
 */
export function MediaPicker({
  name,
  id,
  describedBy,
  value,
  options,
  kind,
}: {
  name: string;
  id: string;
  describedBy?: string;
  value: number | null;
  options: PickerOption[];
  kind: "image" | "document";
}) {
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
  const [selected, setSelected] = useState<number | null>(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    openerRef.current?.focus();
  }, []);

  // Escape closes, and the page behind does not scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  // Before hydration — and for good, if the bundle never lands — the native
  // control is the control.
  if (!mounted) {
    return (
      <select
        id={id}
        name={name}
        aria-describedby={describedBy}
        defaultValue={value ? String(value) : ""}
        className="w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray outline-none focus:border-blue"
      >
        <option value="">— none —</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.filename}
            {option.alt ? ` — ${option.alt.slice(0, 60)}` : ""}
          </option>
        ))}
      </select>
    );
  }

  const chosen = options.find((option) => option.id === selected) ?? null;
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? options.filter(
        (option) =>
          option.filename.toLowerCase().includes(needle) ||
          option.alt.toLowerCase().includes(needle)
      )
    : options;

  return (
    <>
      <input type="hidden" name={name} value={selected ?? ""} />

      <div className="flex items-center gap-4">
        <button
          ref={openerRef}
          id={id}
          type="button"
          onClick={() => setOpen(true)}
          aria-describedby={describedBy}
          aria-haspopup="dialog"
          className="flex flex-1 items-center gap-4 rounded-card border border-gray-15 bg-white p-3 text-left transition-colors duration-300 hover:border-blue"
        >
          {chosen ? (
            kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview(chosen)}
                alt=""
                className="size-14 shrink-0 rounded-[14px] bg-blue-08 object-contain"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-blue-08">
                <FileText className="size-6 text-blue" aria-hidden="true" />
              </span>
            )
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-[14px] border border-dashed border-gray-15 text-xs text-gray-80">
              None
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium text-blue">
              {chosen ? chosen.filename : "Choose a file"}
            </span>
            <span className="block truncate text-sm text-gray">
              {chosen?.alt || (chosen ? "No description" : "Nothing selected")}
            </span>
          </span>
        </button>

        {chosen && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="shrink-0 text-sm text-gray underline underline-offset-4 transition-colors duration-300 hover:text-blue"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-gray/50 p-0 sm:items-center sm:p-8"
          // A click on the backdrop closes; a click inside must not, which is
          // why this checks the target rather than just listening.
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={kind === "image" ? "Choose a photograph" : "Choose a document"}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-t-card bg-white sm:rounded-card"
          >
            <div className="flex items-center gap-4 border-b border-gray-15 p-5">
              <label className="relative flex flex-1 items-center">
                <Search
                  className="pointer-events-none absolute left-4 size-4 text-gray-80"
                  aria-hidden="true"
                />
                <span className="sr-only">Search the library</span>
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by filename or description"
                  className="w-full rounded-full border border-gray-15 bg-white py-2.5 pl-11 pr-4 text-[15px] text-gray outline-none focus:border-blue"
                />
              </label>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-gray transition-colors duration-300 hover:bg-blue-08 hover:text-blue"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {shown.length === 0 ? (
                <p className="py-16 text-center text-[15px] text-gray">
                  Nothing matches “{query}”.
                </p>
              ) : kind === "image" ? (
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {shown.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(option.id);
                          close();
                        }}
                        aria-pressed={option.id === selected}
                        className={`w-full overflow-hidden rounded-card border text-left transition-colors duration-300 ${
                          option.id === selected
                            ? "border-blue ring-2 ring-blue"
                            : "border-gray-15 hover:border-blue"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview(option)}
                          alt=""
                          loading="lazy"
                          // `contain`, not `cover`. Half this library is partner logos, and a
                          // wide logo cropped to 4:3 shows the middle three letters of a
                          // wordmark — which is the guessing this replaced.
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
              ) : (
                <ul className="flex flex-col">
                  {shown.map((option) => (
                    <li key={option.id} className="border-b border-gray-15 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(option.id);
                          close();
                        }}
                        aria-pressed={option.id === selected}
                        className={`flex w-full items-center gap-4 p-4 text-left transition-colors duration-300 hover:bg-blue-08 ${
                          option.id === selected ? "bg-blue-08" : ""
                        }`}
                      >
                        <FileText className="size-5 shrink-0 text-blue" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-medium text-blue">
                            {option.filename}
                          </span>
                          <span className="block truncate text-sm text-gray">
                            {option.alt || "No description"}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-gray-15 p-5">
              <p className="text-sm text-gray">
                {shown.length} {shown.length === 1 ? "file" : "files"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  close();
                }}
                className="text-sm text-gray underline underline-offset-4 transition-colors duration-300 hover:text-blue"
              >
                Use none
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
