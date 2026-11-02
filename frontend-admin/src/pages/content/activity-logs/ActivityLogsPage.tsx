import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Drawer } from "@/components/ui/Drawer";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { useActivityLogs } from "@/hooks/queries/useActivityLogs";
import { COMPANY_INFO } from "@/constants";
import type { ActivityLog } from "@/types/activity-log";

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
      <pre className="max-h-64 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [loggerType, setLoggerType] = useState("");
  const [loggerId, setLoggerId] = useState("");
  const [actionCategory, setActionCategory] = useState("");
  const [viewTarget, setViewTarget] = useState<ActivityLog | null>(null);

  useEffect(() => {
    document.title = `Activity Log | ${COMPANY_INFO.name} Admin`;
  }, []);

  const { data, isLoading, isError, isFetching, refetch } = useActivityLogs({
    page,
    perPage: 20,
    loggerType: loggerType || undefined,
    loggerId: loggerId || undefined,
    actionCategory: actionCategory || undefined,
  });
  const logs = data?.data.items ?? [];
  const meta = data?.data.meta;

  const columns: DataTableColumn<ActivityLog>[] = [
    { key: "createdAt", header: "When", render: (l) => new Date(l.createdAt).toLocaleString() },
    {
      key: "actor",
      header: "Actor",
      render: (l) => (
        <div>
          <Badge label={l.loggerType} variant={l.loggerType === "admin" ? "indigo" : "blue"} size="sm" />
          <div className="mt-0.5 truncate text-xs text-gray-700">
            {l.actor ? (l.actor.name ?? l.actor.email) : l.loggerId}
          </div>
          {l.actor?.name && <div className="truncate text-xs text-gray-400">{l.actor.email}</div>}
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (l) => (
        <div>
          <span className="text-sm text-gray-800">{l.actionTitle ?? l.primaryAction ?? l.clientAction ?? "—"}</span>
          {l.actionMethod && <div className="text-xs text-gray-400">{l.actionMethod}</div>}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (l) => (l.actionCategory ? <Badge label={l.actionCategory} variant="gray" size="sm" /> : <span className="text-gray-400">—</span>),
    },
    {
      key: "actions",
      header: "",
      render: (l) => <TableActions onView={() => setViewTarget(l)} canEdit={false} canDelete={false} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Log" action={<RefreshButton isFetching={isFetching} onRefresh={refetch} />} />

      {isError && <Alert variant="error" message="Failed to load activity logs." />}

      <PageCard padding="sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Select
              options={[
                { value: "", label: "All actors" },
                { value: "admin", label: "Admin" },
                { value: "user", label: "User" },
              ]}
              value={loggerType}
              onChange={(e) => {
                setLoggerType(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-48">
            <Input
              placeholder="Filter by actor ID..."
              value={loggerId}
              onChange={(e) => {
                setLoggerId(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-48">
            <Input
              placeholder="Filter by category..."
              value={actionCategory}
              onChange={(e) => {
                setActionCategory(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <DataTable columns={columns} data={logs} isLoading={isLoading} emptyMessage="No activity logged yet." onRowClick={setViewTarget} />

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

      <Drawer isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Activity Detail" size="md">
        {viewTarget && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-400">When</dt>
                <dd className="text-gray-700">{new Date(viewTarget.createdAt).toLocaleString()}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-400">Actor</dt>
                {viewTarget.actor ? (
                  <dd className="text-gray-700">
                    {viewTarget.actor.name ?? "—"}
                    <span className="ml-1 break-all text-gray-400">({viewTarget.actor.email})</span>
                  </dd>
                ) : (
                  <dd className="break-all text-gray-700">
                    {viewTarget.loggerType} · <span className="text-gray-400">{viewTarget.loggerId}</span>
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Primary Action</dt>
                <dd className="text-gray-700">{viewTarget.primaryAction ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Client Action</dt>
                <dd className="text-gray-700">{viewTarget.clientAction ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Method</dt>
                <dd className="text-gray-700">{viewTarget.actionMethod ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Category</dt>
                <dd className="text-gray-700">
                  {viewTarget.actionCategory ?? "—"}
                  {viewTarget.actionCategoryKey ? ` (${viewTarget.actionCategoryKey})` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Title</dt>
                <dd className="text-gray-700">{viewTarget.actionTitle ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Key</dt>
                <dd className="text-gray-700">{viewTarget.actionKey ?? "—"}</dd>
              </div>
            </dl>

            <JsonBlock label="Request Data" value={viewTarget.actionData} />
            <JsonBlock label="Response" value={viewTarget.actionResponse} />
          </div>
        )}
      </Drawer>
    </div>
  );
}
