# The CMS

Payload, mounted at `/staff`. Everything the team should be able to change
without a developer lives there: news, stories, programmes, publications, the
board, partners, vacancies, the reach figures, and the contact details.

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
