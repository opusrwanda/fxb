import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Download, Plus } from "lucide-react";

import {
  deleteSubscriber,
  listSubscribers,
  setSubscriberStatus,
  subscribe,
  subscriberCounts,
} from "@/staff/mail/subscribers";

export const metadata = { title: "Subscribers" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * The mailing list.
 *
 * Most of these rows arrive from the signup forms on the website rather than
 * being typed here, so the page is a register first and an editor second: the
 * common actions are seeing who is on it, taking somebody off, and getting a
 * copy out.
 *
 * Unsubscribing keeps the row. A deleted address can be re-imported from an old
 * spreadsheet by somebody meaning well; a row that says "unsubscribed" cannot
 * be signed up again by accident. Delete is there for a genuine erasure
 * request, which is a different thing and is labelled as one.
 */
export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; error?: string }>;
}) {
  const { added, error } = await searchParams;
  const [people, counts] = await Promise.all([listSubscribers(), subscriberCounts()]);

  async function add(formData: FormData) {
    "use server";
    const result = await subscribe({
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      source: "manual",
    });
    revalidatePath("/staff/subscribers");
    if (!result.ok) return;
  }

  async function unsubscribe(formData: FormData) {
    "use server";
    await setSubscriberStatus(Number(formData.get("id")), "unsubscribed");
    revalidatePath("/staff/subscribers");
  }

  async function resubscribe(formData: FormData) {
    "use server";
    await setSubscriberStatus(Number(formData.get("id")), "subscribed");
    revalidatePath("/staff/subscribers");
  }

  async function remove(formData: FormData) {
    "use server";
    await deleteSubscriber(Number(formData.get("id")));
    revalidatePath("/staff/subscribers");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="h-0.5 w-6 bg-green" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-[0.14em] text-gray-80 uppercase">
            Mailing list
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px]">
          Subscribers
        </h1>
        <p className="max-w-[58ch] text-base leading-relaxed text-gray">
          Everyone who has asked to receive the newsletter. Most sign up through
          the forms on the website; you can add someone here if they ask in
          person.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-6">
        <Figure value={counts.subscribed} label="on the list" strong />
        <Figure value={counts.unsubscribed} label="unsubscribed" />
        <Figure value={counts.total} label="ever" />

        <Link
          href="/staff/subscribers/export"
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-full border border-blue px-5 text-sm font-semibold text-blue transition-colors duration-300 hover:bg-blue-08"
        >
          <Download className="size-4" aria-hidden="true" />
          Export CSV
        </Link>
      </div>

      {(added || error) && (
        <p
          role="status"
          className="mt-6 rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] text-gray"
        >
          {error ?? "Added to the list."}
        </p>
      )}

      <form
        action={add}
        className="mt-8 flex flex-col gap-4 rounded-[20px_20px_0_20px] border border-gray-15 p-6 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-semibold text-blue">Email address</span>
          <input
            name="email"
            type="email"
            required
            className="h-11 rounded-card border border-gray-15 px-4 text-[15px] text-gray outline-none focus:border-blue"
          />
        </label>
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-semibold text-blue">Name (optional)</span>
          <input
            name="name"
            type="text"
            className="h-11 rounded-card border border-gray-15 px-4 text-[15px] text-gray outline-none focus:border-blue"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-blue px-6 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </button>
      </form>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-15">
              {["Email", "Name", "Source", "Added", "Status", ""].map((h) => (
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
            {people.map((person) => (
              <tr key={person.id} className="border-b border-gray-15">
                <td className="py-3 pr-6 text-[15px] font-medium text-blue">
                  {person.email}
                </td>
                <td className="py-3 pr-6 text-sm text-gray">{person.name ?? "—"}</td>
                <td className="py-3 pr-6 text-sm text-gray-80">{person.source}</td>
                <td className="py-3 pr-6 text-sm text-gray-80">
                  {dateFormat.format(person.createdAt)}
                </td>
                <td className="py-3 pr-6">
                  {person.status === "subscribed" ? (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-green">
                      <span className="size-1.5 rounded-full bg-green" aria-hidden="true" />
                      Subscribed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-80">
                      <span
                        className="size-1.5 rounded-full border border-gray-40"
                        aria-hidden="true"
                      />
                      {person.status === "bounced" ? "Bounced" : "Unsubscribed"}
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <form action={person.status === "subscribed" ? unsubscribe : resubscribe}>
                      <input type="hidden" name="id" value={person.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-blue underline underline-offset-4 hover:text-green"
                      >
                        {person.status === "subscribed" ? "Unsubscribe" : "Resubscribe"}
                      </button>
                    </form>
                    <form action={remove}>
                      <input type="hidden" name="id" value={person.id} />
                      <button
                        type="submit"
                        title="Erase this record entirely"
                        className="text-sm font-medium text-gray-80 underline underline-offset-4 hover:text-blue"
                      >
                        Erase
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {people.length === 0 && (
          <div className="mt-8 rounded-[20px_20px_0_20px] border border-gray-15 bg-blue-08 p-10">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
              Nobody has signed up yet
            </h2>
            <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-gray">
              Addresses from the signup forms on the website appear here
              automatically. You can also add someone above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Figure({
  value,
  label,
  strong,
}: {
  value: number;
  label: string;
  strong?: boolean;
}) {
  return (
    <p className="flex items-baseline gap-2">
      <span
        className={`font-display text-2xl font-semibold tabular-nums ${
          strong ? "text-blue" : "text-gray-80"
        }`}
      >
        {value}
      </span>
      <span className="text-sm text-gray-80">{label}</span>
    </p>
  );
}
