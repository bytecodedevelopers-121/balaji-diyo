import { Select, type SelectProps } from "@/components/ui/Select";
import { useAdminPartners } from "@/hooks/queries/useB2B";
import { usePackages } from "@/hooks/queries/usePackages";

type PickerProps = Omit<SelectProps, "options">;

/** ACTIVE partners (first 100) for admin forms. */
export function PartnerSelect(props: PickerProps) {
  const { data } = useAdminPartners({ status: "ACTIVE", perPage: 100 });
  return <Select placeholder="Select partner" options={(data?.data.items ?? []).map((p) => ({ value: p.id, label: `${p.legalName} (${p.partnerCode})` }))} {...props} />;
}

/** First 100 packages for admin forms. */
export function PackageSelect(props: PickerProps) {
  const { data } = usePackages({ perPage: 100 });
  return <Select placeholder="Select package" options={(data?.data.items ?? []).map((p) => ({ value: p.id, label: p.title }))} {...props} />;
}
