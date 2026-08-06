# The CMS

The staff panel at `/staff`. Everything the team should be able to change
without a developer lives there: news, stories, programmes, publications, the
board, partners, vacancies, the reach figures, the contact details, and the
mailing list.

**The site reads from it.** Every page is rendered from the database — see
"How the site reads it" below.

It is ours: Drizzle over Postgres, a hand-built panel under `src/staff`, and no
CMS framework underneath it. It replaced Payload, which this document used to
describe. If you find a `payload_*` table, a `PAYLOAD_SECRET`, or a reference to
`payload.config.ts`, it is a leftover and not a dependency — see "What is left
of Payload" at the end.

`/staff` rather than `/admin` — it is the team's own word for the people who use
it, and it keeps the door off the address every scanner tries first. It does not
collide with the site's own `/api` contact and newsletter handlers.

## Running it locally

One variable in `.env.local`:

```
STAFF_DATABASE_URL=postgres://<you>@localhost:5432/fxb
```

Create the database (`createdb fxb`), apply the migrations, and open `/staff`:

```bash
npm run db:migrate
npm run dev
```

Sessions are rows in the `sessions` table and the cookie carries nothing but 32
random bytes, so there is no signing secret to set. There is no first-run setup
screen either: the users came across with the content, by the migration
described below.

## Schema changes

The migrations in `src/staff/db/migrations` are generated files, checked in, and
applied on deploy. Edit `src/staff/db/schema.ts`, then:

```bash
npm run db:generate   # writes the SQL, for you to read
npm run db:migrate    # applies it
```

Never `push`. A generated migration is a diff somebody can read before it runs
against production.

Both commands resolve the database the same way the panel does —
`STAFF_DATABASE_URL`, falling back to `DATABASE_URL`. Note that drizzle-kit does
not read `.env.local`, so the variable has to be in the environment:

```bash
STAFF_DATABASE_URL=postgres://... npm run db:migrate
```

The globals are the exception: `site_settings` and `impact` are a slug and a
`jsonb` payload, so a new field on either is a TypeScript change and no
migration at all.

## How the content got here

`scripts/migrate-from-payload.ts` lifts the content out of Payload's database
and into ours:

```bash
DATABASE_URL=<payload's> STAFF_DATABASE_URL=<ours> npx tsx scripts/migrate-from-payload.ts
```

It has been run against the local databases. **It has not been run against
production**, which is the only reason Payload's database still exists.

It deliberately does not carry across Payload's `_v` version tables — the
draft/published history, which nobody has asked to keep — or the user
passwords, which are hashes under a scheme we cannot verify against. Every
migrated user is given the same temporary password, which the script prints
when it finishes, and re-running it never overwrites a password somebody has
since set.

Before Payload there was a seed script that moved the content out of the
TypeScript modules under `src/lib`. That script is gone, and with it the only
reader of most of those modules.

## How the site reads it

`src/cms/content/` is the whole of it: one module per collection, each exporting
functions that return the shapes the pages already used. Nothing else in the
site talks to the database.

Two things about it are worth knowing before changing anything.

**The reads are cached until somebody edits.** Every query is wrapped in
`cached()` (`src/cms/content/cache.ts`), which tags it with its collection and
holds the result indefinitely. Saving from `/staff` calls `bust()`
(`src/cms/revalidate.ts`), which drops that tag so the next request rebuilds the
page. The alternative — a fixed revalidation window — would have the team press
Save and then wait, with no way to tell whether it had worked.

The tag is expired outright rather than marked stale, because the next visitor
after a publish is nearly always the person who just published, checking their
own work.

Media is the exception: it busts everything. A photograph is embedded in news
cards, programme pages, the board and the reach figures, so replacing one image
reaches pages no single collection tag would.

**The content layer is server-only.** It opens a connection pool. A client
component may import a *type* from it — types are erased — but importing a value
breaks the build. `WhereWeWork` is the worked example: it takes its programmes
as a prop and keeps its own copy of the district index.

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

The guiding values used to be on this list and are not any more: they are in
Site details, alongside the vision and mission, since the content brief revised
them from three to five.

## Where uploaded files go, and what is still needed for production

Uploads are written to `./media` at the repo root, which is gitignored — the
row in the `media` table is the record and the file is its payload, so
committing one without the other only creates two things to keep in step.

**This does not survive a deploy.** Vercel's filesystem is read-only at
runtime and rebuilt on every deploy, so with the current configuration an
upload made through `/staff` in production would fail, and the migrated files
would not be there to serve. Before the CMS is handed over, uploads need to go
to Bunny storage, which the site already uses for its photography and already
has a zone for — the pull zone in `NEXT_PUBLIC_CDN_URL` would then serve CMS
uploads too, from the same hostname as everything else. This needs
`BUNNY_STORAGE_PASSWORD` in Vercel, which has so far been kept local on purpose
(only the build-time upload script needed it).

**This is a launch blocker, not a nice-to-have.** Every photograph on the site
is a `media` row: on the first deploy after migrating, `./media` is not in the
image and every one of them 404s.

## What is left of Payload

Nothing executes. There is no dependency in `package.json`, no
`payload.config.ts`, and no import anywhere in `src`. What remains is:

- **The `fxb_cms` database**, locally and in production. It is the source for
  `scripts/migrate-from-payload.ts` and cannot be dropped until that script has
  been run against production.
- **`scripts/migrate-from-payload.ts`** itself, which is worth keeping until the
  same is true.
- **Six modules under `src/lib`** — `news`, `impact`, `stories`, `partners`,
  `projects`, `leadership` — marked SEED INPUT ONLY. The script that read them
  is gone, so nothing reads them now.
- **`PAYLOAD_SECRET` in `.env.local`**, which nothing has read since sessions
  became rows.
- **Historical mentions in comments**, where the reason a thing is shaped the
  way it is happens to be the thing it replaced. Those are load-bearing prose
  and should stay.
