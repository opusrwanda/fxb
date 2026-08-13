import { districts } from "@/lib/districts";
import { STATUS_LABELS, statusesFor } from "./auth/permissions";
import type { Role, Status } from "./db/schema";

/**
 * What each document is made of.
 *
 * The form, the validation and the write are all generated from these. Adding a
 * field is one line here rather than an edit to a form, an edit to a save
 * handler and an edit to a type that somebody forgets.
 *
 * `sidebar` marks the fields that describe the document rather than being it —
 * its address, its date, whether it is published. They sit in a rail beside the
 * body so the writing has the width, which is the arrangement every editor
 * settles on eventually.
 */
export type Option = { label: string; value: string };

export type Field = {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "date"
    | "number"
    | "url"
    | "checkbox"
    | "select"
    | "multiselect"
    | "upload"
    | "parent"
    | "list"
    | "richtext"
    /**
     * The bytes themselves, not a reference to them.
     *
     * `upload` picks a file that is already in the library; `file` is how one
     * gets there. Only the media collection has it, and only when creating —
     * replacing the bytes under an existing row would leave every page that
     * already uses it showing something else.
     */
    | "file";
  help?: string;
  required?: boolean;
  sidebar?: boolean;
  options?: Option[];
  /** For upload fields: narrows what the picker offers. */
  accept?: "image" | "document";
  rows?: number;
};

/**
 * Where the document is up to.
 *
 * The options depend on who is looking, which is why the field is built rather
 * than declared: an editor is offered "send to an admin to check" and an admin
 * is not, because an admin sending work to themselves is a queue of one that
 * nobody empties. `statusesFor` is the single answer to which — this only
 * dresses it.
 */
const status = (role: Role, current?: Status): Field => {
  const offered = statusesFor(role);

  /**
   * Whatever it is now is always on the list, even if this person would not
   * have chosen it.
   *
   * An admin is not offered "send to an admin to check" — but an editor's
   * submission arrives at that status, and an admin is exactly who opens it. A
   * select whose value is not among its options does not show that value; it
   * shows the first one. So an admin opening a submitted story would have seen
   * "Draft", and saving anything at all would have quietly unsubmitted it.
   */
  const values =
    current && !offered.includes(current) ? [current, ...offered] : [...offered];

  return {
    name: "status",
    label: "Status",
    type: "select",
    sidebar: true,
    required: true,
    help:
      role === "admin"
        ? "Only published documents appear on the website."
        : "Only published documents appear on the website. You can publish this yourself, or send it to an admin to look at first.",
    options: values.map((value) => ({ label: STATUS_LABELS[value], value })),
  };
};

/**
 * The placeholder that marks where the status control goes.
 *
 * The definitions below are a plain list read by three different callers, and
 * the status field is the one entry that cannot be written down until we know
 * who is asking. So the list carries this, and `sidebarFields` swaps it for the
 * real thing — which keeps the ordering of the rail where it is declared,
 * rather than appending status to the end of every collection.
 */
const STATUS: Field = { name: "status", label: "Status", type: "select", sidebar: true };

/**
 * There is no slug field, deliberately.
 *
 * There was one on every collection that has a page — labelled "Web address",
 * required, in the sidebar, with a sentence about hyphens and a warning that
 * changing it breaks links. It asked somebody writing a news item to make a
 * decision about URL syntax before they could save, and the honest answer to
 * "what should this be?" was always "the title, with dashes".
 *
 * So the server does that. `saveDocument` derives the slug from the title on
 * create and never touches it again — see the note there on why editing a
 * title must not move the page.
 */

const districtOptions: Option[] = districts
  .map((d) => ({ label: `${d.name} (${d.province})`, value: d.name }))
  .sort((a, b) => a.label.localeCompare(b.label));

/**
 * Where a post is based, as a list rather than a text box.
 *
 * It was free text with the help "e.g. Kamonyi District, or Kigali", which is
 * two spellings of the answer in the hint itself — and the site prints this
 * verbatim on the careers listing, so "Kamonyi", "Kamonyi District" and
 * "kamonyi" all shipped as written and read as three different places.
 *
 * The same thirty districts the programme map is built from, so a location
 * typed here can never disagree with one drawn there. Two broader answers go
 * first because they are the ones a vacancy actually uses most: a head-office
 * post is in Kigali rather than in Gasabo, and a roving one is not in a
 * district at all.
 */
const locationOptions: Option[] = [
  { label: "City of Kigali", value: "City of Kigali" },
  { label: "Nationwide", value: "Nationwide" },
  ...districtOptions,
];

export const fields: Record<string, Field[]> = {
  news: [
    { name: "title", label: "Headline", type: "text", required: true },
    {
      name: "excerpt",
      label: "Excerpt",
      type: "textarea",
      required: true,
      rows: 3,
      help: "One or two sentences, shown on the listing card.",
    },
    { name: "body", label: "Article", type: "richtext" },
    { name: "date", label: "Date", type: "date", sidebar: true, required: true },
    {
      name: "language",
      label: "Language",
      type: "select",
      sidebar: true,
      help: "Marks a French article so a screen reader switches voice.",
      options: [
        { label: "English", value: "en" },
        { label: "French", value: "fr" },
      ],
    },
    {
      name: "photoId",
      label: "Photograph",
      type: "upload",
      accept: "image",
      sidebar: true,
      help: "Shown on the listing and at the top of the article.",
    },
    STATUS,
  ],

  stories: [
    { name: "title", label: "Headline", type: "text", required: true },
    {
      name: "excerpt",
      label: "Opening",
      type: "textarea",
      required: true,
      rows: 3,
      help: "Shown on the carousel and the listing.",
    },
    { name: "body", label: "Story", type: "richtext" },
    { name: "date", label: "Date", type: "date", sidebar: true, required: true },
    {
      name: "photoId",
      label: "Photograph",
      type: "upload",
      accept: "image",
      sidebar: true,
    },
    STATUS,
  ],

  programmes: [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "summary",
      label: "Summary",
      type: "textarea",
      rows: 2,
      help: "One sentence. Opens the programme's page.",
    },
    { name: "body", label: "Description", type: "richtext" },
    {
      name: "districts",
      label: "Districts",
      type: "multiselect",
      required: true,
      options: districtOptions,
      help: "Every district this programme reaches. These drive the map on Who We Are and the district counts across the site.",
    },
    {
      name: "components",
      label: "What it delivers",
      type: "list",
      help: "One per line.",
    },
    {
      name: "parentId",
      label: "Part of",
      type: "parent",
      sidebar: true,
      help: "Leave blank for a programme in its own right. Set it to FXBVillage for one of the FXBVillage projects — Mageragere, The Light Foundation, and whichever starts next — and it appears as a block under FXBVillage rather than beside it.",
    },
    {
      name: "stage",
      label: "Stage",
      type: "select",
      sidebar: true,
      required: true,
      help: "Phasing a programme out removes it from the map and the counts, and moves it to Phased-out Projects. Nothing is deleted.",
      options: [
        { label: "Currently running", value: "current" },
        { label: "Phased out", value: "phased-out" },
      ],
    },
    {
      name: "order",
      label: "Order",
      type: "number",
      sidebar: true,
      help: "Lower numbers first. Leave blank to sort by name.",
    },
    { name: "runs", label: "Runs", type: "text", sidebar: true, help: 'e.g. "August 2022 – August 2025", or "Ongoing".' },
    { name: "funder", label: "Funded by", type: "text", sidebar: true, help: "e.g. USAID." },
    {
      name: "externalUrl",
      label: "Programme system",
      type: "url",
      sidebar: true,
      help: "Only if the programme has a system of its own, like the Sugira Muryango dashboard.",
    },
    {
      name: "photoId",
      label: "Photograph",
      type: "upload",
      accept: "image",
      sidebar: true,
    },
    STATUS,
  ],

  publications: [
    { name: "title", label: "Title", type: "text", required: true, help: 'e.g. "2025 Annual Report", or "Q3 2025" for a newsletter.' },
    {
      name: "fileId",
      label: "The document",
      type: "upload",
      accept: "document",
      help: "The PDF itself. The file size shown on the site is read from it.",
    },
    {
      name: "coverId",
      label: "Cover image",
      type: "upload",
      accept: "image",
      help: "Reports and newsletters normally have one; policy documents normally do not.",
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      sidebar: true,
      required: true,
      help: "Newsletters appear on the Newsletters page. The newest Annual Report is announced in the banner at the top of every page.",
      options: [
        { label: "Annual Report", value: "annual-report" },
        { label: "Project Report or Survey", value: "project-report" },
        { label: "Policy Document", value: "policy" },
        { label: "Brochure or Factsheet", value: "brochure" },
        { label: "Newsletter", value: "newsletter" },
      ],
    },
    { name: "date", label: "Date", type: "date", sidebar: true, required: true },
    STATUS,
  ],

  milestones: [
    {
      name: "year",
      label: "Year",
      type: "text",
      required: true,
      help: 'Shown above the picture. Text rather than a number, so the last one can read "Today".',
    },
    {
      name: "body",
      label: "What happened",
      type: "textarea",
      required: true,
      rows: 4,
      help: "Two or three sentences. Longer than about sixty words and the cards stop lining up.",
    },
    {
      name: "imageId",
      label: "Photograph",
      type: "upload",
      accept: "image",
      help: "Optional. Without one the card shows its year on a tinted panel instead — which is the honest answer for a milestone nobody has an archive photograph of.",
    },
    {
      name: "order",
      label: "Order",
      type: "number",
      sidebar: true,
      required: true,
      help: "Lowest first. The timeline reads left to right in this order.",
    },
    {
      name: "current",
      label: "This is the present day",
      type: "checkbox",
      sidebar: true,
      help: 'Sets the year in green. For the "Today" entry — only one should have it.',
    },
  ],

  pageHeaders: [
    {
      name: "path",
      label: "Page",
      type: "select",
      required: true,
      help: "Every page uses the default unless it has its own banner here.",
      // A list rather than a text box. The value is matched against the URL at
      // render time, so a typo would not error — it would simply never appear,
      // which is the worst kind of broken to debug from the outside.
      options: [
        { label: "Default — every page without its own", value: "*" },
        { label: "Who We Are", value: "/who-we-are" },
        { label: "What We Do", value: "/what-we-do" },
        { label: "Our Impact", value: "/our-impact" },
        { label: "Get Involved", value: "/get-involved" },
        { label: "Contact", value: "/contact" },
        { label: "Partner With Us", value: "/get-involved/partners" },
        { label: "Careers", value: "/get-involved/careers" },
        { label: "Procurement", value: "/get-involved/procurement" },
        { label: "Donate", value: "/get-involved/donate" },
        { label: "Latest News", value: "/news-insights/news" },
        { label: "Stories", value: "/news-insights/stories" },
        { label: "Publications", value: "/news-insights/publications" },
        { label: "Newsletters", value: "/news-insights/newsletters" },
        { label: "Current Projects", value: "/what-we-do/current-projects" },
        { label: "Phased-out Projects", value: "/what-we-do/phased-out-projects" },
        { label: "Media Gallery", value: "/our-impact/media-gallery" },
      ],
    },
    {
      name: "imageId",
      label: "Background photograph",
      type: "upload",
      accept: "image",
      help: "Landscape, and busy at the edges rather than the middle — the title sits over the left of it. A dark scrim is laid over the whole picture so white type stays legible, so a bright photograph is fine.",
    },
  ],

  board: [
    { name: "name", label: "Name", type: "text", required: true, help: 'As it should appear, including any honorific — e.g. "Fr. Pierre Celestin NGOBOKA (PhD)".' },
    { name: "role", label: "Role", type: "text", required: true, help: "e.g. Chairperson." },
    {
      name: "portraitId",
      label: "Portrait",
      type: "upload",
      accept: "image",
      help: "A square portrait with the background removed. It is shown in a circle, so anything left behind the person will show.",
    },
    {
      name: "order",
      label: "Order",
      type: "number",
      sidebar: true,
      required: true,
      help: "Lower numbers first. Chairperson is 1.",
    },
  ],

  partners: [
    { name: "name", label: "Name", type: "text", required: true },
    {
      name: "logoId",
      label: "Logo",
      type: "upload",
      accept: "image",
      help: "The logo on its own, trimmed to its edges, ideally on a transparent background. Do not include a frame or a coloured box.",
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      sidebar: true,
      required: true,
      help: "Which section of the Partners page.",
      options: [
        { label: "Development Partner", value: "development" },
        { label: "Government", value: "government" },
        { label: "Institutional Donor", value: "donor" },
        { label: "Corporate", value: "corporate" },
      ],
    },
    { name: "url", label: "Website", type: "url", sidebar: true, help: "Their website, if it should link out." },
  ],

  opportunities: [
    { name: "title", label: "Title", type: "text", required: true },
    {
      name: "summary",
      label: "Summary",
      type: "textarea",
      rows: 2,
      help: "One or two lines for the listing. What the role is, in the words somebody scanning a list would use.",
    },
    { name: "body", label: "Details", type: "richtext" },
    {
      name: "documentId",
      label: "Document",
      type: "upload",
      accept: "document",
      help: "The full terms of reference or job description, if there is one.",
    },
    {
      name: "kind",
      label: "Kind",
      type: "select",
      sidebar: true,
      required: true,
      help: "Which page it appears on.",
      options: [
        { label: "Job vacancy", value: "career" },
        { label: "Procurement notice", value: "procurement" },
      ],
    },
    {
      name: "closesAt",
      label: "Closes",
      type: "date",
      sidebar: true,
      required: true,
      help: "The site stops showing it after this date, so an old vacancy cannot be applied for by mistake.",
    },
    {
      name: "location",
      label: "Location",
      type: "select",
      sidebar: true,
      options: locationOptions,
      help: "Where the post is based.",
    },
    {
      name: "employment",
      label: "Type",
      type: "text",
      sidebar: true,
      help: "e.g. Full-time, Consultancy, Internship. Shown as a tag on the listing.",
    },
    STATUS,
  ],

  media: [
    {
      name: "file",
      label: "File",
      type: "file",
      required: true,
      help: "A JPG, PNG, WebP, AVIF, GIF, SVG or PDF, up to 25MB. Smaller versions are made automatically.",
    },
    {
      name: "alt",
      label: "Description",
      type: "textarea",
      required: true,
      rows: 2,
      help: 'Describe what is in the picture, for people using a screen reader. E.g. "A woman standing in the shop she runs". Leave out "photo of".',
    },
    { name: "credit", label: "Credit", type: "text", help: "Photographer or source, if one should be shown." },
  ],
};

export const mainFields = (collection: string) =>
  (fields[collection] ?? []).filter((field) => !field.sidebar);

export const sidebarFields = (
  collection: string,
  role: Role = "admin",
  current?: Status,
) =>
  (fields[collection] ?? [])
    .filter((field) => field.sidebar)
    .map((field) => (field.name === "status" ? status(role, current) : field));
