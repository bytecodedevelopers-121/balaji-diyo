import { useState } from "react";
import { Copy } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** Shows a one-time secret. It can't be dismissed by accident: closing requires ticking "I've copied it". */
export function SecretOnceModal({ title, label, secret, onClose }: { title: string; label: string; secret: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(secret).catch(() => undefined);
    setCopied(true);
  };
  return (
    <Modal isOpen onClose={() => saved && onClose()} title={title} size="lg"
      footer={<div className="flex justify-end"><Button onClick={onClose} disabled={!saved}>Done</Button></div>}>
      <div className="space-y-3">
        <Alert variant="warning" title="Copy it now" message="This value is shown only once and can't be retrieved later. If you lose it you'll need to create or rotate it again." />
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <div className="flex items-stretch gap-2">
          <code data-testid="one-time-secret" className="block flex-1 break-all rounded-lg bg-gray-900 px-3 py-2 text-xs text-green-300">{secret}</code>
          <Button variant="outline" size="sm" leftIcon={<Copy className="h-4 w-4" />} onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} /> I've stored it somewhere safe</label>
      </div>
    </Modal>
  );
}
