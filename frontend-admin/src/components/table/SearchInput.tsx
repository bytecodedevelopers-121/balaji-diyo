import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 400,
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync local state when the controlled `value` changes externally (e.g. parent
  // resets a filter) — adjusted during render rather than in an effect, per React's
  // guidance on deriving state from changed props without an extra render pass.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setLocalValue(value);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (next: string) => {
    setLocalValue(next);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(next), debounceMs);
  };

  const handleClear = () => {
    setLocalValue("");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onChange("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 my-auto mr-2 flex h-5 w-5 items-center justify-center text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
