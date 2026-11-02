import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronsUp, ChevronsDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Tabs } from "@/components/layout/Tabs";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TypedConfirmDialog } from "@/components/ui/TypedConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { Pagination } from "@/components/table/Pagination";
import { SearchInput } from "@/components/table/SearchInput";
import { usePermission } from "@/hooks/usePermission";
import {
  usePackages,
  usePackagesForReorder,
  useReorderPackages,
  usePackagesForReorderPopular,
  useReorderPopularPackages,
  useDeletePackage,
  useRestorePackage,
  useHardDeletePackage,
} from "@/hooks/queries/usePackages";
import { getErrorMessage } from "@/lib/apiError";
import { toNumber } from "@/lib/decimal";
import { formatDate } from "@/lib/formatDate";
import { PATHS } from "@/constants/PATHS";
import { COMPANY_INFO } from "@/constants";
import type { Package } from "@/types/package";

function MoveArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.5">
      <path
        d={direction === "up" ? "M10 15.5V4.5M5 9l5-5 5 5" : "M10 4.5v11M5 11l5 5 5-5"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type MoveDirection = "up" | "down" | "top" | "bottom";

// Shared by the "Reorder" (Featured/list `sortOrder`) and "Reorder Popular"
// (`popularSortOrder`) screens below — same move logic, applied to whichever
// list is currently loaded.
function moveInList<T>(list: T[], index: number, direction: MoveDirection): T[] | null {
  const targetIndex =
    direction === "up" ? index - 1 : direction === "down" ? index + 1 : direction === "top" ? 0 : list.length - 1;
  if (targetIndex < 0 || targetIndex >= list.length || targetIndex === index) return null;

  const next = [...list];
  if (direction === "up" || direction === "down") {
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  } else {
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved!);
  }
  return next;
}

function OrderControls({
  index,
  total,
  disabled,
  onMove,
}: {
  index: number;
  total: number;
  disabled: boolean;
  onMove: (direction: MoveDirection) => void;
}) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const buttonClass =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onMove("top")}
        disabled={disabled || isFirst}
        title="Move to top"
        aria-label="Move to top"
        className={buttonClass}
      >
        <ChevronsUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onMove("up")}
        disabled={disabled || isFirst}
        title="Move up"
        aria-label="Move up"
        className={buttonClass}
      >
        <MoveArrowIcon direction="up" />
      </button>
      <button
        type="button"
        onClick={() => onMove("down")}
        disabled={disabled || isLast}
        title="Move down"
        aria-label="Move down"
        className={buttonClass}
      >
        <MoveArrowIcon direction="down" />
      </button>
      <button
        type="button"
        onClick={() => onMove("bottom")}
        disabled={disabled || isLast}
        title="Move to bottom"
        aria-label="Move to bottom"
        className={buttonClass}
      >
        <ChevronsDown className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function PackagesPage() {
  const navigate = useNavigate();
  const canCreate = usePermission("create:travel");
  const canEdit = usePermission("update:travel");
  const canDelete = usePermission("delete:travel");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "trash">("active");
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Package | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual "Featured" carousel/order requires seeing every active package
  // in one flat, unpaginated list (see packageService.getAllForReorder) —
  // search/pagination/trash don't make sense while it's in progress, so
  // this is a distinct mode rather than another table filter.
  const [isReordering, setIsReordering] = useState(false);
  const [orderedPackages, setOrderedPackages] = useState<Package[] | null>(null);

  // Independent "Popular" pool/order — own flag (`isPopular`), own sort
  // field (`popularSortOrder`), so curating the homepage's "Most Popular
  // Journeys" section never touches the Featured carousel/list order above.
  const [isReorderingPopular, setIsReorderingPopular] = useState(false);
  const [orderedPopularPackages, setOrderedPopularPackages] = useState<Package[] | null>(null);

  useEffect(() => {
    document.title = `Packages | ${COMPANY_INFO.name} Admin`;
  }, []);

  const isTrash = tab === "trash";
  const { data, isLoading, isError, isFetching, refetch } = usePackages({
    page,
    perPage: 10,
    search: search || undefined,
    includeTrashed: isTrash,
  });
  const packages = data?.data.items ?? [];
  const meta = data?.data.meta;

  // Mirrors the fetched list into local state so up/down clicks can
  // reorder optimistically — React's own "adjusting state during
  // rendering" pattern (not an effect) so a background refetch after a
  // successful move doesn't fight the click that triggered it.
  const { data: reorderData, isLoading: isLoadingReorder } = usePackagesForReorder(isReordering);
  const [syncedReorderData, setSyncedReorderData] = useState(reorderData);
  if (reorderData !== syncedReorderData) {
    setSyncedReorderData(reorderData);
    if (reorderData) setOrderedPackages(reorderData);
  }

  const { data: reorderPopularData, isLoading: isLoadingReorderPopular } = usePackagesForReorderPopular(isReorderingPopular);
  const [syncedReorderPopularData, setSyncedReorderPopularData] = useState(reorderPopularData);
  if (reorderPopularData !== syncedReorderPopularData) {
    setSyncedReorderPopularData(reorderPopularData);
    if (reorderPopularData) setOrderedPopularPackages(reorderPopularData);
  }

  const deletePackage = useDeletePackage();
  const restorePackage = useRestorePackage();
  const hardDeletePackage = useHardDeletePackage();
  const reorderPackages = useReorderPackages();
  const reorderPopularPackages = useReorderPopularPackages();

  const startReordering = () => {
    setTab("active");
    setPage(1);
    setSearch("");
    setIsReorderingPopular(false);
    setIsReordering(true);
  };

  const startReorderingPopular = () => {
    setTab("active");
    setPage(1);
    setSearch("");
    setIsReordering(false);
    setIsReorderingPopular(true);
  };

  const handleMove = (index: number, direction: MoveDirection) => {
    if (!orderedPackages) return;
    const next = moveInList(orderedPackages, index, direction);
    if (!next) return;

    const previous = orderedPackages;
    setOrderedPackages(next);
    reorderPackages.mutate(
      next.map((p) => p.id),
      { onError: (err) => {
          setOrderedPackages(previous);
          setError(getErrorMessage(err));
        },
      },
    );
  };

  const handleMovePopular = (index: number, direction: MoveDirection) => {
    if (!orderedPopularPackages) return;
    const next = moveInList(orderedPopularPackages, index, direction);
    if (!next) return;

    const previous = orderedPopularPackages;
    setOrderedPopularPackages(next);
    reorderPopularPackages.mutate(
      next.map((p) => p.id),
      { onError: (err) => {
          setOrderedPopularPackages(previous);
          setError(getErrorMessage(err));
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deletePackage.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const handleRestore = (pkg: Package) => {
    setError(null);
    restorePackage.mutate(pkg.id, { onError: (err) => setError(getErrorMessage(err)) });
  };

  const handleHardDelete = () => {
    if (!hardDeleteTarget) return;
    setError(null);
    hardDeletePackage.mutate(hardDeleteTarget.id, {
      onSuccess: () => setHardDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setHardDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Package>[] = [
    { key: "title", header: "Title", render: (p) => <span className="font-medium text-gray-900">{p.title}</span> },
    { key: "destination", header: "Destination", render: (p) => p.destination?.title ?? "—" },
    { key: "price", header: "Price", render: (p) => `$${toNumber(p.price) ?? 0}` },
    { key: "duration", header: "Duration", render: (p) => `${toNumber(p.duration) ?? 0} ${p.durationType}` },
    {
      key: "isFeatured",
      header: "Featured",
      render: (p) => <Badge label={p.isFeatured ? "Featured" : "—"} variant={p.isFeatured ? "indigo" : "gray"} />,
    },
    {
      key: "isActive",
      header: "Status",
      render: (p) =>
        p.deletedAt ? (
          <Badge label="Deleted" variant="red" />
        ) : (
          <Badge label={p.isActive ? "Active" : "Inactive"} variant={p.isActive ? "green" : "gray"} />
        ),
    },
    // Real, admin-editable field (2026-09-07 follow-up) — was createdAt
    // at first, but that never changes once a package is created, so an
    // admin had no way to update the date shown here. Admin-only per
    // earlier explicit direction (not shown on the public site).
    { key: "publishedAt", header: "Published", render: (p) => formatDate(p.publishedAt) },
    {
      key: "actions",
      header: "Actions",
      render: (p) =>
        isTrash ? (
          <TableActions
            onRestore={canDelete ? () => handleRestore(p) : undefined}
            onHardDelete={canDelete ? () => setHardDeleteTarget(p) : undefined}
            canDelete={canDelete}
            isRestoring={restorePackage.isPending}
          />
        ) : (
          <TableActions
            onEdit={canEdit ? () => navigate(PATHS.PACKAGE_DETAIL(p.id)) : undefined}
            onDelete={canDelete ? () => setDeleteTarget(p) : undefined}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ),
    },
  ];

  const buildReorderColumns = (
    items: Package[] | null,
    isPending: boolean,
    onMove: (index: number, direction: MoveDirection) => void,
  ): DataTableColumn<Package>[] => [
    {
      key: "order",
      header: "Order",
      width: "152px",
      render: (_p, index) => (
        <OrderControls index={index} total={items?.length ?? 0} disabled={isPending} onMove={(direction) => onMove(index, direction)} />
      ),
    },
    { key: "title", header: "Title", render: (p) => <span className="font-medium text-gray-900">{p.title}</span> },
    { key: "destination", header: "Destination", render: (p) => p.destination?.title ?? "—" },
    {
      key: "isFeatured",
      header: "Featured",
      render: (p) => <Badge label={p.isFeatured ? "Featured" : "—"} variant={p.isFeatured ? "indigo" : "gray"} />,
    },
  ];

  const reorderColumns = buildReorderColumns(orderedPackages, reorderPackages.isPending, handleMove);
  const reorderPopularColumns = buildReorderColumns(orderedPopularPackages, reorderPopularPackages.isPending, handleMovePopular);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packages"
        action={
          <div className="flex items-center gap-2">
            {!isReordering && !isReorderingPopular && <RefreshButton isFetching={isFetching} onRefresh={refetch} />}
            {!isReordering && !isReorderingPopular && (
              <Button variant="outline" onClick={startReordering}>
                Reorder
              </Button>
            )}
            {!isReordering && !isReorderingPopular && (
              <Button variant="outline" onClick={startReorderingPopular}>
                Reorder Popular
              </Button>
            )}
            {(isReordering || isReorderingPopular) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setIsReordering(false);
                  setIsReorderingPopular(false);
                }}
              >
                Done
              </Button>
            )}
            {!isReordering && !isReorderingPopular && canCreate && (
              <Button onClick={() => navigate(PATHS.PACKAGE_CREATE)}>+ New Package</Button>
            )}
          </div>
        }
      />

      {isError && <Alert variant="error" message="Failed to load packages." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      {isReordering ? (
        <PageCard padding="sm">
          <p className="mb-4 text-sm text-gray-500">
            Use the arrows to reorder, or the double arrows to jump a package straight to the top or bottom. This is
            the order packages appear in, both in this list and among featured packages on the homepage.
          </p>
          <DataTable
            columns={reorderColumns}
            data={orderedPackages ?? []}
            isLoading={isLoadingReorder && !orderedPackages}
            emptyMessage="No active packages to reorder."
          />
        </PageCard>
      ) : isReorderingPopular ? (
        <PageCard padding="sm">
          <p className="mb-4 text-sm text-gray-500">
            Only packages flagged &ldquo;Popular&rdquo; (in a package&rsquo;s Tour Status section) show up here. Use
            the arrows to reorder — this is the order they appear in the homepage&rsquo;s &ldquo;Most Popular
            Journeys&rdquo; section, independent of the Featured/list order above.
          </p>
          <DataTable
            columns={reorderPopularColumns}
            data={orderedPopularPackages ?? []}
            isLoading={isLoadingReorderPopular && !orderedPopularPackages}
            emptyMessage='No packages flagged Popular yet. Edit a package and check "Popular" in its Tour Status section.'
          />
        </PageCard>
      ) : (
      <PageCard padding="sm">
        <div className="mb-4">
          <Tabs
            tabs={[
              { value: "active", label: "Active" },
              { value: "trash", label: "Trash" },
            ]}
            value={tab}
            onChange={(v) => {
              setTab(v as "active" | "trash");
              setPage(1);
            }}
          />
        </div>

        <div className="mb-4 max-w-sm">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search packages..."
          />
        </div>

        <DataTable
          columns={columns}
          data={packages}
          isLoading={isLoading}
          emptyMessage={isTrash ? "Trash is empty." : "No packages yet."}
          emptyAction={!isTrash && canCreate ? <Button onClick={() => navigate(PATHS.PACKAGE_CREATE)}>+ New Package</Button> : undefined}
        />

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
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Package"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? It will be moved to Trash and can be restored later.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deletePackage.isPending}
      />

      <TypedConfirmDialog
        isOpen={!!hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        isLoading={hardDeletePackage.isPending}
        title="Delete Package Permanently"
        message={`"${hardDeleteTarget?.title}" and its SEO data and image links will be erased for good. This cannot be restored.`}
        confirmText="DELETE"
      />
    </div>
  );
}
