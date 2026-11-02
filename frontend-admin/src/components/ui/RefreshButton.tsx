import { RefreshCw } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";
import { cn } from "@/utils";

interface RefreshButtonProps {
  isFetching: boolean;
  onRefresh: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
}

export function RefreshButton({
  isFetching,
  onRefresh,
  variant = "outline",
  size = "sm",
  disabled = false,
  className,
}: RefreshButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onRefresh}
      aria-label="Refresh"
      title="Refresh"
      className={cn("!px-2", className)}
    >
      <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
    </Button>
  );
}
