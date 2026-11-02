import { useMemo, useState } from "react";
import { Select, type SelectOption } from "@/components/ui/Select";
import type { CreatableConfig, CreatableOption } from "@/components/ui/MultiSelectTags";

const CREATE_SENTINEL = "__create_new__";

interface CreatableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  /** Adds a "+ Create New X" entry to the dropdown that opens an inline create drawer instead of selecting a value. */
  create?: CreatableConfig;
}

// Single-value counterpart to MultiSelectTags — same `create` config shape,
// same "sentinel option opens a drawer" mechanism. Used wherever a picker is
// a plain Select rather than a multi-select (e.g. Package's single-value
// classification dropdowns).
export function CreatableSelect({
  options,
  value,
  onChange,
  label,
  required,
  placeholder,
  error,
  hint,
  disabled,
  create,
}: CreatableSelectProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [extraOptions, setExtraOptions] = useState<CreatableOption[]>([]);

  const allOptions = useMemo(() => {
    if (extraOptions.length === 0) return options;
    const known = new Set(options.map((o) => o.value));
    return [...options, ...extraOptions.filter((o) => !known.has(o.value))];
  }, [options, extraOptions]);

  const selectOptions = create ? [{ value: CREATE_SENTINEL, label: `+ Create New ${create.label}` }, ...allOptions] : allOptions;

  return (
    <div>
      <Select
        label={label}
        required={required}
        placeholder={placeholder}
        error={error}
        hint={hint}
        disabled={disabled}
        options={selectOptions}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          if (next === CREATE_SENTINEL) {
            setCreateOpen(true);
            return;
          }
          onChange(next);
        }}
      />

      {create?.render({
        isOpen: createOpen,
        onClose: () => setCreateOpen(false),
        onCreated: (opt) => {
          setExtraOptions((e) => [...e, opt]);
          onChange(opt.value);
          setCreateOpen(false);
        },
      })}
    </div>
  );
}
