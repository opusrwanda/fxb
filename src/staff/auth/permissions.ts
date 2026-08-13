import type { Role, Status } from "../db/schema";

/**
 * Who may do what.
 *
 * The panel had one role for a while and everybody had it — the reasoning was
 * that this is one communications team and a permission nobody wants to
 * withhold is a control three people have to think about for nothing. That was
 * true of a team of three. It stops being true the moment somebody who is not
 * on that team needs to write a story, and the choice becomes "give them the
 * mailing list and the staff accounts too" or "do not give them an account".
 *
 * So there are two roles, and this file is the whole answer to what they mean.
 * Not a checkbox matrix in the database: a matrix has to be kept correct by
 * hand for every row, and the first time somebody creates an account with the
 * wrong boxes ticked the model has failed. Here the rules are code, they are
 * in one place, and adding a collection means adding it to `AREAS` below or
 * finding out immediately that you have not.
 *
 * ADMIN runs the site. Everything, everywhere, including the things that are
 * hard to undo: sending to the mailing list, exporting it, deleting files,
 * changing the settings, and adding or removing colleagues.
 *
 * EDITOR writes for it. Their own news, stories and publications, which they
 * may publish themselves or hand to an admin to look at first; and the media
 * library, so they can illustrate what they write. Everything else they can
 * read and not change — which is deliberate: an editor should be able to look
 * up a board member's title or check what a programme says without needing to
 * ask, and should not be able to rewrite either by accident.
 *
 * Every check here is also made on the server at the point of the write. This
 * file decides what the panel *offers*; it is not what stops anything. A hidden
 * button is a courtesy, not a permission — see `guard.ts`.
 */

/** Somebody signed in, reduced to the two things any rule here depends on. */
export type Actor = { id: number; role: Role };

/**
 * The areas of the panel, as the team describes them.
 *
 * These are the rows of the permissions table FXB wrote, not a restatement of
 * the sidebar's groups. They mostly agree — but the timeline sits under
 * Publishing in the sidebar because that is where somebody looks for it, while
 * the permissions treat it as its own thing, because an editor may write news
 * and may not rewrite the organisation's history.
 */
export type Area =
  | "publishing"
  | "timeline"
  | "programmes"
  | "people"
  | "mailing"
  | "campaigns"
  | "library"
  | "settings";

/** No sight of it, read it, or change it. */
export type Access = "none" | "read" | "write";

/**
 * Which area each thing in the panel belongs to.
 *
 * Keyed by the `key` of an entry in `collections.ts` — collections, globals,
 * mailing pages and registers alike, because a permission does not care which
 * of those lists something happens to be declared in.
 */
const AREAS: Record<string, Area> = {
  // Publishing. Note that "newsletters" here means the quarterly PDFs, which
  // are publications; the email campaigns are the mailing list's business.
  news: "publishing",
  stories: "publishing",
  publications: "publishing",

  milestones: "timeline",

  programmes: "programmes",
  opportunities: "programmes",

  board: "people",
  partners: "people",
  messages: "people",
  applications: "people",

  subscribers: "mailing",
  /**
   * Its own area, and not because sending is the dangerous part.
   *
   * FXB's rule for an editor is "view subscriber counts only". A campaign is
   * not a count — it is the letter itself, and reading it in the panel means
   * reading it with the list it is addressed to sitting next to it. Splitting
   * the row in two is what lets the subscribers page show a number to
   * everybody while the campaigns stay with the people who send them.
   */
  campaigns: "campaigns",

  media: "library",

  pageHeaders: "settings",
  sections: "settings",
  users: "settings",
  "site-settings": "settings",
  impact: "settings",
};

/**
 * What an editor gets in each area.
 *
 * An admin is not in this table because an admin gets `write` everywhere; a
 * second column that read "write, write, write, write, write, write, write"
 * would be a thing to keep in step for no information.
 */
const EDITOR: Record<Area, Access> = {
  publishing: "write",
  library: "write",
  timeline: "read",
  programmes: "read",
  people: "read",
  /**
   * Read, and less than it sounds.
   *
   * The mailing list is the one place where "read" is still too much: the rows
   * are several hundred people's email addresses, given to FXB for a
   * newsletter and nothing else. So an editor sees the counts and not the
   * list — `canSeeSubscribers` below, which the subscribers page asks
   * separately.
   */
  mailing: "read",
  campaigns: "none",
  settings: "none",
};

export const isAdmin = (actor: Actor): boolean => actor.role === "admin";

/**
 * The area something belongs to.
 *
 * Anything not in the table is treated as `settings`, which is the strictest
 * area there is. A collection added without a line in `AREAS` therefore
 * becomes admin-only rather than silently becoming everybody's — the failure
 * that costs somebody an email to an admin, not the one that hands an editor
 * the staff accounts.
 */
export function areaFor(key: string): Area {
  return AREAS[key] ?? "settings";
}

export function accessTo(actor: Actor, key: string): Access {
  return isAdmin(actor) ? "write" : EDITOR[areaFor(key)];
}

/** Should this appear in the sidebar and on the dashboard at all? */
export function canSee(actor: Actor, key: string): boolean {
  return accessTo(actor, key) !== "none";
}

/** May they add a new one? */
export function canCreate(actor: Actor, key: string): boolean {
  return accessTo(actor, key) === "write";
}

/**
 * May they change this particular document?
 *
 * `authorId` is who wrote it, and null means nobody knows — every document
 * that predates the column. Null is treated as admin-only rather than as
 * everybody's, because the alternative is that the day this ships, every
 * editor can rewrite every news item FXB has ever published on the strength of
 * a column default. An admin can always edit it and can hand it over by
 * republishing it under a new author if that is genuinely wanted.
 */
export function canEditDocument(
  actor: Actor,
  key: string,
  authorId: number | null | undefined,
): boolean {
  if (isAdmin(actor)) return true;
  if (accessTo(actor, key) !== "write") return false;
  return authorId != null && authorId === actor.id;
}

/**
 * May they delete it?
 *
 * Deliberately narrower than editing. An editor may take back a file they
 * uploaded — that is the library's own rule, "cannot delete others' files" —
 * but published writing is removed by an admin, because a delete here is
 * immediate, total and has no undo, and the person best placed to be sure is
 * the one who can also see what links to it.
 *
 * Setting a document back to draft takes it off the website and loses nothing,
 * and is what an editor who wants it gone actually wants.
 */
export function canDeleteDocument(
  actor: Actor,
  key: string,
  authorId: number | null | undefined,
): boolean {
  if (isAdmin(actor)) return true;
  if (areaFor(key) !== "library") return false;
  return authorId != null && authorId === actor.id;
}

/**
 * The statuses this person may set.
 *
 * Both roles may publish — FXB was explicit that an editor is trusted to put
 * their own work on the website. `in_review` is offered to editors as the
 * other option rather than imposed on them: "I have finished, someone look
 * before it goes out". It is not offered to an admin, who is the person that
 * review is addressed to and would only be sending work to themselves.
 */
export function statusesFor(role: Role): ReadonlyArray<Status> {
  return role === "admin"
    ? (["draft", "published"] as const)
    : (["draft", "in_review", "published"] as const);
}

/**
 * How each status is written on the form.
 *
 * In the second person and in terms of what happens, because that is the
 * question somebody is actually answering when they open this control. "Draft"
 * on its own does not say whether the website is showing it.
 */
export const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft — not on the website",
  in_review: "Send to an admin to check — not on the website yet",
  published: "Published — live on the website",
};

/** The same, for a listing, where there is no room for a sentence. */
export const STATUS_PILLS: Record<Status, string> = {
  draft: "Draft",
  in_review: "Awaiting approval",
  published: "Published",
};

/**
 * May they see who is on the mailing list?
 *
 * Separate from `accessTo` because the subscribers page is two things: a count,
 * which is ordinary editorial information, and several hundred people's email
 * addresses, which is not. An editor gets the first and not the second.
 */
export const canSeeSubscribers = isAdmin;

/** Exporting is a copy of the whole list leaving the building. Admin only. */
export const canExportSubscribers = isAdmin;

/**
 * Sending is the one action in this panel that cannot be taken back.
 *
 * Everything else here is a row somebody can edit again. A campaign is several
 * hundred messages that have already arrived.
 */
export const canSendCampaign = isAdmin;

/** Adding, removing and re-roling colleagues. */
export const canManageUsers = isAdmin;
