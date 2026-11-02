import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils";

const CREATE_SENTINEL = "__create_new__";

export interface CreatableOption {
  value: string;
  label: string;
}

export interface CreatableConfig {
  /** Shown in the dropdown as "+ Create New {label}". */
  label: string;
  /** Renders the inline create drawer. Call `onCreated` on success to select + merge the new option. */
  render: (props: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (option: CreatableOption) => void;
  }) => React.ReactNode;
}

interface MultiSelectTagsProps {
  options: CreatableOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Adds a "+ Create New X" entry to the dropdown that opens an inline create drawer instead of picking a tag. */
  create?: CreatableConfig;
}

export function MultiSelectTags({
  options,
  value,
  onChange,
  error,
  placeholder = "Add…",
  disabled = false,
  create,
}: MultiSelectTagsProps) {
  const [createOpen, setCreateOpen] = useState(false);
  // Options created inline via `create` show up here immediately (with the
  // right label) rather than waiting on the underlying list query to refetch.
  const [extraOptions, setExtraOptions] = useState<CreatableOption[]>([]);

  const allOptions = useMemo(() => {
    if (extraOptions.length === 0) return options;
    const known = new Set(options.map((o) => o.value));
    return [...options, ...extraOptions.filter((o) => !known.has(o.value))];
  }, [options, extraOptions]);

  const selected = new Set(value);
  const available = allOptions.filter((o) => !selected.has(o.value));
  const noMoreOptions = available.length === 0;

  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));

  const add = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (next === CREATE_SENTINEL) {
      setCreateOpen(true);
    } else if (next && !selected.has(next)) {
      onChange([...value, next]);
    }
    e.target.value = "";
  };

  const labelFor = (v: string) => allOptions.find((o) => o.value === v)?.label ?? v;

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {labelFor(tag)}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(tag)}
                  aria-label={`Remove ${labelFor(tag)}`}
                  className="ml-0.5 rounded-full p-0.5 text-indigo-500 hover:bg-indigo-200 hover:text-indigo-800 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <select
        disabled={disabled || (noMoreOptions && !create)}
        onChange={add}
        defaultValue=""
        className={cn(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900",
          "outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30",
          "disabled:cursor-not-allowed disabled:bg-gray-50",
          error ? "border-red-400 focus:border-red-400 focus:ring-red-400/30" : "border-gray-300",
        )}
      >
        <option value="" disabled>
          {noMoreOptions ? "All options selected" : placeholder}
        </option>
        {create && <option value={CREATE_SENTINEL}>{`+ Create New ${create.label}`}</option>}
        {available.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {create?.render({
        isOpen: createOpen,
        onClose: () => setCreateOpen(false),
        onCreated: (opt) => {
          setExtraOptions((e) => [...e, opt]);
          if (!selected.has(opt.value)) onChange([...value, opt.value]);
          setCreateOpen(false);
        },
      })}
    </div>
  );
}
