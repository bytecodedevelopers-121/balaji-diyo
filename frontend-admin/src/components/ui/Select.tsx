import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, disabled, required, className, id, ...rest },
  ref,
) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900",
          "outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30",
          "disabled:cursor-not-allowed disabled:bg-gray-50",
          error ? "border-red-400 focus:border-red-400 focus:ring-red-400/30" : "border-gray-300",
          className,
        )}
        {...rest}
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
});
