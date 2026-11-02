import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, disabled, required, className, id, rows = 3, ...rest },
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
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400",
          "outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30",
          "disabled:cursor-not-allowed disabled:bg-gray-50",
          error ? "border-red-400 focus:border-red-400 focus:ring-red-400/30" : "border-gray-300",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
});
