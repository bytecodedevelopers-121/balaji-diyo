import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "@/components/table/DataTable";
import { TableActions } from "@/components/table/TableActions";
import { usePermission } from "@/hooks/usePermission";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/queries/useCategories";
import { useCategoryTypes } from "@/hooks/queries/useCategoryTypes";
import { useSafeMutation } from "@/hooks/useSafeMutation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { categoryService } from "@/services/category.service";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import { TOUR_TYPE_MARKER, isBuiltInTourType, isTourType, slugify, tourTypeLabel } from "@/lib/tourTypes";
import type { Category } from "@/types/category";

type Mode = "tour-type" | "region";

interface FormState {
  title: string;
  slug: string;
  description: string;
  parentId: string;
  isActive: boolean;
}

const emptyForm = (parentId = ""): FormState => ({ title: "", slug: "", description: "", parentId, isActive: true });

/**
 * Admin page for tour types (the "1. Tour type" choices on a package) and for the regions
 * created under a tour type. Both are stored as destination categories, so they get a public
 * browse page at /<slug> like every other category.
 */
function TourTaxonomyPage({ mode }: { mode: Mode }) {
  const isRegion = mode === "region";
  const noun = isRegion ? "Region" : "Tour Type";
  const canCreate = usePermission("create:category");
  const canEdit = usePermission("update:category");
  const canDelete = usePermission("delete:category");
  const qc = useQueryClient();

  const [target, setTarget] = useState<Category | null | undefined>(undefined); // undefined = closed, null = new
  const [form, setForm] = useState<FormState>(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `${noun}s | ${COMPANY_INFO.name} Admin`;
  }, [noun]);

  const { data: typesData } = useCategoryTypes({ perPage: 100 });
  const destinationTypeId = (typesData?.data.items ?? []).find((t) => t.key === "destination")?.id;

  const { data, isLoading, isError, isFetching, refetch } = useCategories({ typeId: destinationTypeId, perPage: 200 });
  const all = useMemo(() => data?.data.items ?? [], [data]);
  const tourTypes = useMemo(() => all.filter(isTourType), [all]);
  const tourTypeIds = useMemo(() => new Set(tourTypes.map((t) => t.id)), [tourTypes]);
  const rows = useMemo(
    () => (isRegion ? all.filter((c) => c.parentId && tourTypeIds.has(c.parentId)) : tourTypes),
    [all, isRegion, tourTypes, tourTypeIds],
  );

  const create = useCreateCategory();
  const update = useSafeMutation({
    mutationFn: (v: { id: string; body: Parameters<typeof categoryService.update>[1] }) => categoryService.update(v.id, v.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
  const remove = useDeleteCategory();

  const open = (row: Category | null) => {
    setError(null);
    setForm(
      row
        ? { title: row.title, slug: row.slug ?? "", description: row.description ?? "", parentId: row.parentId ?? "", isActive: row.isActive }
        : emptyForm(isRegion ? (tourTypes[0]?.id ?? "") : ""),
    );
    setSlugTouched(!!row);
    setTarget(row);
  };

  const close = () => setTarget(undefined);

  const submit = () => {
    setError(null);
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.slug.trim()) return setError("Slug is required.");
    if (isRegion && !form.parentId) return setError("Choose the tour type this region belongs to.");
    const onError = (err: unknown) => setError(getErrorMessage(err));

    if (target) {
      update.mutate(
        {
          id: target.id,
          body: {
            title: form.title.trim(),
            slug: form.slug.trim(),
            description: form.description,
            isActive: form.isActive,
            ...(isRegion ? { parentId: form.parentId } : {}),
          },
        },
        { onSuccess: close, onError },
      );
    } else {
      if (!destinationTypeId) return setError("The 'destination' category type was not found.");
      create.mutate(
        {
          title: form.title.trim(),
          slug: form.slug.trim(),
          description: form.description || undefined,
          isActive: form.isActive,
          typeId: destinationTypeId,
          ...(isRegion ? { parentId: form.parentId } : { extraField1: TOUR_TYPE_MARKER }),
        },
        { onSuccess: close, onError },
      );
    }
  };

  const columns: DataTableColumn<Category>[] = [
    { key: "title", header: noun, render: (c) => (isRegion ? c.title : tourTypeLabel(c)) },
    ...(isRegion
      ? [{ key: "tourType", header: "Tour type", render: (c: Category) => { const p = tourTypes.find((t) => t.id === c.parentId); return p ? tourTypeLabel(p) : "—"; } }]
      : []),
    { key: "slug", header: "Slug", render: (c) => c.slug ?? "—" },
    {
      key: "regions",
      header: isRegion ? "Packages" : "Regions",
      render: (c) => String(isRegion ? (c.packageCount ?? 0) : all.filter((r) => r.parentId === c.id).length),
    },
    {
      key: "isActive",
      header: "Status",
      render: (c) => <Badge label={c.isActive ? "Active" : "Inactive"} variant={c.isActive ? "green" : "gray"} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <TableActions
          onEdit={canEdit ? () => open(c) : undefined}
          // Built-in tour types back the public navigation, so they can be edited but not deleted here.
          onDelete={canDelete && !isBuiltInTourType(c) ? () => setDeleteTarget(c) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${noun}s`}
        action={
          <>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={() => open(null)}>+ Add {noun}</Button>}
          </>
        }
      />

      {isError && <Alert variant="error" message={`Failed to load ${noun.toLowerCase()}s.`} />}
      {error && target === undefined && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        <DataTable columns={columns} data={rows} isLoading={isLoading} emptyMessage={`No ${noun.toLowerCase()}s yet.`} />
      </PageCard>

      <Drawer
        isOpen={target !== undefined}
        onClose={close}
        title={target ? `Edit ${noun}` : `New ${noun}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={submit} isLoading={create.isPending || update.isPending}>
              {target ? "Save Changes" : `Create ${noun}`}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}
          {isRegion && (
            <Select
              label="Tour type"
              required
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              placeholder="Choose a tour type"
              options={tourTypes.map((t) => ({ value: t.id, label: tourTypeLabel(t) }))}
            />
          )}
          <Input
            label={isRegion ? "Region name" : "Tour type name"}
            required
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, ...(slugTouched ? {} : { slug: slugify(title) }) }));
            }}
          />
          <Input
            label="Slug"
            required
            hint={`Public page: /${form.slug || "<slug>"}`}
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((f) => ({ ...f, slug: e.target.value }));
            }}
          />
          <Textarea label="Description" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Checkbox label="Active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${noun}`}
        message={`Delete "${deleteTarget?.title}"? It will be moved to Trash and can be restored from Categories.`}
        onConfirm={() =>
          deleteTarget &&
          remove.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: (err) => {
              setError(getErrorMessage(err));
              setDeleteTarget(null);
            },
          })
        }
        onCancel={() => setDeleteTarget(null)}
        isLoading={remove.isPending}
      />
    </div>
  );
}

export const TourTypesAdminPage = () => <TourTaxonomyPage mode="tour-type" />;
export const RegionsAdminPage = () => <TourTaxonomyPage mode="region" />;
export default TourTypesAdminPage;
