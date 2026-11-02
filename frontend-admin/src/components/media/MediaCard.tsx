import { Play } from "lucide-react";
import { getPublicUrl } from "@/lib/storage";
import { cn } from "@/utils";
import type { Media } from "@/types/media";

interface MediaCardProps {
  media: Media;
  selected?: boolean;
  onClick?: () => void;
}

export function MediaCard({ media, selected, onClick }: MediaCardProps) {
  const isVideo = media.mime?.startsWith("video/") ?? false;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative aspect-square w-full overflow-hidden rounded-lg border bg-gray-50 transition-all",
        selected ? "border-indigo-500 ring-2 ring-indigo-500/40" : "border-gray-200 hover:border-gray-300",
      )}
    >
      {isVideo ? (
        <>
          <video src={getPublicUrl(media.fullPath)} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Play className="h-6 w-6 fill-white text-white drop-shadow" />
          </div>
        </>
      ) : (
        <img
          src={getPublicUrl(media.fullPath)}
          alt={media.altText ?? media.fullName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {media.fullName}
      </div>
    </button>
  );
}
