import type { Field } from "../fields";

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

type MediaOption = {
  id: number;
  filename: string;
  alt: string;
  mimeType: string;
};

const inputClass =
  "w-full rounded-card border border-gray-15 bg-white px-4 py-3 text-[15px] text-gray transition-colors duration-200 outline-none focus:border-blue";

export function FormField({
  field,
  value,
  mediaOptions,
}: {
  field: Field;
  value: unknown;
  mediaOptions: MediaOption[];
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

      <Control field={field} id={id} help={help} value={value} mediaOptions={mediaOptions} />
    </div>
  );
}

function Control({
  field,
  id,
  help,
  value,
  mediaOptions,
}: {
  field: Field;
  id: string;
  help?: string;
  value: unknown;
  mediaOptions: MediaOption[];
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
      return (
        <textarea
          {...shared}
          rows={16}
          defaultValue={(value as string) ?? ""}
          placeholder="One paragraph per block, separated by a blank line."
          className={`${inputClass} font-normal leading-relaxed`}
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

    case "upload": {
      const options = mediaOptions.filter((option) =>
        field.accept === "document"
          ? option.mimeType === "application/pdf"
          : option.mimeType.startsWith("image/"),
      );
      return (
        <select {...shared} defaultValue={value ? String(value) : ""} className={inputClass}>
          <option value="">— none —</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.filename}
              {option.alt ? ` — ${option.alt.slice(0, 60)}` : ""}
            </option>
          ))}
        </select>
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
