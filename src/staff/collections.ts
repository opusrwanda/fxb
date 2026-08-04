import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FileText,
  Image as ImageIcon,
  Map,
  Newspaper,
  Settings,
  Sparkles,
  Users,
  Briefcase,
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
  | "publications"
  | "board"
  | "partners"
  | "opportunities"
  | "media";

export type GlobalKey = "site-settings" | "impact";

export type Entry = {
  key: string;
  /** The URL segment under /staff. */
  slug: string;
  label: string;
  /** Singular, for "New …" and for a document's own breadcrumb. */
  singular: string;
  description: string;
  icon: LucideIcon;
  group: "Publishing" | "Programmes" | "People" | "Library" | "Settings";
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
    key: "programmes",
    slug: "programmes",
    label: "Programmes",
    singular: "programme",
    description: "What FXB Rwanda runs, where, and for how long.",
    icon: Map,
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
];

export const GROUPS = [
  "Publishing",
  "Programmes",
  "People",
  "Library",
  "Settings",
] as const;

export function findCollection(slug: string): Entry | undefined {
  return collections.find((entry) => entry.slug === slug);
}
