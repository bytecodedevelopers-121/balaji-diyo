import { useEffect, useState, type ClipboardEvent } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Alert } from "./Alert";

interface TypedConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  message?: string;
  confirmText: string;
  confirmLabel?: string;
  inputLabel?: string;
  warningMessage?: string;
}

export function TypedConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  message,
  confirmText,
  confirmLabel = "Delete Permanently",
  inputLabel,
  warningMessage = "This action is permanent and cannot be undone.",
}: TypedConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) setTyped("");
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMatch = typed.trim() === confirmText;

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <h2 className="pt-2 text-base font-bold text-gray-900">{title}</h2>
        </div>

        <div className="space-y-4 px-5 py-4">
          {message && <p className="text-sm text-gray-600">{message}</p>}

          <Alert variant="error" message={warningMessage} />

          <Input
            label={inputLabel ?? `To confirm, type "${confirmText}" below`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onPaste={handlePaste}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!isMatch} isLoading={isLoading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
