"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Search, Upload, X } from "lucide-react";

import { DropVeil, useFileDrop } from "../file-drop";

import type { PickerOption } from "@/staff/ui/media-picker";

const DOCUMENTS = "application/pdf";

/**
 * "sugira-muryango-success-stories-3f9a1c2b.pdf" → "Sugira muryango success
 * stories". A starting point for the title, not the title: the upload adds a
 * hash to keep filenames unique, and nobody should have to delete it by hand.
 */
function titleFrom(option: PickerOption): string {
  if (option.alt.trim()) return option.alt.trim();
  const words = option.filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-[0-9a-f]{8}$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Choose a document for the article, or upload one.
 *
 * The picture dialog's shape — search, upload, the library underneath — with
 * one thing added: the words the reader will click. A picture is its own
 * label; a file is "report-final-v3.pdf" until somebody says what it is, and
 * the place to say so is here, before it is on the page.
 *
 * PDF only, because that is what the library accepts and what a browser opens
 * in a tab. A Word file would download instead, which is not what "opens in a
 * new tab" promised.
 */
export function DocumentDialog({
  onChoose,
  onClose,
}: {
  onChoose: (document: { url: string; title: string; mediaId: number }) => void;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<PickerOption[] | null>(null);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const choose = useCallback(
    (option: PickerOption) =>
      onChoose({
        url: option.url,
        title: title.trim() || titleFrom(option),
        mediaId: option.id,
      }),
    [onChoose, title],
  );

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
        choose(result.media as PickerOption);
      } catch {
        setError("The upload could not reach the server. Check the connection and try again.");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [choose],
  );

  const { dragging, handlers: dropHandlers } = useFileDrop({
    accept: DOCUMENTS,
    onFile: (file) => void upload(file),
    onReject: (file) => setError(`${file.name} is not a PDF.`),
  });

  const needle = query.trim().toLowerCase();
  const documents = (options ?? []).filter(
    (option) => option.mimeType === "application/pdf",
  );
  const shown = needle
    ? documents.filter(
        (option) =>
          option.filename.toLowerCase().includes(needle) ||
          option.alt.toLowerCase().includes(needle),
      )
    : documents;

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
        aria-labelledby="document-dialog-title"
        {...dropHandlers}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-card bg-white sm:rounded-card"
      >
        {dragging && <DropVeil label="Drop the PDF to upload it" />}

        <div className="flex items-start justify-between gap-4 border-b border-gray-15 p-5">
          <div>
            <h2
              id="document-dialog-title"
              className="text-xl font-bold tracking-[-0.02em] text-blue"
            >
              Add a document
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray">
              A PDF, shown on the page as a document readers can click to open
              in a new tab.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-gray transition-colors duration-300 hover:bg-blue-08 hover:text-blue"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-15 p-5">
          <label htmlFor="document-title" className="text-[15px] font-medium text-blue">
            Title <span className="font-normal text-gray-80">(optional)</span>
          </label>
          <p id="document-title-help" className="text-[13px] leading-relaxed text-gray-80">
            The words readers will click. Type it before choosing the file;
            left empty, the file&rsquo;s own name is used.
          </p>
          <input
            id="document-title"
            type="text"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-describedby="document-title-help"
            placeholder="e.g. Sugira Muryango success stories"
            className="w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray outline-none focus:border-blue"
          />
        </div>

        <div className="flex items-center gap-4 border-b border-gray-15 p-5">
          <label className="relative flex flex-1 items-center">
            <Search className="pointer-events-none absolute left-4 size-4 text-gray-80" aria-hidden="true" />
            <span className="sr-only">Search the library</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents already uploaded"
              className="w-full rounded-full border border-gray-15 bg-white py-2.5 pr-4 pl-11 text-[15px] text-gray outline-none focus:border-blue"
            />
          </label>

          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            accept={DOCUMENTS}
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
            {uploading ? "Uploading…" : "Upload a PDF"}
          </button>
        </div>

        {error && (
          <p role="alert" className="border-b border-gray-15 bg-blue-08 px-5 py-3 text-sm text-gray">
            <strong className="font-semibold text-blue">Not added.</strong> {error}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {options === null ? (
            <p className="py-12 text-center text-[15px] text-gray">Loading the library…</p>
          ) : shown.length === 0 ? (
            <p className="py-12 text-center text-[15px] text-gray">
              {needle ? `Nothing matches “${query}”.` : "No documents yet. Upload the first one."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {shown.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => choose(option)}
                    className="flex w-full items-center gap-4 rounded-card border border-gray-15 px-4 py-3 text-left transition-colors duration-300 hover:border-blue"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-08">
                      <FileText className="size-5 text-blue" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-blue">
                        {titleFrom(option)}
                      </span>
                      <span className="block truncate text-xs text-gray">
                        {option.filename}
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
