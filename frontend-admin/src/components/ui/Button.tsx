import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner, type SpinnerColor } from "./Spinner";
import { cn } from "@/utils";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
};

const SIZE_MAP: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2",
  lg: "text-base px-6 py-3",
};

const SPINNER_COLOR_MAP: Record<ButtonVariant, SpinnerColor> = {
  primary: "white",
  secondary: "gray",
  danger: "white",
  ghost: "gray",
  outline: "gray",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_MAP[variant],
        SIZE_MAP[size],
        className,
      )}
      {...rest}
    >
      <span className={cn("inline-flex items-center gap-2", isLoading && "invisible")}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size="sm" color={SPINNER_COLOR_MAP[variant]} />
        </span>
      )}
    </button>
  );
}
