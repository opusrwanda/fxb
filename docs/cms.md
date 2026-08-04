# The CMS

Payload, mounted at `/staff`. Everything the team should be able to change
without a developer lives there: news, stories, programmes, publications, the
board, partners, vacancies, the reach figures, and the contact details.

**The site reads from it.** Every page is rendered from the database — see
"How the site reads it" below.

`/staff` rather than Payload's default `/admin` — it is the team's own word for
the people who use it, and it keeps the door off the address every scanner
tries first. The API moves with it, to `/staff/api`, so it does not land on top
of the site's own `/api` contact and newsletter handlers.

## Running it locally

Two variables in `.env.local`:

```
DATABASE_URL=postgres://<you>@localhost:5432/fxb_cms
PAYLOAD_SECRET=<openssl rand -hex 32>
```

Create the database (`createdb fxb_cms`), start the dev server, and open
`/staff`. The tables are pushed from the collection definitions on first run;
the first visit asks you to create the first user.

## Seeding it from the site's own content

The site's content began life as TypeScript modules under `src/lib` — fine for
a build and useless for FXB, because publishing a news item meant editing a
file. `scripts/seed-cms.ts` moves it across:

```bash
npm run seed
```

It brings over 4 news items, 3 stories, 6 programmes, 8 board members, 34
partners, 18 publications, the four reach figures and the site details, and
uploads the 63 photographs and logos they reference — pulling the programme
photography from the Bunny pull zone and the board portraits from `public/`.

**It is safe to run again.** Every document is matched on its slug (or its
name, for board and partners) and updated rather than duplicated; media is
matched on filename, so a second run does not upload sixty-three images twice.
That matters because it will be run once against the local database and again
against production, with the source files having moved on in between.

Two things it deliberately does not publish:

- **The eighteen publications arrive as drafts.** They are placeholders for
  documents FXB has not supplied — the `file` field is required for good
  reason, and an annual report the site claims to have and cannot produce is
  worse than a page saying it is coming. The team attaches the PDF and presses
  Publish.
- **The six programmes are published but ticked "Description not yet
  confirmed".** The programmes are real; the descriptions were written to show
  what the template looks like carrying copy, because an empty state tells you
  nothing about a layout. Each page says so until the flag is cleared.

Ten photographs come in with `alt` reading "description to be written". Those
are the frames nothing in the codebase has ever described — they render
decoratively behind type, so the site asks nothing of the string, but the
library does. They are the ten alt texts worth writing.

## How the site reads it

`src/cms/content/` is the whole of it: one module per collection, each exporting
functions that return the shapes the pages already used. Nothing else in the
site talks to Payload.

Two things about it are worth knowing before changing anything.

**The reads are cached until somebody edits.** Every query is wrapped in
`cached()` (`src/cms/content/payload.ts`), which tags it with its collection and
holds the result indefinitely. Each collection carries `revalidates()` hooks
(`src/cms/revalidate.ts`), so pressing Publish drops that tag and the next
request rebuilds the page. The alternative — a fixed revalidation window — would
have the team press Publish and then wait, with no way to tell whether it had
worked.

The tag is expired outright rather than marked stale, because the next visitor
after a publish is nearly always the person who just published, checking their
own work.

Media is the exception: it busts everything. A photograph is embedded in news
cards, programme pages, the board and the reach figures, so replacing one image
reaches pages no single collection tag would.

**The content layer is server-only.** It imports the Payload config, which
imports `node:fs`. A client component may import a *type* from it — types are
erased — but importing a value breaks the build. `WhereWeWork` is the worked
example: it takes its programmes as a prop and keeps its own copy of the
district index.

## What the team's own edits do not reach

Two things on the site are still written in code, on purpose:

- **The abbreviated figures on the home page** (`impact-counters.tsx`) — 2.9M+,
  1.4M+, 1.1M+, 505K+. They are abbreviations of the four reach figures, and
  they are not derivable from them: 2,984,961 is written 2.9M+ (rounded down)
  and 1,389,426 is written 1.4M+ (rounded up), so there is no rule to apply.
  How to abbreviate a figure at display scale is FXB's editorial call, not a
  formula. **This means a MEL update in `/staff` changes the Our Impact page and
  not the home page band.** Whoever updates the figures needs to know that.
- **The navigation, and the brand identity** — `brand` in `src/lib/site.ts`.
  Changing the organisation's name or its FXB Global endorsement would be a
  rebrand needing new logo files and metadata, so a text field would offer a
  change nobody could actually make from there.

`src/lib` still holds the content modules the site used to render from. They are
marked SEED INPUT ONLY and are read by `scripts/seed-cms.ts` and nothing else,
because the migration has to be run once more against production. They can be
deleted along with the seed once it has been.

## Where uploaded files go, and what is still needed for production

Uploads are written to `./media` at the repo root, which is gitignored — the
row in the `media` table is the record and the file is its payload, so
committing one without the other only creates two things to keep in step.

**This does not survive a deploy.** Vercel's filesystem is read-only at
runtime and rebuilt on every deploy, so with the current configuration an
upload made through `/staff` in production would fail, and the seeded files
would not be there to serve. Before the CMS is handed over, uploads need a
storage adapter. Two options, in order of preference:

1. **Bunny storage**, which the site already uses for its photography and
   already has a zone for — the pull zone in `NEXT_PUBLIC_CDN_URL` would then
   serve CMS uploads too, from the same hostname as everything else. This needs
   `BUNNY_STORAGE_PASSWORD` in Vercel, which has so far been kept local on
   purpose (only the build-time upload script needed it).
2. **`@payloadcms/storage-vercel-blob`**, which needs no new credentials but
   adds a second asset host and a second bill.

Until one is in place, `/staff` is usable locally and read-only in effect on
production.

**This is now a launch blocker, not a nice-to-have.** It was survivable while
the site rendered from `src/lib` and the CMS was a box nothing read. Now every
photograph on the site is a `media` row: on the first deploy after seeding,
`./media` is not in the image and every one of them 404s.
