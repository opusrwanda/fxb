# The mailing list

FXB owns the list. There is no Mailchimp, no Brevo, no per-subscriber fee and
nobody else holding the addresses — signups land in the `subscribers` table and
the team writes and sends from `/staff`.

Three pages:

- **`/staff/subscribers`** — everyone on the list, with an export
- **`/staff/campaigns`** — the emails, drafted and sent
- **`/newsletter/unsubscribe`** — where the link in every email leads

## Connecting Gmail

Sending needs four values in the environment. In development they go in
`.env.local`; in production they are Vercel environment variables.

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=someone@fxbrwanda.org
SMTP_PASSWORD=<the 16-character App Password>
MAIL_FROM_NAME=FXB Rwanda
MAIL_FROM_ADDRESS=someone@fxbrwanda.org
NEXT_PUBLIC_SITE_URL=https://fxbrwanda.org
```

**`SMTP_PASSWORD` is not the account password.** Google stopped accepting those
over SMTP. The address needs 2-Step Verification switched on, and then an App
Password generated at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
— a 16-character string, which is what goes here. If it is wrong, the panel says
so in those words rather than showing a raw error.

`NEXT_PUBLIC_SITE_URL` matters more than it looks: it is what unsubscribe links
are built from. Left pointing at localhost, every recipient gets a link that
only works on the machine that sent it.

## The limit you will hit

**Gmail caps sending at roughly 500 recipients a day on a free account, and
2,000 on Workspace.** This is Google's limit, not something the code can work
around. Going over it bounces the rest back as "Daily user sending limit
exceeded" and can lock the account for 24 hours.

The panel is built for that rather than against it:

- every recipient is recorded as the send proceeds, so tomorrow's run picks up
  exactly where today's stopped and nobody is mailed twice;
- the send form takes a "send at most" number, so a large list can be worked
  through deliberately;
- hitting the cap mid-send stops the run and says so, rather than burning
  through hundreds of failures.

If the list outgrows Gmail, moving to a transactional provider — Brevo,
Postmark, SES — is a change to those environment variables and nothing else.
Nothing above `src/staff/mail/transport.ts` knows which service is sending.

## What is sent

One message per person, never one message with everybody in BCC. Each person's
unsubscribe link is their own, a large BCC field is a spam signal, and one bad
address would otherwise fail the whole send.

Every email carries an unsubscribe link in the footer and a `List-Unsubscribe`
header, which is what puts the one-click unsubscribe into Gmail's own interface
above the message. Both are legally required for a list reaching Europe, and
their absence is the fastest way to have a sending domain marked as spam.

The email is a table-based layout with inline styles — not the site's `Prose`
component. Outlook on Windows renders through Word, which has no flexbox or
grid, and Gmail strips `<style>` blocks. A plain text alternative is built
alongside every message, because a message with no text part scores worse with
spam filters and is unreadable with images off.

## Consent

`subscribers.consentAt` is stamped when somebody ticks the box and never
overwritten. Under Rwanda's data protection law, and under GDPR for the European
donors on this list, a subscription with no recorded moment of consent is not a
subscription.

Unsubscribing sets a status rather than deleting the row, so an address cannot
be signed up again by somebody re-importing an old spreadsheet. Erasing a record
outright is a separate action on the subscribers page, for a genuine erasure
request.

## What is not built yet

- **No double opt-in.** Signing up adds the address immediately. Confirmation
  email first would be the stricter reading of GDPR and is a sensible next step.
- **No bounce handling.** The `bounced` status exists but nothing sets it; that
  needs somewhere to receive Gmail's delivery reports.
- **No open or click tracking**, deliberately — it means a tracking pixel on
  every recipient, which is a decision FXB should make rather than inherit.
