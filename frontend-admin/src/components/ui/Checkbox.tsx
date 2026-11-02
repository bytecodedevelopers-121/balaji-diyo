import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, disabled, className, id, ...rest },
  ref,
) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-center gap-2 text-sm text-gray-700",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        disabled={disabled}
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-indigo-600",
          "outline-none transition-colors focus:ring-2 focus:ring-indigo-500/30",
          "disabled:cursor-not-allowed",
          className,
        )}
        {...rest}
      />
      {label}
    </label>
  );
});
