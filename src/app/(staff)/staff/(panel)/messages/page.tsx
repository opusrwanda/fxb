import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { Check, Undo2 } from "lucide-react";

import { db, messages } from "@/staff/db";
import { requireAccess, requireAdmin } from "@/staff/auth/guard";
import { isAdmin } from "@/staff/auth/permissions";

export const metadata = { title: "Messages" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

/**
 * Messages from the contact form.
 *
 * A register, like applications: nobody writes one here and nobody edits one.
 * The only actions are reading it, replying, and marking it dealt with — which
 * is the one piece of state a shared inbox does not give you, because two
 * people looking at the same mailbox cannot see who has already answered.
 *
 * `notified` is shown when it is false, because that is the case somebody
 * needs to know about: the message is safely on this page and never reached
 * the inbox.
 */
export default async function MessagesPage() {
  // People is read-only for an editor: they can see what has come in — useful
  // context for what to write about — and marking a message dealt with is a
  // claim about who is answering it, which belongs with the admins.
  const user = await requireAccess("messages", "read");
  const canHandle = isAdmin(user);

  const rows = await db.select().from(messages).orderBy(desc(messages.createdAt));

  async function setHandled(formData: FormData) {
    "use server";
    await requireAdmin("messages");
    await db
      .update(messages)
      .set({ handled: formData.get("handled") === "1" })
      .where(eq(messages.id, Number(formData.get("id"))));
    revalidatePath("/staff/messages");
  }

  const open = rows.filter((row) => !row.handled).length;

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
          Messages
        </h1>
        <p className="max-w-[58ch] text-base leading-relaxed text-gray">
          Everything sent through the contact form. Each one is emailed to the
          office as it arrives and kept here whether or not that email got
          through.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-[20px_20px_0_20px] border border-gray-15 bg-blue-08 p-10">
          <h2 className="text-xl font-bold tracking-[-0.02em] text-blue">
            No messages yet
          </h2>
          <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-gray">
            They appear here as soon as somebody writes through the contact
            page.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm text-gray-80">
            {open} of {rows.length} not yet dealt with
          </p>

          <ul className="mt-5 flex flex-col gap-5">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`rounded-card border p-6 ${
                  row.handled ? "border-gray-15 bg-blue-08/40" : "border-gray-15"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-[-0.01em] text-blue">
                      {row.subject || "No subject"}
                    </h2>
                    <p className="mt-1 text-sm text-gray">
                      {row.name} ·{" "}
                      <a
                        href={`mailto:${row.email}`}
                        className="underline underline-offset-4 transition-colors duration-300 hover:text-blue"
                      >
                        {row.email}
                      </a>
                      {row.phone && <> · {row.phone}</>}
                    </p>
                    <p className="mt-1 text-sm text-gray-80">
                      {dateFormat.format(row.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {!row.notified && (
                      <span className="rounded-full bg-blue-08 px-3 py-1 text-xs font-semibold text-blue">
                        Not emailed
                      </span>
                    )}

                    {canHandle && (
                    <form action={setHandled}>
                      <input type="hidden" name="id" value={row.id} />
                      <input
                        type="hidden"
                        name="handled"
                        value={row.handled ? "0" : "1"}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray underline underline-offset-4 transition-colors duration-300 hover:text-blue"
                      >
                        {row.handled ? (
                          <>
                            <Undo2 className="size-4" aria-hidden="true" />
                            Reopen
                          </>
                        ) : (
                          <>
                            <Check className="size-4" aria-hidden="true" />
                            Mark dealt with
                          </>
                        )}
                      </button>
                    </form>
                    )}
                  </div>
                </div>

                <p className="mt-5 border-t border-gray-15 pt-5 text-[15px] leading-relaxed whitespace-pre-line text-gray">
                  {row.message}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
