import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Drawer } from "@/components/ui/Drawer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { usePermission } from "@/hooks/usePermission";
import {
  useContacts,
  useMarkContactRead,
  useMarkContactUnread,
  useDeleteContact,
  useBulkDeleteContacts,
} from "@/hooks/queries/useContacts";
import { getErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatDate";
import { COMPANY_INFO } from "@/constants";
import { getInquiryType } from "@/constants/inquiryTypes";
import type { ContactMessage } from "@/types/contact";

/** Contact messages / inquiries. `/inquiries/:type` narrows the list to one kind (affiliate, feedback, …). */
export default function ContactsPage() {
  const { type } = useParams();
  // Keyed so paging, search and selection start fresh when switching between kinds.
  return <InquiriesView key={type ?? "all"} typeSlug={type} />;
}

function InquiriesView({ typeSlug }: { typeSlug?: string }) {
  const group = getInquiryType(typeSlug);
  const heading = group ? `${group.label} Inquiries` : "Inquiries";
  const canModerate = usePermission("update:contact");
  const canDelete = usePermission("delete:contact");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isRead, setIsRead] = useState<"" | "true" | "false">("");
  const [viewTarget, setViewTarget] = useState<ContactMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${heading} | ${COMPANY_INFO.name} Admin`;
  }, [heading]);

  const { data, isLoading, isError, isFetching, refetch } = useContacts({
    page,
    perPage: 15,
    search: search || undefined,
    isRead: isRead === "" ? undefined : isRead === "true",
    types: group?.types.join(","),
  });
  const contacts = data?.data.items ?? [];
  const meta = data?.data.meta;

  const markRead = useMarkContactRead();
  const markUnread = useMarkContactUnread();
  const deleteContact = useDeleteContact();
  const bulkDeleteContacts = useBulkDeleteContacts();

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        contacts.forEach((c) => next.delete(c.id));
        return next;
      }
      const next = new Set(prev);
      contacts.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const handleBulkDelete = () => {
    setError(null);
    bulkDeleteContacts.mutate(Array.from(selectedIds), {
      onSuccess: () => {
        setSelectedIds(new Set());
        setShowBulkDelete(false);
      },
      onError: (err) => {
        setError(getErrorMessage(err));
        setShowBulkDelete(false);
      },
    });
  };

  const handleView = (contact: ContactMessage) => {
    setViewTarget(contact);
    // Opening a message reads it — mirrors a typical inbox.
    if (canModerate && !contact.isRead) {
      markRead.mutate(contact.id, { onError: (err) => setError(getErrorMessage(err)) });
    }
  };

  const handleToggleRead = (contact: ContactMessage) => {
    setError(null);
    const mutation = contact.isRead ? markUnread : markRead;
    mutation.mutate(contact.id, { onError: (err) => setError(getErrorMessage(err)) });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteContact.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<ContactMessage>[] = [
    ...(canDelete
      ? [
          {
            key: "select",
            header: (
              <Checkbox checked={allOnPageSelected} onChange={toggleSelectAll} aria-label="Select all on page" />
            ),
            render: (c: ContactMessage) => (
              <Checkbox
                checked={selectedIds.has(c.id)}
                onChange={() => toggleSelected(c.id)}
                aria-label={`Select ${c.name}`}
              />
            ),
          } satisfies DataTableColumn<ContactMessage>,
        ]
      : []),
    {
      key: "sender",
      header: "Sender",
      render: (c) => (
        <div>
          <span className={c.isRead ? "text-gray-700" : "font-semibold text-gray-900"}>{c.name}</span>
          <div className="text-xs text-gray-500">{c.email}</div>
        </div>
      ),
    },
    { key: "type", header: "Type", render: (c) => <span className="text-sm text-gray-700">{c.type}</span> },
    {
      key: "message",
      header: "Message",
      render: (c) => <span className="line-clamp-2 max-w-md text-sm text-gray-600">{c.message}</span>,
    },
    {
      key: "isRead",
      header: "Status",
      render: (c) => <Badge label={c.isRead ? "Read" : "Unread"} variant={c.isRead ? "gray" : "blue"} />,
    },
    { key: "createdAt", header: "Submitted", render: (c) => formatDate(c.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <TableActions
          onView={() => handleView(c)}
          onEdit={canModerate ? () => handleToggleRead(c) : undefined}
          onDelete={canDelete ? () => setDeleteTarget(c) : undefined}
          canEdit={canModerate}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={heading} action={<RefreshButton isFetching={isFetching} onRefresh={refetch} />} />

      {isError && <Alert variant="error" message="Failed to load contact messages." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="max-w-sm flex-1">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search messages..."
            />
          </div>
          <div className="w-44">
            <Select
              options={[
                { value: "", label: "All messages" },
                { value: "false", label: "Unread" },
                { value: "true", label: "Read" },
              ]}
              value={isRead}
              onChange={(e) => {
                setIsRead(e.target.value as "" | "true" | "false");
                setPage(1);
              }}
            />
          </div>
          {canDelete && selectedIds.size > 0 && (
            <Button variant="danger" onClick={() => setShowBulkDelete(true)}>
              Delete Selected ({selectedIds.size})
            </Button>
          )}
        </div>

        <DataTable columns={columns} data={contacts} isLoading={isLoading} emptyMessage={group ? `No ${group.label.toLowerCase()} inquiries yet.` : "No inquiries yet."} />

        {meta && meta.total > 0 && (
          <Pagination
            page={meta.currentPage}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.perPage}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        )}
      </PageCard>

      <Drawer isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.name} size="md">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={viewTarget.isRead ? "Read" : "Unread"} variant={viewTarget.isRead ? "gray" : "blue"} />
              <span className="text-sm text-gray-500">{viewTarget.email}</span>
              {viewTarget.phone && <span className="text-sm text-gray-500">· {viewTarget.phone}</span>}
              <span className="text-sm text-gray-500">· {formatDate(viewTarget.createdAt)}</span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-400">Inquiry Type</dt>
                <dd className="text-gray-700">{viewTarget.type}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Submitted From</dt>
                <dd className="truncate text-gray-700">{viewTarget.url}</dd>
              </div>
              {viewTarget.numberOfTraveller != null && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Travellers</dt>
                  <dd className="text-gray-700">{viewTarget.numberOfTraveller}</dd>
                </div>
              )}
              {viewTarget.ipAddress && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">IP Address</dt>
                  <dd className="text-gray-700">{viewTarget.ipAddress}</dd>
                </div>
              )}
              {viewTarget.country && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Country</dt>
                  <dd className="text-gray-700">
                    {viewTarget.country}
                    {viewTarget.countryCode ? ` (${viewTarget.countryCode})` : ""}
                  </dd>
                </div>
              )}
            </dl>
            <p className="whitespace-pre-line text-sm text-gray-700">{viewTarget.message}</p>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Contact Message"
        message={`Are you sure you want to delete the message from "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteContact.isPending}
      />

      <ConfirmDialog
        isOpen={showBulkDelete}
        title="Delete Contact Messages"
        message={`Are you sure you want to delete ${selectedIds.size} selected message${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDelete(false)}
        isLoading={bulkDeleteContacts.isPending}
      />
    </div>
  );
}
