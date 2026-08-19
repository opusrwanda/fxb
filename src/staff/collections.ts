import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  Briefcase,
  Building2,
  FileText,
  Image as ImageIcon,
  Inbox,
  Layers,
  Mail,
  Map,
  Megaphone,
  Milestone,
  Newspaper,
  Send,
  Settings,
  Sparkles,
  Type,
  UserCog,
  Users,
} from "lucide-react";

/**
 * What the panel manages, and how it is grouped in the sidebar.
 *
 * One list, read by the sidebar, the dashboard and the routes. Adding a
 * collection means adding a line here rather than editing three files and
 * forgetting the third — which is the failure mode of a hand-written admin and
 * the reason this exists as data.
 *
 * COLLECTIONS are things there can be many of and which come and go.
 * GLOBALS are the single documents a site has exactly one of — there is no
 * "add another" for the office address, so it would be wrong to offer one.
 */

export type CollectionKey =
  | "news"
  | "stories"
  | "programmes"
  | "areas"
  | "publications"
  | "milestones"
  | "board"
  | "partners"
  | "opportunities"
  | "media";

export type GlobalKey = "site-settings" | "impact" | "banner";

export type Entry = {
  key: string;
  /** The URL segment under /staff. */
  slug: string;
  label: string;
  /** Singular, for "New …" and for a document's own breadcrumb. */
  singular: string;
  description: string;
  icon: LucideIcon;
  group: "Publishing" | "Programmes" | "People" | "Mailing list" | "Library" | "Settings";
};

export const collections: Entry[] = [
  {
    key: "news",
    slug: "news",
    label: "News",
    singular: "news item",
    description: "Programme launches, partnerships, project updates, awards.",
    icon: Newspaper,
    group: "Publishing",
  },
  {
    key: "stories",
    slug: "stories",
    label: "Stories",
    singular: "story",
    description: "Accounts of one family or person, and what changed for them.",
    icon: Sparkles,
    group: "Publishing",
  },
  {
    key: "publications",
    slug: "publications",
    label: "Publications",
    singular: "publication",
    description: "Anything with a file to download.",
    icon: FileText,
    group: "Publishing",
  },
  {
    key: "milestones",
    slug: "milestones",
    label: "Our Story timeline",
    singular: "milestone",
    description: "The dated moments on the Who We Are timeline, in order.",
    icon: Milestone,
    group: "Publishing",
  },
  {
    key: "programmes",
    slug: "programmes",
    label: "Programmes",
    singular: "programme",
    description: "What FXB Rwanda runs, where, and for how long.",
    icon: Map,
    group: "Programmes",
  },
  {
    key: "areas",
    slug: "areas-of-intervention",
    label: "Areas of intervention",
    singular: "area",
    description:
      "The areas FXB Rwanda works in — the cards on What We Do and the pillars on the home page. Core areas lead; the others follow them.",
    icon: Layers,
    group: "Programmes",
  },
  {
    key: "opportunities",
    slug: "opportunities",
    label: "Opportunities",
    singular: "opportunity",
    description: "Job openings and procurement notices.",
    icon: Briefcase,
    group: "Programmes",
  },
  {
    key: "board",
    slug: "board",
    label: "Board of Directors",
    singular: "board member",
    description: "The board, in the order they should appear.",
    icon: Users,
    group: "People",
  },
  {
    key: "partners",
    slug: "partners",
    label: "Partners",
    singular: "partner",
    description: "Organisations shown on the partner walls.",
    icon: Building2,
    group: "People",
  },
  {
    key: "media",
    slug: "media",
    label: "Media",
    singular: "file",
    description: "Photographs and files. Upload once, use anywhere.",
    icon: ImageIcon,
    group: "Library",
  },
];

export const globals: Entry[] = [
  {
    key: "site-settings",
    slug: "site-details",
    label: "Site details",
    singular: "site details",
    description: "Address, phone, email, social links, vision and mission.",
    icon: Settings,
    group: "Settings",
  },
  {
    key: "impact",
    slug: "impact",
    label: "Impact figures",
    singular: "impact figures",
    description: "The reach figures on the home page and Our Impact.",
    icon: Sparkles,
    group: "Settings",
  },
  {
    key: "banner",
    slug: "banner",
    label: "Home page banner",
    singular: "home page banner",
    description:
      "A campaign strip across the top of the home page — Kwibuka, a fundraising appeal. Off the rest of the year.",
    icon: Megaphone,
    group: "Settings",
  },
];

/**
 * The mailing list is its own group, not a corner of Publishing.
 *
 * Publications already contains newsletters — the quarterly PDFs — and an email
 * campaign is a different object with different consequences: one is a file on a
 * page, the other goes to several hundred inboxes and cannot be taken back.
 * Keeping them apart in the sidebar is the cheapest way to stop somebody
 * conflating the two.
 */
export const GROUPS = [
  "Publishing",
  "Programmes",
  "People",
  "Mailing list",
  "Library",
  "Settings",
] as const;

/**
 * The mailing list pages.
 *
 * Listed separately from `collections` because neither is a plain document
 * list: subscribers are rows nobody writes by hand, and a campaign has a Send
 * button, which is not something the generic edit form should ever grow.
 */
export const mailing: Entry[] = [
  {
    key: "subscribers",
    slug: "subscribers",
    label: "Subscribers",
    singular: "subscriber",
    description: "Everyone who has asked to receive the newsletter.",
    icon: AtSign,
    group: "Mailing list",
  },
  {
    key: "campaigns",
    slug: "campaigns",
    label: "Email campaigns",
    singular: "campaign",
    description: "Write a newsletter and send it to the list.",
    icon: Send,
    group: "Mailing list",
  },
];

/**
 * The registers.
 *
 * Pages that list rows the website wrote, which nobody types here and nobody
 * edits — the same reason `mailing` is separate from `collections`. An
 * application is a record of something a person did on a particular day; it is
 * read, replied to and kept, never corrected.
 */
export const registers: Entry[] = [
  {
    key: "sections",
    slug: "sections",
    label: "Page sections",
    singular: "section",
    description:
      "The headings, introductions and banner photographs on the site's pages.",
    icon: Type,
    group: "Settings",
  },
  {
    key: "users",
    slug: "users",
    // Not "People": the sidebar already has a PEOPLE group heading over the
    // board and the partners, and an item of the same name under Settings
    // reads as a mistake.
    label: "Staff accounts",
    singular: "person",
    description: "Who can sign in to this panel.",
    icon: UserCog,
    group: "Settings",
  },
  {
    key: "messages",
    slug: "messages",
    label: "Messages",
    singular: "message",
    description: "Everything sent through the contact form.",
    icon: Mail,
    group: "People",
  },
  {
    key: "applications",
    slug: "applications",
    label: "Applications",
    singular: "application",
    description: "People who have applied for a position through the website.",
    icon: Inbox,
    group: "People",
  },
];

export function findCollection(slug: string): Entry | undefined {
  return collections.find((entry) => entry.slug === slug);
}
