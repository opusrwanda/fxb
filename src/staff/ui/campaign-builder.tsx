"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, X } from "lucide-react";

import type { CampaignContent, CampaignStory } from "@/staff/db/schema";
import { ImageDialog } from "./editor/image-dialog";
import type { PickerOption } from "./media-picker";

/**
 * Writing a newsletter the way the template lays one out.
 *
 * The template is a structure, not a letter: an intro, then repeating story
 * modules each bundling a photograph, a headline, an excerpt, a testimonial, a
 * video, a pair of photographs and its own call-to-action banner, then a
 * gallery and the closing blocks. A rich-text box cannot express that — it can
 * only produce a run of paragraphs — so this is a form shaped like the
 * template.
 *
 * Everything except a story's headline is optional, and an empty part is
 * dropped from the email rather than sent as a blank frame. That is what makes
 * one form serve both a three-story quarterly and a one-story announcement:
 * "delete the second copy" in the template's own instructions is removing a
 * story here.
 *
 * The whole structure posts as JSON in a hidden input, the same arrangement
 * the rich text editor uses — so the campaign form is still one plain form
 * posting to one server action.
 */
const input =
  "w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray transition-colors duration-300 outline-none focus:border-blue";

const EMPTY_STORY: CampaignStory = { headline: "" };

export function CampaignBuilder({
  name,
  initial,
}: {
  name: string;
  initial: CampaignContent | null;
}) {
  const [content, setContent] = useState<CampaignContent>({
    intro: initial?.intro ?? "",
    stories: initial?.stories?.length ? initial.stories : [{ ...EMPTY_STORY }],
    galleryTitle: initial?.galleryTitle ?? "",
    galleryImages: initial?.galleryImages ?? [],
    showStats: initial?.showStats !== false,
    showNews: initial?.showNews !== false,
  });

  /** Which image slot is being chosen for, or null. */
  const [picking, setPicking] = useState<null | ((url: string) => void)>(null);
  const [open, setOpen] = useState(0);

  const stories = content.stories ?? [];

  const setStory = (index: number, patch: Partial<CampaignStory>) =>
    setContent((current) => ({
      ...current,
      stories: (current.stories ?? []).map((story, i) =>
        i === index ? { ...story, ...patch } : story,
      ),
    }));

  return (
    <div className="flex flex-col gap-7">
      <input type="hidden" name={name} value={JSON.stringify(content)} />

      <div className="flex flex-col gap-2">
        <label htmlFor="intro" className="text-sm font-semibold text-blue">
          Introduction
        </label>
        <p className="text-[13px] leading-relaxed text-gray-80">
          Two or three sentences setting up this edition. It appears under
          &ldquo;Dear [name],&rdquo;, which is filled in for each reader.
        </p>
        <textarea
          id="intro"
          rows={3}
          value={content.intro ?? ""}
          onChange={(event) =>
            setContent({ ...content, intro: event.target.value })
          }
          className={input}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-blue">Stories</h3>

        {stories.map((story, index) => (
          <div key={index} className="rounded-card border border-gray-15">
            <div className="flex items-center justify-between gap-4 p-4">
              <button
                type="button"
                onClick={() => setOpen(open === index ? -1 : index)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                {open === index ? (
                  <ChevronUp className="size-4 shrink-0 text-gray-80" aria-hidden="true" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-gray-80" aria-hidden="true" />
                )}
                <span className="truncate text-[15px] font-medium text-blue">
                  {story.headline || `Story ${index + 1}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    stories: stories.filter((_, i) => i !== index),
                  })
                }
                aria-label={`Remove story ${index + 1}`}
                className="shrink-0 text-gray transition-colors duration-300 hover:text-blue"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>

            {open === index && (
              <div className="flex flex-col gap-5 border-t border-gray-15 p-5">
                <Text
                  label="Label above (optional)"
                  help='e.g. "Featured story". Leave empty to hide it.'
                  value={story.eyebrow ?? ""}
                  onChange={(v) => setStory(index, { eyebrow: v })}
                />
                <Picture
                  label="Main photograph"
                  value={story.imageUrl}
                  onPick={() => setPicking(() => (url: string) => setStory(index, { imageUrl: url }))}
                  onClear={() => setStory(index, { imageUrl: undefined })}
                />
                <Text
                  label="Headline"
                  value={story.headline ?? ""}
                  onChange={(v) => setStory(index, { headline: v })}
                />
                <Text
                  label="Excerpt"
                  help="Two or three sentences."
                  multiline
                  value={story.excerpt ?? ""}
                  onChange={(v) => setStory(index, { excerpt: v })}
                />
                <Text
                  label="Link to the full story"
                  help="Where “Read the full story →” goes."
                  value={story.url ?? ""}
                  onChange={(v) => setStory(index, { url: v })}
                />

                <Group title="Testimonial">
                  <Text
                    label="Quote"
                    multiline
                    value={story.quote ?? ""}
                    onChange={(v) => setStory(index, { quote: v })}
                  />
                  <Text
                    label="Who said it"
                    value={story.quoteAuthor ?? ""}
                    onChange={(v) => setStory(index, { quoteAuthor: v })}
                  />
                </Group>

                <Group title="Video">
                  <Text
                    label="Video address"
                    help="YouTube, Vimeo or a file. It opens in a browser — no email client can play a video."
                    value={story.videoUrl ?? ""}
                    onChange={(v) => setStory(index, { videoUrl: v })}
                  />
                  <Text
                    label="Video title"
                    value={story.videoTitle ?? ""}
                    onChange={(v) => setStory(index, { videoTitle: v })}
                  />
                  <Picture
                    label="Video thumbnail"
                    value={story.videoThumbnailUrl}
                    onPick={() =>
                      setPicking(() => (url: string) => setStory(index, { videoThumbnailUrl: url }))
                    }
                    onClear={() => setStory(index, { videoThumbnailUrl: undefined })}
                  />
                </Group>

                <Group title="Two photographs">
                  <Picture
                    label="Left"
                    value={story.photoAUrl}
                    onPick={() => setPicking(() => (url: string) => setStory(index, { photoAUrl: url }))}
                    onClear={() => setStory(index, { photoAUrl: undefined })}
                  />
                  <Picture
                    label="Right"
                    value={story.photoBUrl}
                    onPick={() => setPicking(() => (url: string) => setStory(index, { photoBUrl: url }))}
                    onClear={() => setStory(index, { photoBUrl: undefined })}
                  />
                </Group>

                <Group title="Banner">
                  <p className="text-[13px] leading-relaxed text-gray-80">
                    The coloured call-to-action under this story. It alternates
                    blue and green down the letter.
                  </p>
                  <Text
                    label="Banner headline"
                    value={story.bannerHeadline ?? ""}
                    onChange={(v) => setStory(index, { bannerHeadline: v })}
                  />
                  <Text
                    label="Banner sentence"
                    value={story.bannerSubtext ?? ""}
                    onChange={(v) => setStory(index, { bannerSubtext: v })}
                  />
                  <Text
                    label="Button label"
                    value={story.bannerCtaLabel ?? ""}
                    onChange={(v) => setStory(index, { bannerCtaLabel: v })}
                  />
                  <Text
                    label="Button link"
                    value={story.bannerCtaUrl ?? ""}
                    onChange={(v) => setStory(index, { bannerCtaUrl: v })}
                  />
                </Group>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            setContent({ ...content, stories: [...stories, { ...EMPTY_STORY }] });
            setOpen(stories.length);
          }}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-gray-15 px-5 text-sm font-semibold text-blue transition-colors duration-300 hover:border-blue"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add a story
        </button>
      </div>

      <Group title="Photo gallery">
        <p className="text-[13px] leading-relaxed text-gray-80">
          For photographs that do not belong to one story — an event, a
          training day, a site visit. Up to three.
        </p>
        <Text
          label="Gallery title"
          value={content.galleryTitle ?? ""}
          onChange={(v) => setContent({ ...content, galleryTitle: v })}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((slot) => (
            <Picture
              key={slot}
              label={`Photograph ${slot + 1}`}
              value={content.galleryImages?.[slot]}
              onPick={() =>
                setPicking(() => (url: string) =>
                  setContent((current) => {
                    const images = [...(current.galleryImages ?? [])];
                    images[slot] = url;
                    return { ...current, galleryImages: images };
                  }),
                )
              }
              onClear={() =>
                setContent((current) => {
                  const images = [...(current.galleryImages ?? [])];
                  images[slot] = "";
                  return { ...current, galleryImages: images };
                })
              }
            />
          ))}
        </div>
      </Group>

      <Group title="Closing blocks">
        <Toggle
          label="Show the impact figures"
          help="The band of three numbers, taken from Impact figures so the newsletter cannot disagree with the website."
          checked={content.showStats !== false}
          onChange={(v) => setContent({ ...content, showStats: v })}
        />
        <Toggle
          label="Show “More from FXB Rwanda”"
          help="The two most recent news items, with their photographs."
          checked={content.showNews !== false}
          onChange={(v) => setContent({ ...content, showNews: v })}
        />
      </Group>

      {picking && (
        <ImageDialog
          onChoose={(option: PickerOption) => {
            picking(option.url);
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-card border border-gray-15 p-4">
      <legend className="px-2 text-[13px] font-semibold tracking-wide text-gray-80 uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Text({
  label,
  help,
  value,
  onChange,
  multiline,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-blue">{label}</span>
      {help && <span className="text-[13px] leading-relaxed text-gray-80">{help}</span>}
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={input}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={input}
        />
      )}
    </label>
  );
}

function Picture({
  label,
  value,
  onPick,
  onClear,
}: {
  label: string;
  value?: string;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-blue">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPick}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-card border border-gray-15 p-2 text-left transition-colors duration-300 hover:border-blue"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="size-12 shrink-0 rounded-[10px] bg-blue-08 object-cover"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-gray-15 text-gray-80">
              <ImagePlus className="size-5" aria-hidden="true" />
            </span>
          )}
          <span className="truncate text-sm text-gray">
            {value ? value.split("/").pop() : "Choose a photograph"}
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${label}`}
            className="shrink-0 text-gray transition-colors duration-300 hover:text-blue"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-5 accent-[var(--color-blue)]"
      />
      <span>
        <span className="block text-sm font-semibold text-blue">{label}</span>
        {help && (
          <span className="mt-1 block text-[13px] leading-relaxed text-gray-80">
            {help}
          </span>
        )}
      </span>
    </label>
  );
}
