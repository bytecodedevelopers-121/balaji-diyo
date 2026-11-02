import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightIcon, disabled, required, className, id, ...rest },
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
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400",
            "outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30",
            "disabled:cursor-not-allowed disabled:bg-gray-50",
            error ? "border-red-400 focus:border-red-400 focus:ring-red-400/30" : "border-gray-300",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            className,
          )}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
});
