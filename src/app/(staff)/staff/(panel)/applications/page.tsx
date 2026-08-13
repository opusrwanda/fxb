import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";

import { requireAccess } from "@/staff/auth/guard";
import { listApplications } from "@/staff/queries/applications";
import { formatBytes } from "@/cms/content/publications";

export const metadata = { title: "Applications" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/**
 * Applications received through the website.
 *
 * A register, not an editor. Nobody types one of these and nobody corrects
 * one: it is the record of what a person sent on a particular day, and the
 * only actions on it are reading it, opening the CV and replying.
 *
 * Everything is on the page rather than behind a row — a covering note is a
 * paragraph, and hiding a paragraph behind a click to save vertical space
 * costs more than the space is worth when the list is a dozen long.
 *
 * `notified` is shown because it is the one thing that can silently go wrong.
 * The application is recorded before any email is attempted, so a row that
 * arrived while SMTP was refusing is safe here and absent from the inbox —
 * which is exactly the case somebody needs to be told about.
 */
export default async function ApplicationsPage() {
  // Read-only for an editor, which is the whole page anyway: nothing here has
  // ever been editable.
  await requireAccess("applications", "read");

  const rows = await listApplications();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.14em] text-gray-80 uppercase">
            People
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px] lg:leading-[1.1]">
          Applications
        </h1>
        <p className="max-w-[58ch] text-base leading-relaxed text-gray">
          People who have applied for a position through the website. Every
          application is kept here whether or not the notification email
          reached the office.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-[20px_20px_0_20px] border border-gray-15 bg-blue-08 p-10">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
            No applications yet
          </h2>
          <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-gray">
            They appear here as soon as somebody applies through a vacancy
            page. Post a vacancy under Opportunities and it opens for
            applications straight away.
          </p>
          <Link
            href="/staff/opportunities"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
          >
            Opportunities
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-10 flex flex-col gap-5">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-card border border-gray-15 bg-white p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-[-0.01em] text-blue">
                      {row.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray">
                      {/* A real mailto, because replying is the whole point of
                          reading this page. */}
                      <a
                        href={`mailto:${row.email}`}
                        className="underline underline-offset-4 transition-colors duration-300 hover:text-blue"
                      >
                        {row.email}
                      </a>
                      {row.phone && <> · {row.phone}</>}
                    </p>
                    <p className="mt-2 text-sm text-gray-80">
                      Applied for{" "}
                      <Link
                        href={`/get-involved/careers/${row.openingSlug}`}
                        className="inline-flex items-center gap-1 font-medium text-blue underline underline-offset-4"
                      >
                        {row.opening}
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </Link>{" "}
                      · {dateFormat.format(row.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    {row.cvFilename ? (
                      <a
                        href={`/staff/applications/${row.id}/cv`}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-blue px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
                      >
                        <Download className="size-4" aria-hidden="true" />
                        CV
                        {row.cvBytes ? ` (${formatBytes(row.cvBytes)})` : ""}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-80">No CV attached</span>
                    )}

                    {!row.notified && (
                      <span className="rounded-full bg-blue-08 px-3 py-1 text-xs font-semibold text-blue">
                        Not emailed
                      </span>
                    )}
                  </div>
                </div>

                {row.message && (
                  <p className="mt-5 border-t border-gray-15 pt-5 text-[15px] leading-relaxed whitespace-pre-line text-gray">
                    {row.message}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-gray-80">
            {rows.length} {rows.length === 1 ? "application" : "applications"} in
            total
          </p>
        </>
      )}
    </div>
  );
}
