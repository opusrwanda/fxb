import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, Send } from "lucide-react";

import { campaigns, db } from "@/staff/db";
import { subscriberCounts } from "@/staff/mail/subscribers";
import { mailConfig } from "@/staff/mail/transport";

export const metadata = { title: "Email campaigns" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function CampaignsPage() {
  const [rows, counts] = await Promise.all([
    db.select().from(campaigns).orderBy(desc(campaigns.createdAt)),
    subscriberCounts(),
  ]);

  const configured = mailConfig() !== null;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.14em] text-gray-80 uppercase">
              Mailing list
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px]">
            Email campaigns
          </h1>
          <p className="max-w-[58ch] text-base leading-relaxed text-gray">
            Write a newsletter and send it to the {counts.subscribed}{" "}
            {counts.subscribed === 1 ? "person" : "people"} on the list.
          </p>
        </div>

        <Link
          href="/staff/campaigns/new"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          New campaign
        </Link>
      </header>

      {!configured && (
        <div className="mt-8 rounded-card border border-gray-15 bg-blue-08 px-6 py-5">
          <p className="text-[15px] leading-relaxed text-gray">
            <strong className="font-semibold text-blue">
              Email is not connected yet.
            </strong>{" "}
            Campaigns can be written and previewed, but nothing can be sent until
            the SMTP settings are added — see <code>docs/email.md</code>.
          </p>
        </div>
      )}

      <div className="mt-10">
        {rows.length > 0 ? (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-15">
                {["Subject", "Status", "Sent", "Date"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="py-3 pr-6 text-[11px] font-semibold tracking-[0.14em] text-gray-80 uppercase"
                  >
                    {h}
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
                  <td className="relative py-4 pr-6">
                    <Link
                      href={`/staff/campaigns/${row.id}`}
                      className="text-[15px] font-semibold text-blue after:absolute after:inset-0"
                    >
                      {row.subject}
                    </Link>
                  </td>
                  <td className="py-4 pr-6">
                    {row.status === "sent" ? (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-green">
                        <Send className="size-3.5" aria-hidden="true" />
                        Sent
                      </span>
                    ) : row.status === "sending" ? (
                      <span className="text-xs font-semibold text-blue">
                        Partly sent
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-80">Draft</span>
                    )}
                  </td>
                  <td className="py-4 pr-6 text-sm text-gray-80">
                    {row.sentCount > 0 ? row.sentCount : "—"}
                    {row.failedCount > 0 && (
                      <span className="ml-2 text-gray-80">
                        ({row.failedCount} failed)
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-sm text-gray-80">
                    {row.sentAt
                      ? dateFormat.format(row.sentAt)
                      : dateFormat.format(row.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="rounded-[20px_20px_0_20px] border border-gray-15 bg-blue-08 p-10">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
              No campaigns yet
            </h2>
            <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-gray">
              A campaign is one email to the mailing list. Write it, send a test
              to yourself, then send it to everyone.
            </p>
            <Link
              href="/staff/campaigns/new"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
            >
              <Plus className="size-4" aria-hidden="true" />
              New campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
