"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Pencil, Trash2, X } from "lucide-react";

import type { Cell, Row } from "../queries/list";
import { STATUS_PILLS } from "../auth/permissions";

/**
 * The listing table.
 *
 * A real `<table>`, because this is tabular data and a grid of divs takes the
 * row and column relationships away from anybody using a screen reader — "Row
 * 3, Status, Draft" is only possible if the markup says which cell is which.
 *
 * The whole row is the link target, via an anchor stretched over the first
 * cell. One link per row rather than one per cell: a keyboard user tabs through
 * four items to leave a table of four columns otherwise, and they all go to the
 * same place.
 */
export function ListTable({
  columns,
  rows,
  basePath,
  deletable,
  singular,
  plural,
  onDelete,
}: {
  columns: string[];
  rows: Row[];
  /** Where a row opens: `/staff/news` gives `/staff/news/12`. */
  basePath: string;
  /**
   * The rows this person may delete. A row not in here gets no checkbox and no
   * bin — the server refuses those anyway, and a control that is drawn and
   * then refuses is worse than one that is not drawn.
   */
  deletable: number[];
  singular: string;
  plural: string;
  /** Deletes on the server and redirects back to this list. */
  onDelete: (ids: number[]) => Promise<void>;
}) {
  const allowed = useMemo(() => new Set(deletable), [deletable]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  /** The rows a confirmation is open for, or null when none is. */
  const [confirming, setConfirming] = useState<number[] | null>(null);
  const [working, setWorking] = useState(false);

  const canSelect = allowed.size > 0;
  const allSelected = canSelect && selected.size === allowed.size;

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  useEffect(() => {
    if (!confirming) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !working) setConfirming(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [confirming, working]);

  const nameOf = (id: number) => {
    const row = rows.find((candidate) => candidate.id === id);
    const cell = row?.cells.find((candidate) => candidate.kind === "title");
    return cell && "value" in cell ? cell.value : `this ${singular}`;
  };

  return (
    <div>
      {/* The bar for the ticked rows. It takes the place of nothing — it is
          only here while something is ticked — and it says how many, because
          "Delete selected" on a list scrolled out of sight is a button whose
          size nobody can see. */}
      {selected.size > 0 && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-card border border-gray-15 bg-blue-08 px-5 py-3"
        >
          <span className="text-[15px] font-semibold text-blue">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={() => setConfirming([...selected])}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue underline underline-offset-4 transition-colors duration-300 hover:text-green"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-gray underline underline-offset-4 transition-colors duration-300 hover:text-blue"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-15">
              {canSelect && (
                <th scope="col" className="w-10 py-3 pr-4">
                  <input
                    type="checkbox"
                    aria-label={allSelected ? "Clear selection" : `Select every ${singular}`}
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(allowed))
                    }
                    className="size-4 cursor-pointer accent-blue"
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className="py-3 pr-6 text-[11px] font-semibold tracking-[0.14em] text-gray-80 uppercase"
                >
                  {column}
                </th>
              ))}
              <th scope="col" className="py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`group border-b border-gray-15 transition-colors duration-300 hover:bg-blue-08 ${
                  selected.has(row.id) ? "bg-blue-08" : ""
                }`}
              >
                {canSelect && (
                  <td className="py-4 pr-4 align-middle">
                    {allowed.has(row.id) && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${nameOf(row.id)}`}
                        checked={selected.has(row.id)}
                        onChange={() => toggle(row.id)}
                        className="size-4 cursor-pointer accent-blue"
                      />
                    )}
                  </td>
                )}

                {row.cells.map((cell, index) => (
                  <td
                    key={index}
                    className={`py-4 pr-6 align-middle ${index === 0 ? "relative" : ""}`}
                  >
                    {index === 0 ? (
                      <Link
                        href={`${basePath}/${row.id}`}
                        className="after:absolute after:inset-0"
                      >
                        <CellValue cell={cell} />
                      </Link>
                    ) : (
                      <CellValue cell={cell} />
                    )}
                  </td>
                ))}

                {/* Edit and delete, without opening the row first. The whole
                    row was already a way in; what it lacked was a way to
                    remove something from the list it is in. */}
                <td className="py-4 align-middle">
                  <span className="flex items-center justify-end gap-1">
                    <Link
                      href={`${basePath}/${row.id}`}
                      aria-label={`Edit ${nameOf(row.id)}`}
                      title="Edit"
                      className="flex size-9 items-center justify-center rounded-full text-gray transition-colors duration-300 hover:bg-white hover:text-blue"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                    {allowed.has(row.id) && (
                      <button
                        type="button"
                        onClick={() => setConfirming([row.id])}
                        aria-label={`Delete ${nameOf(row.id)}`}
                        title="Delete"
                        className="flex size-9 items-center justify-center rounded-full text-gray transition-colors duration-300 hover:bg-white hover:text-blue"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Asked every time, for one row or fifty. A delete here is immediate
          and has no undo, and the bin sits one row away from the one that was
          meant. */}
      {confirming && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-gray/50 p-0 sm:items-center sm:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !working) setConfirming(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="list-confirm-title"
            aria-describedby="list-confirm-body"
            className="flex w-full max-w-lg flex-col rounded-t-card bg-white sm:rounded-card"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-15 p-5">
              <h2
                id="list-confirm-title"
                className="text-xl font-bold tracking-[-0.02em] text-blue"
              >
                {confirming.length === 1
                  ? `Delete “${nameOf(confirming[0])}”?`
                  : `Delete ${confirming.length} ${plural}?`}
              </h2>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={working}
                aria-label="Close"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-gray transition-colors duration-300 hover:bg-blue-08 hover:text-blue disabled:opacity-40"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <p
              id="list-confirm-body"
              className="p-5 text-[15px] leading-relaxed text-gray"
            >
              {confirming.length === 1 ? "It is" : "They are"} removed from the
              website straight away, and this cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-4 border-t border-gray-15 p-5">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirming(null)}
                disabled={working}
                className="text-sm text-gray underline underline-offset-4 transition-colors duration-300 hover:text-blue disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={working}
                onClick={async () => {
                  setWorking(true);
                  try {
                    // Redirects back to this list when it is done, so there is
                    // nothing to tidy up here on success.
                    await onDelete(confirming);
                  } finally {
                    setWorking(false);
                    setConfirming(null);
                    setSelected(new Set());
                  }
                }}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90 disabled:opacity-60"
              >
                {working ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}
                {working ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function CellValue({ cell }: { cell: Cell }) {
  switch (cell.kind) {
    case "title":
      return (
        <span className="text-[15px] font-semibold text-blue">{cell.value}</span>
      );

    case "text":
      return <span className="text-[15px] text-gray">{cell.value}</span>;

    case "muted":
      return (
        <span className="text-sm text-gray-80">
          {cell.value.length > 60 ? `${cell.value.slice(0, 60)}…` : cell.value}
        </span>
      );

    case "date":
      return (
        <time dateTime={cell.value.slice(0, 10)} className="text-sm text-gray-80">
          {formatter.format(new Date(cell.value))}
        </time>
      );

    case "pill":
      return (
        <span className="inline-flex rounded-full bg-blue-08 px-3 py-1 text-xs font-medium text-blue">
          {cell.value}
        </span>
      );

    case "status": {
      // Green for live, outlined for not. Colour alone would leave them
      // indistinguishable to anyone who cannot separate them, so the word is
      // the signal and the colour reinforces it.
      //
      // Awaiting approval is filled rather than outlined, and blue rather than
      // green. It is not a draft — nobody is still working on it — and it is
      // not on the website either. The filled dot is what makes it read as
      // something waiting on a person rather than something unfinished.
      const live = cell.value === "published";
      const waiting = cell.value === "in_review";

      return (
        <span
          className={`inline-flex items-center gap-2 text-xs font-semibold ${
            live ? "text-green" : waiting ? "text-blue" : "text-gray-80"
          }`}
        >
          <span
            className={
              live
                ? "size-1.5 rounded-full bg-green"
                : waiting
                  ? "size-1.5 rounded-full bg-blue"
                  : "size-1.5 rounded-full border border-gray-40"
            }
            aria-hidden="true"
          />
          {STATUS_PILLS[cell.value]}
        </span>
      );
    }

    case "thumb":
      return cell.url ? (
        <span className="relative block size-10 overflow-hidden rounded-md bg-blue-08">
          <Image
            src={cell.url}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </span>
      ) : (
        <span className="block size-10 rounded-md bg-blue-08" aria-hidden="true" />
      );
  }
}
