import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { B2BPartnerStatus, B2BUserRole, BookingStatus } from "@/types/b2b";

const STATUS: Record<B2BPartnerStatus, { label: string; variant: BadgeVariant }> = {
  PENDING_KYC: { label: "Pending KYC", variant: "yellow" },
  ACTIVE: { label: "Active", variant: "green" },
  SUSPENDED: { label: "Suspended", variant: "orange" },
  REJECTED: { label: "Rejected", variant: "red" },
};

const ROLE: Record<B2BUserRole, { label: string; variant: BadgeVariant }> = {
  AGENCY_ADMIN: { label: "Agency Admin", variant: "purple" },
  BOOKING_AGENT: { label: "Booking Agent", variant: "blue" },
  FINANCE_MANAGER: { label: "Finance Manager", variant: "teal" },
};

export function PartnerStatusBadge({ status }: { status: B2BPartnerStatus }) {
  const s = STATUS[status];
  return <Badge label={s.label} variant={s.variant} />;
}

export function RoleBadge({ role }: { role: B2BUserRole | null }) {
  if (!role) return <Badge label="—" variant="gray" />;
  const r = ROLE[role];
  return <Badge label={r.label} variant={r.variant} />;
}

const BOOKING_STATUS: Record<BookingStatus, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Draft", variant: "gray" },
  HELD: { label: "Held", variant: "blue" },
  PENDING_APPROVAL: { label: "Pending approval", variant: "yellow" },
  CONFIRMED: { label: "Confirmed", variant: "green" },
  AMENDMENT_REQUESTED: { label: "Amendment requested", variant: "orange" },
  CANCELLED: { label: "Cancelled", variant: "red" },
  EXPIRED: { label: "Expired", variant: "gray" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const s = BOOKING_STATUS[status];
  return <Badge label={s.label} variant={s.variant} />;
}
