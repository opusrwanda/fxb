import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Send } from "lucide-react";

import { campaigns, db } from "@/staff/db";
import { currentUser } from "@/staff/auth/session";
import { parseRichText, richTextToEditorJson } from "@/staff/queries/document";
import { campaignProgress, clearFailures, sendCampaign } from "@/staff/mail/send";
import { subscriberCounts } from "@/staff/mail/subscribers";
import { mailConfig } from "@/staff/mail/transport";
import { RichTextEditor } from "@/staff/ui/editor";

export const metadata = { title: "Campaign" };

const input =
  "w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray outline-none focus:border-blue";

/**
 * Writing and sending one campaign.
 *
 * Everything about this page is arranged around the fact that sending cannot be
 * undone. The compose form and the send controls are separate forms with
 * separate buttons, so Save is never one keystroke away from Send; a test to one
 * address is offered first and sits above the real thing; and the send button
 * says how many people it will reach rather than just "Send".
 */
export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; sent?: string; error?: string; tested?: string }>;
}) {
  const { id } = await params;
  const { saved, sent, error, tested } = await searchParams;

  const creating = id === "new";
  const numericId = creating ? null : Number(id);
  if (!creating && !Number.isInteger(numericId)) notFound();

  const [campaign] = creating
    ? [null]
    : await db.select().from(campaigns).where(eq(campaigns.id, numericId!)).limit(1);

  if (!creating && !campaign) notFound();

  const [counts, progress, user] = await Promise.all([
    subscriberCounts(),
    creating ? null : campaignProgress(numericId!),
    currentUser(),
  ]);

  const configured = mailConfig() !== null;
  const alreadySent = campaign?.status === "sent";

  async function save(formData: FormData) {
    "use server";

    const values = {
      subject: String(formData.get("subject") ?? "").trim(),
      preheader: String(formData.get("preheader") ?? "").trim() || null,
      body: parseRichText(String(formData.get("body") ?? "")),
      updatedAt: new Date(),
    };

    if (!values.subject) {
      redirect(`/staff/campaigns/${id}?error=${encodeURIComponent("A subject is required.")}`);
    }

    if (numericId === null) {
      const [created] = await db
        .insert(campaigns)
        .values(values)
        .returning({ id: campaigns.id });
      redirect(`/staff/campaigns/${created.id}?saved=1`);
    }

    await db.update(campaigns).set(values).where(eq(campaigns.id, numericId));
    redirect(`/staff/campaigns/${numericId}?saved=1`);
  }

  async function sendTest(formData: FormData) {
    "use server";
    const to = String(formData.get("testTo") ?? "").trim();
    const report = await sendCampaign(numericId!, { testTo: to });
    redirect(
      report.stopped
        ? `/staff/campaigns/${numericId}?error=${encodeURIComponent(report.stopped)}`
        : `/staff/campaigns/${numericId}?tested=${encodeURIComponent(to)}`,
    );
  }

  async function sendToList(formData: FormData) {
    "use server";
    const limitRaw = String(formData.get("limit") ?? "").trim();
    const report = await sendCampaign(numericId!, {
      limit: limitRaw ? Number(limitRaw) : undefined,
    });

    const summary = `${report.sent} sent${report.failed ? `, ${report.failed} failed` : ""}.${
      report.stopped ? ` ${report.stopped}` : ""
    }`;
    redirect(`/staff/campaigns/${numericId}?sent=${encodeURIComponent(summary)}`);
  }

  async function retryFailures() {
    "use server";
    await clearFailures(numericId!);
    redirect(`/staff/campaigns/${numericId}?saved=1`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/staff/campaigns"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-80 transition-colors duration-300 hover:text-blue"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Email campaigns
      </Link>

      <h1 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-blue lg:text-[38px]">
        {creating ? "New campaign" : campaign!.subject}
      </h1>

      {saved && <Note tone="ok">Saved.</Note>}
      {tested && <Note tone="ok">Test sent to {tested}. Check it before sending to the list.</Note>}
      {sent && <Note tone="ok">{sent}</Note>}
      {error && <Note tone="bad">{error}</Note>}

      {alreadySent && (
        <Note tone="bad">
          This campaign has been sent. Editing it now changes only what is stored
          here — the emails that went out cannot be changed.
        </Note>
      )}

      <form action={save} className="mt-8 flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <label htmlFor="subject" className="text-sm font-semibold text-blue">
            Subject <span className="text-green">*</span>
          </label>
          <input
            id="subject"
            name="subject"
            required
            defaultValue={campaign?.subject ?? ""}
            className={input}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="preheader" className="text-sm font-semibold text-blue">
            Preview line
          </label>
          <p className="text-[13px] leading-relaxed text-gray-80">
            The grey line an inbox shows after the subject. Worth writing — left
            empty, most clients show the first words of the email instead.
          </p>
          <input
            id="preheader"
            name="preheader"
            defaultValue={campaign?.preheader ?? ""}
            className={input}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span id="body-label" className="text-sm font-semibold text-blue">
            The email
          </span>
          <RichTextEditor
            name="body"
            initialJson={richTextToEditorJson(campaign?.body)}
            ariaLabelledBy="body-label"
          />
        </div>

        <button
          type="submit"
          className="inline-flex h-12 w-fit items-center justify-center rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90"
        >
          {creating ? "Create campaign" : "Save changes"}
        </button>
      </form>

      {!creating && (
        <section className="mt-14 border-t border-gray-15 pt-10">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-gray-80">
            SENDING
          </h2>

          {!configured ? (
            <p className="mt-5 max-w-[58ch] rounded-card border border-gray-15 bg-blue-08 px-5 py-4 text-[15px] leading-relaxed text-gray">
              <strong className="font-semibold text-blue">
                Email is not connected.
              </strong>{" "}
              Add the SMTP settings and this campaign can be sent — see{" "}
              <code>docs/email.md</code>.
            </p>
          ) : (
            <>
              <p className="mt-5 text-base text-gray">
                <strong className="font-semibold text-blue">
                  {progress!.remaining}
                </strong>{" "}
                of {counts.subscribed} still to receive this
                {progress!.sent > 0 && <> · {progress!.sent} already have it</>}
                {progress!.failed > 0 && (
                  <> · {progress!.failed} failed</>
                )}
                .
              </p>

              {/* The test comes first, and deliberately defaults to the address
                  of whoever is signed in — the person most likely to want it. */}
              <form
                action={sendTest}
                className="mt-6 flex flex-col gap-3 rounded-[20px_20px_0_20px] border border-gray-15 p-6 sm:flex-row sm:items-end"
              >
                <label className="flex flex-1 flex-col gap-2">
                  <span className="text-sm font-semibold text-blue">
                    Send a test to one address first
                  </span>
                  <input
                    name="testTo"
                    type="email"
                    required
                    defaultValue={user?.email ?? ""}
                    className="h-11 rounded-card border border-gray-15 px-4 text-[15px] text-gray outline-none focus:border-blue"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-blue px-6 text-[15px] font-semibold text-blue transition-colors duration-300 hover:bg-blue-08"
                >
                  Send test
                </button>
              </form>

              <form
                action={sendToList}
                className="mt-6 flex flex-col gap-4 rounded-[20px_20px_0_20px] border border-gray-15 bg-blue-08 p-6"
              >
                <p className="max-w-[58ch] text-[15px] leading-relaxed text-gray">
                  Sending cannot be undone. Everyone who has already received
                  this campaign is skipped, so pressing it twice does not mail
                  anybody twice.
                </p>

                <label className="flex w-fit flex-col gap-2">
                  <span className="text-sm font-semibold text-blue">
                    Send at most (optional)
                  </span>
                  <input
                    name="limit"
                    type="number"
                    min={1}
                    placeholder="all"
                    className="h-11 w-40 rounded-card border border-gray-15 px-4 text-[15px] text-gray outline-none focus:border-blue"
                  />
                  <span className="text-[13px] text-gray-80">
                    Gmail caps a free account at about 500 a day. Leave blank to
                    send to everyone remaining.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={progress!.remaining === 0}
                  className="inline-flex h-12 w-fit items-center gap-2 rounded-full bg-blue px-8 text-base font-semibold text-white transition-colors duration-300 hover:bg-blue-90 disabled:pointer-events-none disabled:opacity-40"
                >
                  <Send className="size-4" aria-hidden="true" />
                  {progress!.remaining === 0
                    ? "Everyone has it"
                    : `Send to ${progress!.remaining} ${progress!.remaining === 1 ? "person" : "people"}`}
                </button>
              </form>

              {progress!.failed > 0 && (
                <form action={retryFailures} className="mt-4">
                  <button
                    type="submit"
                    className="text-sm font-medium text-blue underline underline-offset-4 hover:text-green"
                  >
                    Try the {progress!.failed} failed{" "}
                    {progress!.failed === 1 ? "address" : "addresses"} again
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

function Note({ tone, children }: { tone: "ok" | "bad"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "bad" ? "alert" : "status"}
      className={`mt-6 rounded-card px-5 py-4 text-[15px] leading-relaxed text-gray ${
        tone === "ok"
          ? "border border-green/30 bg-green-10"
          : "border border-gray-15 bg-blue-08"
      }`}
    >
      {children}
    </p>
  );
}
