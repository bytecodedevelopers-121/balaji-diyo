import { useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { getPublicUrl } from "@/lib/storage";
import type { Media } from "@/types/media";
import type { WebStorySlide } from "@/types/site-content";

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "http://localhost:3000").replace(/\/+$/, "");
const previewSrc = (value: string) => (value.startsWith("/") ? `${SITE_URL}${value}` : value);

interface Props {
  slides: WebStorySlide[];
  onChange: (slides: WebStorySlide[]) => void;
}

/** Slides for a web story: add several images or videos from the media library, each with a caption. */
export function SlidesEditor({ slides, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const update = (i: number, patch: Partial<WebStorySlide>) => onChange(slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) => onChange(slides.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const add = (media: Media) => {
    const url = getPublicUrl(media.fullPath);
    const isVideo = (media.mime ?? "").startsWith("video/");
    onChange([...slides, isVideo ? { image: "", video: url, caption: "" } : { image: url, caption: "" }]);
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Slides (images or videos)</label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-gray-50"
        >
          <ImagePlus size={14} /> Add image / video
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-xs text-gray-500">No slides yet. Add at least one image or video.</div>
      ) : (
        <ul className="space-y-3">
          {slides.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-gray-200 p-2">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-gray-100">
                {s.video ? (
                  <video src={previewSrc(s.video)} className="size-full object-cover" muted />
                ) : (
                  <img src={previewSrc(s.image)} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-[11px] font-medium text-gray-500 uppercase">
                  {i + 1}. {s.video ? "Video" : "Image"}
                </div>
                <input
                  type="text"
                  value={s.caption}
                  onChange={(e) => update(i, { caption: e.target.value })}
                  placeholder="Caption"
                  className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                  <ArrowUp size={14} />
                </button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === slides.length - 1} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30">
                  <ArrowDown size={14} />
                </button>
                <button type="button" aria-label="Remove slide" onClick={() => remove(i)} className="rounded p-1 text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaPickerModal isOpen={open} onClose={() => setOpen(false)} onSelect={add} folder="web-stories" allowVideo />
    </div>
  );
}
