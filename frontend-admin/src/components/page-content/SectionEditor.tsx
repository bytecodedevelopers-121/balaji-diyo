import { useState } from "react";
import { ChevronDown, Save } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { getErrorMessage } from "@/lib/apiError";
import { cn } from "@/utils";
import { FieldInput } from "./FieldInput";
import type { PageSection, SaveSectionDto, SectionDef } from "@/types/page-content";

interface Props {
  def: SectionDef;
  saved?: PageSection;
  canEdit: boolean;
  onSave: (data: SaveSectionDto) => Promise<unknown>;
}

/** One collapsible section card: its fields, a visibility switch and a Save button. */
export function SectionEditor({ def, saved, canEdit, onSave }: Props) {
  const [open, setOpen] = useState(false);
  // Fields never saved yet start from the website's built-in value, so the editor shows what is live now.
  const [content, setContent] = useState<Record<string, unknown>>(() => {
    const initial = { ...(saved?.content ?? {}) };
    for (const field of def.fields) {
      const current = initial[field.key];
      const isBlank = current === undefined || current === null || current === "";
      if (isBlank && field.defaultValue !== undefined) initial[field.key] = field.defaultValue;
    }
    return initial;
  });
  const [isActive, setIsActive] = useState(saved?.isActive ?? true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const change = (key: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await onSave({ content, isActive });
      setDirty(false);
      setMessage({ type: "success", text: "Saved. The website updates within a minute." });
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span>
          <span className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900">{def.title}</span>
            {!isActive && <Badge label="Hidden" variant="gray" size="sm" />}
            {!saved && <Badge label="Not saved yet" variant="yellow" size="sm" />}
          </span>
          <span className="mt-0.5 block text-sm text-gray-500">{def.description}</span>
        </span>
        <ChevronDown size={18} className={cn("shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-gray-100 px-5 py-5">
          {!saved && (
            <Alert variant="warning" message="This section has no saved data yet, so the website shows its built-in copy. Run “npm run seed:page-sections” in the backend to load it here, or fill it in and save." />
          )}

          <Checkbox
            label="Show this section on the website"
            checked={isActive}
            disabled={!canEdit}
            onChange={(e) => {
              setIsActive(e.target.checked);
              setDirty(true);
            }}
          />

          {def.fields.map((field) => (
            <FieldInput key={field.key} field={field} value={content[field.key]} onChange={(value) => change(field.key, value)} />
          ))}

          {message && <Alert variant={message.type} message={message.text} />}

          {canEdit && (
            <div className="flex justify-end">
              <Button type="button" onClick={handleSave} isLoading={saving} disabled={!dirty && !!saved} leftIcon={<Save size={16} />}>
                Save section
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
