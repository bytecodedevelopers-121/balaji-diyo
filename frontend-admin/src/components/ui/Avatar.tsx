import { cn } from "@/utils";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
  className?: string;
  onImageError?: () => void;
}

const SIZE_MAP: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-24 w-24 text-2xl",
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const first = words[0][0];
  const last = words[words.length - 1][0];
  return (words.length > 1 ? first + last : first).toUpperCase();
}

export function Avatar({ name, imageUrl, size = "md", className, onImageError }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn("rounded-full object-cover", SIZE_MAP[size], className)}
        onError={onImageError}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700",
        SIZE_MAP[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
