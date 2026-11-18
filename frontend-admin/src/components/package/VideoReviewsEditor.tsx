import { useState } from "react";
import { Film, Link2, Play, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VideoDropzone } from "@/components/package/VideoDropzone";
import { cn } from "@/utils";

export interface VideoReviewItem {
  /** Index of the row in the form's facts array (used to remove it). */
  index: number;
  value: string;
}

interface VideoReviewsEditorProps {
  items: VideoReviewItem[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}

/** The 11-character YouTube id inside a link, or the value itself when it already is one. */
function youtubeId(value: string): string | null {
  const trimmed = value.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return match ? match[1] : null;
}

type Kind = "youtube" | "webp" | "video";

function describe(value: string): { kind: Kind; id?: string; label: string } {
  const id = youtubeId(value);
  if (id) return { kind: "youtube", id, label: `youtube.com/watch?v=${id}` };
  const name = decodeURIComponent(value.split("/").pop()?.split("?")[0] ?? value);
  return { kind: /\.webp(\?|$)/i.test(value) ? "webp" : "video", label: name };
}

const KIND_BADGE: Record<Kind, { text: string; className: string }> = {
  youtube: { text: "YouTube", className: "bg-red-600 text-white" },
  webp: { text: "Animated WebP", className: "bg-logo-green text-white" },
  video: { text: "Uploaded video", className: "bg-logo-navy-dark text-white" },
};

function Preview({ value }: { value: string }) {
  const info = describe(value);
  if (info.kind === "youtube") {
    return (
      <>
        <img src={`https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`} alt="" className="size-full object-cover" loading="lazy" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-logo-navy-dark shadow">
          <Play className="ml-0.5 size-5 fill-current" />
        </span>
      </>
    );
  }
  if (info.kind === "webp") {
    return <img src={value} alt="" className="size-full object-cover" loading="lazy" />;
  }
  return <video src={`${value}#t=0.5`} className="size-full object-cover" muted playsInline preload="metadata" controls />;
}

/**
 * Video reviews for a package: drop or pick several video files, or add a
 * YouTube link; every video is a preview card (laid out like the public
 * "Video Reviews" section) that can be removed.
 */
export function VideoReviewsEditor({ items, onAdd, onRemove }: VideoReviewsEditorProps) {
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const addLink = () => {
    const value = link.trim();
    if (!value) return;
    if (!youtubeId(value)) {
      setLinkError("That doesn't look like a YouTube link. Paste the video's address or its 11-character id.");
      return;
    }
    if (items.some((item) => youtubeId(item.value) === youtubeId(value))) {
      setLinkError("That video is already added.");
      return;
    }
    onAdd(value);
    setLink("");
    setLinkError(null);
  };

  return (
    <div className="space-y-5 sm:col-span-2">
      <VideoDropzone multiple onUploaded={onAdd} />

      <div className="flex items-center gap-3 text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
        <span className="h-px flex-1 bg-[#efe6da]" />
        or add a YouTube link
        <span className="h-px flex-1 bg-[#efe6da]" />
      </div>

      <div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setLinkError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
              placeholder="https://www.youtube.com/watch?v=…"
              aria-label="YouTube link"
              className={cn(
                "w-full rounded-full border bg-white py-2.5 pr-4 pl-10 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-logo-navy focus:ring-2 focus:ring-logo-navy/20",
                linkError ? "border-red-400" : "border-[#e6dccd]",
              )}
            />
          </div>
          <Button type="button" onClick={addLink} leftIcon={<Video className="size-4" />}>
            Add link
          </Button>
        </div>
        {linkError && <p className="mt-1.5 text-xs text-red-600">{linkError}</p>}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-logo-navy-dark">
            Added videos <span className="ml-1 rounded-full bg-logo-sun/30 px-2 py-0.5 text-xs">{items.length}</span>
          </h4>
          {items.length > 0 && <p className="text-xs text-on-surface-variant">Click Update Package to save</p>}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#e6dccd] bg-site-row px-6 py-10 text-center">
            <Film className="size-7 text-on-surface-variant/60" />
            <p className="text-sm text-on-surface-variant">No video reviews yet. Drop a video above or add a YouTube link.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const info = describe(item.value);
              const badge = KIND_BADGE[info.kind];
              return (
                <li key={`${item.index}-${item.value}`} className="group overflow-hidden rounded-2xl border border-[#efe6da] bg-white shadow-[0_4px_16px_rgba(6,74,112,0.06)]">
                  <div className="relative aspect-[3/4] bg-[#0b2f45]">
                    <Preview value={item.value} />
                    <span className={cn("absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow", badge.className)}>{badge.text}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(item.index)}
                      aria-label="Remove this video"
                      className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-red-600 shadow transition-colors hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="truncate px-3 py-2.5 text-xs text-on-surface-variant" title={info.label}>
                    {info.label}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
