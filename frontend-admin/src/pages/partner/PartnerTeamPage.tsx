import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { RoleBadge } from "@/components/b2b/b2b-ui";
import { ROLE_OPTIONS } from "@/components/b2b/b2b-helpers";
import { useAuthStore } from "@/store/auth.store";
import { useInviteMember, useMyPartner, useTeam, useUpdateMember } from "@/hooks/queries/useB2B";
import { getDetailedErrorMessage, getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import type { B2BUserRole, TeamUser } from "@/types/b2b";

const inviteSchema = z.object({
  firstName: z.string().trim().min(1, "Required"),
  lastName: z.string().trim().min(1, "Required"),
  email: z.string().trim().email("Enter a valid email"),
  b2bRole: z.enum(["AGENCY_ADMIN", "BOOKING_AGENT", "FINANCE_MANAGER"]),
  password: z.string().min(8, "At least 8 characters").max(72).regex(/[A-Za-z]/, "Must contain a letter").regex(/\d/, "Must contain a digit"),
});
type InviteValues = z.infer<typeof inviteSchema>;

export default function PartnerTeamPage() {
  const myId = useAuthStore((s) => s.user?.userId);
  const { data: me } = useMyPartner();
  const canManage = me?.data.myRole === "AGENCY_ADMIN" && me.data.status === "ACTIVE";
  const { data, isLoading } = useTeam(canManage);
  const invite = useInviteMember();
  const update = useUpdateMember();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { b2bRole: "BOOKING_AGENT" },
  });

  if (me && !canManage) {
    return (
      <>
        <PageHeader title="Team" />
        <Alert variant="warning" message={me.data.status !== "ACTIVE" ? "Team management is available once your agency account is active." : "Only an agency admin can manage the team."} />
      </>
    );
  }

  const mutate = (u: TeamUser, patch: { b2bRole?: B2BUserRole; isActive?: boolean }) => {
    setError(null);
    update.mutate({ userId: u.id, ...patch }, { onError: (e) => setError(getErrorMessage(e)) });
  };

  const onInvite = (values: InviteValues) => {
    invite.mutate(values, {
      onSuccess: () => { setOpen(false); reset(); setError(null); },
      onError: (e) => setError(getDetailedErrorMessage(e)),
    });
  };

  const columns: DataTableColumn<TeamUser>[] = [
    { key: "name", header: "Name", render: (u) => (
      <div><p className="font-medium text-gray-900">{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}{u.id === myId && <span className="ml-2 text-xs text-gray-400">(you)</span>}</p><p className="text-xs text-gray-500">{u.email}</p></div>
    ) },
    { key: "role", header: "Role", render: (u) => (
      <div className="flex items-center gap-2">
        <RoleBadge role={u.b2bRole} />
        <select
          aria-label={`Change role for ${u.email}`}
          className="rounded-md border border-gray-300 px-1.5 py-1 text-xs"
          value={u.b2bRole ?? ""}
          disabled={update.isPending}
          onChange={(e) => mutate(u, { b2bRole: e.target.value as B2BUserRole })}
        >
          {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    ) },
    { key: "status", header: "Status", render: (u) => <Badge label={u.isActive ? "Active" : "Disabled"} variant={u.isActive ? "green" : "gray"} /> },
    { key: "last", header: "Last login", render: (u) => <span className="text-gray-600">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}</span> },
    { key: "actions", header: "", render: (u) => (
      <Button variant={u.isActive ? "outline" : "secondary"} size="sm" disabled={update.isPending} onClick={() => mutate(u, { isActive: !u.isActive })}>
        {u.isActive ? "Deactivate" : "Activate"}
      </Button>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Team" action={<Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => { setError(null); setOpen(true); }}>Invite member</Button>} />
      {error && !open && <div className="mb-4"><Alert variant="error" message={error} onClose={() => setError(null)} /></div>}
      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} emptyMessage="No team members yet" />

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Invite team member"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button form="invite-form" type="submit" isLoading={invite.isPending}>Send invite</Button></div>}
      >
        <form id="invite-form" onSubmit={handleSubmit(onInvite)} className="space-y-3" noValidate>
          {error && <Alert variant="error" message={error} />}
          <div className="grid grid-cols-2 gap-3">
            <Input id="inv-first" label="First name" required error={errors.firstName?.message} {...register("firstName")} />
            <Input id="inv-last" label="Last name" required error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <Input id="inv-email" type="email" label="Email" required error={errors.email?.message} {...register("email")} />
          <Select id="inv-role" label="Role" options={ROLE_OPTIONS} error={errors.b2bRole?.message} {...register("b2bRole")} />
          <Input id="inv-pass" type="password" label="Initial password" required autoComplete="new-password" hint="Share it with the member securely; they can change it after signing in." error={errors.password?.message} {...register("password")} />
        </form>
      </Modal>
    </div>
  );
}
