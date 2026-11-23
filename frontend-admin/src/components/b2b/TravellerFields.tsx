import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { TravellerInput } from "@/types/b2b";

interface Props {
  travellers: TravellerInput[];
  onChange: (next: TravellerInput[]) => void;
  disabled?: boolean;
}

/** One card per traveller; exactly one is the lead (contact for the booking). */
export function TravellerFields({ travellers, onChange, disabled }: Props) {
  const update = (i: number, patch: Partial<TravellerInput>) => onChange(travellers.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const setLead = (i: number) => onChange(travellers.map((t, j) => ({ ...t, isLead: j === i })));

  return (
    <div className="space-y-3">
      {travellers.map((t, i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Traveller {i + 1}</p>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input type="radio" name="lead-traveller" checked={!!t.isLead} disabled={disabled} onChange={() => setLead(i)} /> Lead traveller
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Full name" required value={t.fullName} disabled={disabled} onChange={(e) => update(i, { fullName: e.target.value })} />
            <Input label="Email" type="email" required value={t.email} disabled={disabled} onChange={(e) => update(i, { email: e.target.value })} />
            <Input label="Mobile" value={t.mobileNumber ?? ""} disabled={disabled} onChange={(e) => update(i, { mobileNumber: e.target.value })} />
            <Input label="Nationality" required value={t.nationality} disabled={disabled} onChange={(e) => update(i, { nationality: e.target.value })} />
            <Input label="Country code" required placeholder="977" value={t.countryCode} disabled={disabled} onChange={(e) => update(i, { countryCode: e.target.value })} />
            <Input label="Passport no." value={t.passportNo ?? ""} disabled={disabled} onChange={(e) => update(i, { passportNo: e.target.value })} />
            <Select label="Gender" value={t.gender ?? ""} disabled={disabled} placeholder="—" options={[{ value: "Female", label: "Female" }, { value: "Male", label: "Male" }, { value: "Other", label: "Other" }]} onChange={(e) => update(i, { gender: e.target.value })} />
          </div>
        </div>
      ))}
    </div>
  );
}
