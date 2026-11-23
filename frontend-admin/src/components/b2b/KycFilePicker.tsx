import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { KYC_DOC_TYPES, type KycDocType } from "@/types/b2b";
import { KYC_ACCEPT, MAX_KYC_FILES, newKycRow, type KycRow } from "./kyc-files";

interface Props {
  rows: KycRow[];
  onChange: (rows: KycRow[]) => void;
  disabled?: boolean;
}

export function KycFilePicker({ rows, onChange, disabled }: Props) {
  const update = (key: number, patch: Partial<KycRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="grid gap-3 rounded-xl border border-gray-200 p-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <Select
            label="Document type"
            value={row.docType}
            disabled={disabled}
            options={KYC_DOC_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(e) => update(row.key, { docType: e.target.value as KycDocType })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">File (PDF, JPG, PNG, WebP · max 10 MB)</label>
            <input
              type="file"
              accept={KYC_ACCEPT}
              disabled={disabled}
              onChange={(e) => update(row.key, { file: e.target.files?.[0] ?? null })}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label="Remove document"
            onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {rows.length < MAX_KYC_FILES && (
        <Button type="button" variant="outline" size="sm" disabled={disabled} leftIcon={<Plus className="h-4 w-4" />} onClick={() => onChange([...rows, newKycRow("TAX_CERTIFICATE")])}>
          Add another document
        </Button>
      )}
    </div>
  );
}
