import type { ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/utils";

export type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
}

const STYLE_MAP: Record<AlertVariant, { wrapper: string; icon: string }> = {
  success: { wrapper: "bg-green-50 border-green-200 text-green-800", icon: "text-green-500" },
  error: { wrapper: "bg-red-50 border-red-200 text-red-800", icon: "text-red-500" },
  warning: { wrapper: "bg-yellow-50 border-yellow-200 text-yellow-800", icon: "text-yellow-500" },
  info: { wrapper: "bg-blue-50 border-blue-200 text-blue-800", icon: "text-blue-500" },
};

const ICON_MAP: Record<AlertVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

export function Alert({ variant, title, message, onClose }: AlertProps) {
  const styles = STYLE_MAP[variant];

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", styles.wrapper)}>
      <span className={cn("mt-0.5 shrink-0", styles.icon)}>{ICON_MAP[variant]}</span>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <p className={title ? "mt-0.5" : undefined}>{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 rounded p-0.5 text-current/70 hover:text-current"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
