import { useRef, useState, type DragEvent } from "react";
import { UploadCloud, Film } from "lucide-react";
import { useUploadMedia } from "@/hooks/queries/useMedia";
import { getErrorMessage } from "@/lib/apiError";
import { getPublicUrl } from "@/lib/storage";
import { cn } from "@/utils";

const ACCEPT = "video/mp4,video/webm,video/quicktime,image/webp";
const MAX_MB = 60;

interface VideoDropzoneProps {
  /** Single mode only: current value of the row, a YouTube link / id or the URL of an uploaded video. */
  value?: string;
  /** Called with the public URL of each uploaded file, one call per file. */
  onUploaded: (url: string) => void;
  /** Accept several files at once (each becomes its own video review). */
  multiple?: boolean;
}

/** True for a value that is an uploaded video file rather than a YouTube link. */
const isUploadedVideo = (value: string) => /\/files\/public\/.+\.(mp4|webm|mov|webp)(\?|$)/i.test(value);

/**
 * Drag-and-drop (or click to choose) upload for traveller videos. Files go to
 * the media library one after another and each public URL is handed to
 * `onUploaded`, so the public trip page can play them directly. With
 * `multiple`, several files can be dropped at once.
 */
export function VideoDropzone({ value = "", onUploaded, multiple = false }: VideoDropzoneProps) {
  const upload = useUploadMedia();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [position, setPosition] = useState<{ current: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (file: File): string | null => {
    if (!ACCEPT.split(",").includes(file.type)) return `${file.name}: use an MP4, WebM or MOV video, or an animated WebP.`;
    if (file.size > MAX_MB * 1024 * 1024) return `${file.name}: over ${MAX_MB} MB. Compress it, or paste a YouTube link instead.`;
    return null;
  };

  const handleFiles = async (list: FileList | File[] | null | undefined) => {
    const files = Array.from(list ?? []);
    if (files.length === 0 || progress !== null) return;
    const queue = multiple ? files : files.slice(0, 1);

    const problems: string[] = [];
    const valid = queue.filter((file) => {
      const problem = validate(file);
      if (problem) problems.push(problem);
      return !problem;
    });

    for (const [i, file] of valid.entries()) {
      setPosition({ current: i + 1, total: valid.length });
      setProgress(0);
      try {
        const res = await upload.mutateAsync({ file, folder: "videos", onProgress: setProgress });
        onUploaded(getPublicUrl(res.data.fullPath));
      } catch (err) {
        problems.push(`${file.name}: ${getErrorMessage(err)}`);
      }
    }
    setProgress(null);
    setPosition(null);
    setErrors(problems);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void handleFiles(event.dataTransfer.files);
  };

  const uploaded = !multiple && isUploadedVideo(value);
  const busy = progress !== null;
  const countLabel = position && position.total > 1 ? `Uploading ${position.current} of ${position.total} · ` : "Uploading… ";

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragging ? "border-logo-navy bg-logo-sky/10" : "border-[#e6dccd] bg-white hover:border-logo-navy",
          busy && "pointer-events-none opacity-70",
        )}
      >
        {uploaded && !busy ? (
          <>
            <Film className="size-6 text-logo-green" />
            <p className="text-sm font-semibold text-logo-navy-dark">{decodeURIComponent(value.split("/").pop() ?? "Uploaded video")}</p>
            <p className="text-xs text-on-surface-variant">Uploaded. Drop another video to replace it.</p>
          </>
        ) : (
          <>
            <UploadCloud className="size-6 text-logo-navy" />
            <p className="text-sm font-semibold text-logo-navy-dark">
              {busy
                ? `${countLabel}${progress}%`
                : multiple
                  ? "Drag and drop one or more videos here, or click to choose"
                  : "Drag and drop a video here, or click to choose"}
            </p>
            <p className="text-xs text-on-surface-variant">MP4, WebM, MOV or animated WebP, up to {MAX_MB} MB each</p>
          </>
        )}
        {busy && (
          <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-[#efe6da]">
            <div className="h-full bg-logo-sun transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {errors.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-xs text-red-600">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
