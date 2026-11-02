import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Camera, FileText, Upload } from "lucide-react";
import { useFileUpload, type BucketType } from "@/hooks/useFileUpload";
import { getPublicUrl } from "@/lib/storage";
import { cn } from "@/utils";
import { SecureImage } from "./SecureImage";

interface FileUploadProps {
  label?: string;
  accept?: string;
  bucket: BucketType;
  storagePath: string; // path WITHOUT extension
  currentPath?: string | null;
  onUploadComplete: (path: string) => void;
  error?: string;
  required?: boolean;
  hint?: string;
  type?: "image" | "document";
  disabled?: boolean;
  compact?: boolean;
}

function filenameFromPath(path: string): string {
  return path.split("/").pop() ?? path;
}

export function FileUpload({
  label,
  accept,
  bucket,
  storagePath,
  currentPath,
  onUploadComplete,
  error,
  required,
  hint,
  type = "image",
  disabled = false,
  compact = false,
}: FileUploadProps) {
  const { upload, isUploading, progress, error: uploadError, reset } = useFileUpload();
  const [previewPath, setPreviewPath]   = useState<string | null | undefined>(currentPath);
  const [uploadedAt, setUploadedAt]     = useState<number | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) return;
    reset();
    try {
      const result = await upload(file, storagePath, bucket);
      setPreviewPath(result.path);
      setUploadedAt(Date.now()); // bust browser cache for same-path overwrites
      onUploadComplete(result.path);
    } catch {
      // error already captured by useFileUpload
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void handleFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    void handleFile(e.dataTransfer.files?.[0]);
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const displayError = error ?? uploadError ?? undefined;

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onInputChange} disabled={disabled} />

      {compact ? (
        <div className={cn("flex items-center gap-2", disabled && "opacity-50")}>
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            className="shrink-0 rounded border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed"
          >
            Choose File
          </button>
          <span className="truncate text-xs text-gray-500">
            {previewPath ? filenameFromPath(previewPath) : "No file chosen"}
          </span>
        </div>
      ) : (
        <div
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors",
            isDragging && "border-indigo-500 bg-indigo-50",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {type === "image" ? (
            <>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                {previewPath ? (
                  bucket === "public" ? (
                    <img
                      src={`${getPublicUrl(previewPath)}${uploadedAt ? `?t=${uploadedAt}` : ""}`}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <SecureImage
                      path={previewPath}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      fallback={<Camera className="h-6 w-6 text-gray-400" />}
                    />
                  )
                ) : (
                  <Camera className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600">Click or drag to upload</p>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                {previewPath ? (
                  <>
                    <p className="truncate text-sm font-medium text-gray-900">{filenameFromPath(previewPath)}</p>
                    <p className="text-xs text-indigo-600">Change file</p>
                  </>
                ) : (
                  <p className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Upload className="h-4 w-4" />
                    Click or drag to upload
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {isUploading && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full animate-pulse rounded-full bg-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {displayError ? (
        <p className="mt-1.5 text-xs text-red-600">{displayError}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}
