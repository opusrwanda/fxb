import type { Field } from "../fields";
import { RichTextEditor } from "./editor";
import { MediaPicker } from "./media-picker";

/**
 * The form controls, in the site's design language.
 *
 * Plain HTML inputs inside a plain form, posting to a server action. No
 * controlled state, no client-side validation, no JavaScript required to save —
 * which means the panel keeps working on a bad connection in a district office,
 * and there is no third-party form library to keep in step.
 *
 * Every control carries its label and its help text with it. An admin where the
 * guidance lives in a wiki is an admin where the guidance is not read.
 */

type ParentOption = { id: number; name: string };

type MediaOption = {
  id: number;
  filename: string;
  alt: string;
  mimeType: string;
  url: string;
  thumb: Record<string, { url?: string }> | null;
};

const inputClass =
  "w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray transition-colors duration-300 outline-none focus:border-blue";

export function FormField({
  field,
  value,
  mediaOptions,
  parentOptions,
}: {
  field: Field;
  value: unknown;
  mediaOptions: MediaOption[];
  parentOptions: ParentOption[];
}) {
  const id = `field-${field.name}`;
  const help = field.help ? `${id}-help` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-blue">
        {field.label}
        {field.required && (
          <span className="ml-1 text-green" aria-hidden="true">
            *
          </span>
        )}
        {field.required && <span className="sr-only"> (required)</span>}
      </label>

      {field.help && (
        <p id={help} className="text-[13px] leading-relaxed text-gray-80">
          {field.help}
        </p>
      )}

      <Control field={field} id={id} help={help} value={value} mediaOptions={mediaOptions} parentOptions={parentOptions} />
    </div>
  );
}

function Control({
  field,
  id,
  help,
  value,
  mediaOptions,
  parentOptions,
}: {
  field: Field;
  id: string;
  help?: string;
  value: unknown;
  mediaOptions: MediaOption[];
  parentOptions: ParentOption[];
}) {
  const shared = {
    id,
    name: field.name,
    "aria-describedby": help,
    required: field.required,
  };

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          {...shared}
          rows={field.rows ?? 4}
          defaultValue={(value as string) ?? ""}
          className={inputClass}
        />
      );

    case "richtext":
      // The editor posts its own hidden field, so `shared` — which carries
      // `required` and would put a browser validation bubble on an invisible
      // input — is deliberately not spread onto it.
      return (
        <RichTextEditor
          name={field.name}
          initialJson={(value as string) ?? ""}
          ariaLabelledBy={id}
        />
      );

    case "list":
      return (
        <textarea
          {...shared}
          rows={5}
          defaultValue={Array.isArray(value) ? (value as string[]).join("\n") : ""}
          className={inputClass}
        />
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-3">
          <input
            id={id}
            name={field.name}
            type="checkbox"
            defaultChecked={value === true}
            aria-describedby={help}
            className="size-5 accent-[var(--color-blue)]"
          />
          <span className="text-[15px] text-gray">Yes</span>
        </label>
      );

    case "select":
      return (
        <select {...shared} defaultValue={(value as string) ?? ""} className={inputClass}>
          {!field.required && <option value="">—</option>}
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case "multiselect": {
      const selected = new Set(Array.isArray(value) ? (value as string[]) : []);
      // Checkboxes rather than a multi-select list box. A <select multiple>
      // silently loses every other selection the moment somebody clicks without
      // holding ctrl, and this is the field that drives the district map.
      return (
        <fieldset
          aria-describedby={help}
          className="grid gap-x-6 gap-y-2 rounded-card border border-gray-15 p-4 sm:grid-cols-2"
        >
          <legend className="sr-only">{field.label}</legend>
          {(field.options ?? []).map((option) => (
            <label key={option.value} className="flex items-center gap-2.5">
              <input
                type="checkbox"
                name={field.name}
                value={option.value}
                defaultChecked={selected.has(option.value)}
                className="size-4 accent-[var(--color-blue)]"
              />
              <span className="text-sm text-gray">{option.label}</span>
            </label>
          ))}
        </fieldset>
      );
    }

    case "parent": {
      return (
        <select {...shared} defaultValue={value ? String(value) : ""} className={inputClass}>
          <option value="">— a programme in its own right —</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      );
    }

    case "upload": {
      const options = mediaOptions.filter((option) =>
        field.accept === "document"
          ? option.mimeType === "application/pdf"
          : option.mimeType.startsWith("image/"),
      );
      // Picked by looking at it rather than by reading a filename. Falls back
      // to this same list as a native select before hydration — see the note
      // in `media-picker.tsx`.
      return (
        <MediaPicker
          name={shared.name}
          id={shared.id}
          describedBy={shared["aria-describedby"]}
          value={value ? Number(value) : null}
          options={options}
          kind={field.accept === "document" ? "document" : "image"}
        />
      );
    }

    case "date":
      return (
        <input
          {...shared}
          type="date"
          // Already "YYYY-MM-DD" from the database, which is exactly what the
          // input wants. Nothing is parsed into a Date on the way in or out.
          defaultValue={(value as string) ?? ""}
          className={inputClass}
        />
      );

    case "number":
      return (
        <input
          {...shared}
          type="number"
          defaultValue={value === null || value === undefined ? "" : String(value)}
          className={inputClass}
        />
      );

    case "url":
      return (
        <input
          {...shared}
          type="url"
          defaultValue={(value as string) ?? ""}
          placeholder="https://"
          className={inputClass}
        />
      );

    case "slug":
      return (
        <input
          {...shared}
          type="text"
          defaultValue={(value as string) ?? ""}
          pattern="[a-z0-9-]+"
          className={`${inputClass} font-mono text-sm`}
        />
      );

    default:
      return (
        <input
          {...shared}
          type="text"
          defaultValue={(value as string) ?? ""}
          className={inputClass}
        />
      );
  }
}
