import Image from "next/image";
import Link from "next/link";

import type { Cell, Row } from "../queries/list";

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
  href,
}: {
  columns: string[];
  rows: Row[];
  /** Where a row leads, given its id. */
  href: (id: number) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-15">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="py-3 pr-6 text-[11px] font-semibold tracking-[0.14em] text-gray-80 uppercase"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="group border-b border-gray-15 transition-colors duration-300 hover:bg-blue-08"
            >
              {row.cells.map((cell, index) => (
                <td
                  key={index}
                  className={`py-4 pr-6 align-middle ${index === 0 ? "relative" : ""}`}
                >
                  {index === 0 ? (
                    <>
                      <Link
                        href={href(row.id)}
                        className="after:absolute after:inset-0"
                      >
                        <CellValue cell={cell} />
                      </Link>
                    </>
                  ) : (
                    <CellValue cell={cell} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One date format for the panel, fixed to UTC so it cannot shift on render. */
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

    case "status":
      // Green for live, outlined for not. Colour alone would leave the two
      // indistinguishable to anyone who cannot separate them, so the word is
      // the signal and the colour reinforces it.
      return cell.value === "published" ? (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-green">
          <span className="size-1.5 rounded-full bg-green" aria-hidden="true" />
          Published
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-80">
          <span
            className="size-1.5 rounded-full border border-gray-40"
            aria-hidden="true"
          />
          Draft
        </span>
      );

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
