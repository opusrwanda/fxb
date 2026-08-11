import { and, eq, sql } from "drizzle-orm";

import { campaigns, campaignSends, db, media, subscribers } from "../db";
import { getReach } from "@/cms/content/impact";
import { getNews } from "@/cms/content/news";
import { getSiteDetails } from "@/cms/content/settings";
import { renderCampaign } from "./render";
import { getTransport, mailConfig, readableSmtpError } from "./transport";
import { activeSubscribers } from "./subscribers";

/**
 * Sending a campaign.
 *
 * One message per person, not one message with everybody in BCC. Three reasons,
 * and the first is the one that matters: each person's unsubscribe link is
 * their own, and a shared link would unsubscribe whoever clicked it from a
 * token that belongs to somebody else. A BCC field of five hundred addresses is
 * also a spam signal, and it means one bad address fails the whole send.
 *
 * Every recipient is recorded in `campaign_sends` as the send proceeds, so a
 * run that stops halfway — Gmail's daily cap, a dropped connection, a redeploy —
 * can be resumed without mailing anybody twice.
 */

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://fxbrwanda.org";

export type SendReport = {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
  stopped?: string;
};

/**
 * Send one campaign to everyone who has not already had it.
 *
 * `limit` exists because of Gmail's daily cap: the team can send the first few
 * hundred today and the rest tomorrow, and the second run picks up exactly
 * where the first stopped.
 */
export async function sendCampaign(
  campaignId: number,
  { limit, testTo }: { limit?: number; testTo?: string } = {},
): Promise<SendReport> {
  const config = mailConfig();
  if (!config) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      stopped: "Email is not connected yet. Add the SMTP settings first.",
    };
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    return { sent: 0, failed: 0, skipped: 0, errors: [], stopped: "No such campaign." };
  }

  const details = await getSiteDetails();
  const address = `${details.address.line}, ${details.address.district}, ${details.address.country}`;
  const transport = getTransport(config);

  const from = `"${config.fromName}" <${config.fromAddress}>`;

  /**
   * Everything the template needs that is not the campaign's own words.
   *
   * Gathered once rather than per recipient: a five-hundred-person send would
   * otherwise re-read the impact figures and the site details five hundred
   * times for a letter in which they are identical.
   */
  const hero = campaign.heroId
    ? (
        await db
          .select({ url: media.url })
          .from(media)
          .where(eq(media.id, campaign.heroId))
      )[0]?.url
    : null;

  const [reach, latest] = await Promise.all([getReach(), getNews()]);

  // "More from FXB Rwanda": the two most recent published items, so the block
  // is current without anybody typing it out.
  const teasers = latest.slice(0, 2).map((item) => ({
    headline: item.title,
    url: `${siteUrl()}/news-insights/news/${item.slug}`,
    imageUrl: item.image?.url,
  }));
  const shell = {
    subject: campaign.subject,
    preheader: campaign.preheader,
    edition: campaign.edition,
    editionDate: campaign.sentAt
      ? formatEditionDate(campaign.sentAt)
      : formatEditionDate(new Date()),
    heroUrl: hero ?? null,
    logoUrl: "/img/logo-colour.png",
    // Three at most — the template's band is three columns. Taken from the
    // same Impact figures the site prints, so a newsletter cannot quote a
    // number the website disagrees with.
    stats: reach.figures
      .filter((figure) => figure.value !== null)
      .slice(0, 3)
      .map((figure) => ({
        figure: (figure.value as number).toLocaleString("en-GB"),
        label: figure.label,
      })),
    socials: details.socials.map((social) => ({
      label: social.label,
      href: social.href,
    })),
    content: campaign.content,
    legacyBody: campaign.body,
    news: teasers,
    siteUrl: siteUrl(),
    organisation: details.name,
    address,
    email: details.email,
  };

  // A test goes to one address and is never recorded, so it does not count
  // against the campaign or stop the real recipient getting it later.
  if (testTo) {
    const { html, text } = renderCampaign({
      ...shell,
      unsubscribeUrl: `${siteUrl()}/newsletter/unsubscribe?token=preview`,
    });

    try {
      await transport.sendMail({
        from,
        to: testTo,
        replyTo: config.replyTo,
        subject: `[Test] ${campaign.subject}`,
        html,
        text,
      });
      return { sent: 1, failed: 0, skipped: 0, errors: [] };
    } catch (error) {
      return {
        sent: 0,
        failed: 1,
        skipped: 0,
        errors: [readableSmtpError(error)],
        stopped: readableSmtpError(error),
      };
    }
  }

  const everyone = await activeSubscribers();

  // Who already has it. One query rather than one per recipient.
  const already = await db
    .select({ subscriberId: campaignSends.subscriberId })
    .from(campaignSends)
    .where(eq(campaignSends.campaignId, campaignId));

  const done = new Set(already.map((row) => row.subscriberId));
  const pending = everyone.filter((person) => !done.has(person.id));
  const batch = limit ? pending.slice(0, limit) : pending;

  const report: SendReport = {
    sent: 0,
    failed: 0,
    skipped: everyone.length - pending.length,
    errors: [],
  };

  await db
    .update(campaigns)
    .set({ status: "sending", updatedAt: new Date() })
    .where(eq(campaigns.id, campaignId));

  for (const person of batch) {
    const { html, text } = renderCampaign({
      ...shell,
      // The template greets by first name. A subscriber who only gave an
      // address gets "our friend", which is what the template's own fallback
      // says.
      firstName: person.name?.split(" ")[0] ?? null,
      unsubscribeUrl: `${siteUrl()}/newsletter/unsubscribe?token=${person.unsubscribeToken}`,
    });

    try {
      await transport.sendMail({
        from,
        to: person.name ? `"${person.name}" <${person.email}>` : person.email,
        replyTo: config.replyTo,
        subject: campaign.subject,
        html,
        text,
        headers: {
          // The one-click unsubscribe Gmail and Apple Mail put in their own
          // interface, above the message. Honouring it is what keeps a sender
          // out of the spam folder.
          "List-Unsubscribe": `<${siteUrl()}/newsletter/unsubscribe?token=${person.unsubscribeToken}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      await db.insert(campaignSends).values({
        campaignId,
        subscriberId: person.id,
        status: "sent",
      });
      report.sent += 1;
    } catch (error) {
      const message = readableSmtpError(error);
      await db.insert(campaignSends).values({
        campaignId,
        subscriberId: person.id,
        status: "failed",
        error: message.slice(0, 500),
      });
      report.failed += 1;
      if (report.errors.length < 5) report.errors.push(`${person.email}: ${message}`);

      // The daily cap is not a per-message failure — every remaining message
      // would fail the same way. Stop, keep what was recorded, and let the team
      // resume tomorrow.
      if (/daily user sending limit|5\.4\.5/i.test(message)) {
        report.stopped =
          "Gmail's daily limit was reached. The rest can be sent tomorrow — the panel remembers who already has it.";
        break;
      }
    }
  }

  const remaining = pending.length - report.sent - report.failed;

  await db
    .update(campaigns)
    .set({
      status: remaining > 0 ? "sending" : "sent",
      sentAt: campaign.sentAt ?? new Date(),
      sentCount: (campaign.sentCount ?? 0) + report.sent,
      failedCount: (campaign.failedCount ?? 0) + report.failed,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  return report;
}

/** How far a campaign has got, and how many are still waiting. */
export async function campaignProgress(campaignId: number) {
  const [audience] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(subscribers)
    .where(eq(subscribers.status, "subscribed"));

  const [sends] = await db
    .select({
      sent: sql<number>`count(*) filter (where status = 'sent')::int`,
      failed: sql<number>`count(*) filter (where status = 'failed')::int`,
    })
    .from(campaignSends)
    .where(eq(campaignSends.campaignId, campaignId));

  const total = audience?.total ?? 0;
  const sent = sends?.sent ?? 0;
  const failed = sends?.failed ?? 0;

  return { total, sent, failed, remaining: Math.max(0, total - sent - failed) };
}

/**
 * Forget the failures for a campaign, so the next send retries just those.
 *
 * Only the rows marked failed. Clearing the successful ones as well would make
 * the next run mail everybody who already has it a second time, which is the
 * one mistake a mailing tool must never make.
 */
export async function clearFailures(campaignId: number) {
  await db
    .delete(campaignSends)
    .where(
      and(
        eq(campaignSends.campaignId, campaignId),
        eq(campaignSends.status, "failed"),
      ),
    );
}

/** "11 August 2026", for the line over the headline. */
function formatEditionDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}
