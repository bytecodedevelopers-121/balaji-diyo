import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ThumbnailField } from "@/components/site-content/ThumbnailField";
import type { FieldDef } from "@/types/page-content";

type Row = Record<string, unknown>;

interface Props {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

const asString = (value: unknown) => (typeof value === "string" ? value : value == null ? "" : String(value));

/** A blank row for a list field: every sub-field empty. */
const emptyRow = (fields: FieldDef[]): Row =>
  Object.fromEntries(fields.map((f) => [f.key, f.kind === "number" ? 0 : f.kind === "list" ? [] : ""]));

/** Renders the right input for one field of a section; `list` fields nest their own rows. */
export function FieldInput({ field, value, onChange }: Props) {
  const id = `field-${field.key}`;

  switch (field.kind) {
    case "textarea":
      return <Textarea id={id} label={field.label} hint={field.hint} rows={3} value={asString(value)} onChange={(e) => onChange(e.target.value)} />;
    case "html":
      return (
        <Textarea
          id={id}
          label={field.label}
          hint={field.hint}
          rows={8}
          className="font-mono text-xs"
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <Input
          id={id}
          type="number"
          min={0}
          label={field.label}
          hint={field.hint}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );
    case "image":
      return (
        <div>
          <ThumbnailField label={field.label} value={asString(value)} onChange={onChange} folder="page-content" noun="image" />
          {field.hint && <p className="mt-1 text-xs text-gray-500">{field.hint}</p>}
        </div>
      );
    case "select":
      return (
        <div>
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          <select
            id={id}
            value={asString(value)}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Choose…</option>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {field.hint && <p className="mt-1 text-xs text-gray-500">{field.hint}</p>}
        </div>
      );
    case "list":
      return <ListInput field={field} rows={Array.isArray(value) ? (value as Row[]) : []} onChange={onChange} />;
    default:
      return <Input id={id} label={field.label} hint={field.hint} value={asString(value)} onChange={(e) => onChange(e.target.value)} />;
  }
}

function ListInput({ field, rows, onChange }: { field: FieldDef; rows: Row[]; onChange: (rows: Row[]) => void }) {
  const itemFields = field.itemFields ?? [];
  const noun = field.itemLabel ?? "item";

  const update = (index: number, key: string, next: unknown) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: next } : row)));
  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <fieldset className="rounded-lg border border-gray-200 p-3">
      <legend className="px-1 text-sm font-medium text-gray-700">
        {field.label} <span className="font-normal text-gray-400">({rows.length})</span>
      </legend>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="rounded-md border border-gray-200 bg-gray-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                {noun} {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" aria-label={`Move ${noun} up`} disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30">
                  <ArrowUp size={14} />
                </button>
                <button type="button" aria-label={`Move ${noun} down`} disabled={index === rows.length - 1} onClick={() => move(index, 1)} className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30">
                  <ArrowDown size={14} />
                </button>
                <button type="button" aria-label={`Remove ${noun}`} onClick={() => onChange(rows.filter((_, i) => i !== index))} className="rounded p-1 text-red-600 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {itemFields.map((sub) => (
                <div key={sub.key} className={sub.kind === "textarea" || sub.kind === "html" || sub.kind === "list" || itemFields.length === 1 ? "sm:col-span-2" : undefined}>
                  <FieldInput field={sub} value={row[sub.key]} onChange={(next) => update(index, sub.key, next)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="mt-3" leftIcon={<Plus size={14} />} onClick={() => onChange([...rows, emptyRow(itemFields)])}>
        Add {noun}
      </Button>
    </fieldset>
  );
}
