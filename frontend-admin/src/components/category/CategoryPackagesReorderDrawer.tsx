import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { ReorderDrawer } from "@/components/ui/ReorderDrawer";
import { usePackagesInCategory, useReorderPackagesInCategory } from "@/hooks/queries/usePackages";
import { getErrorMessage } from "@/lib/apiError";
import type { Category } from "@/types/category";

interface CategoryPackagesReorderDrawerProps {
  category: Category;
  onClose: () => void;
}

// Sets the order packages appear in on this category's public page
// (e.g. /nepal-tour-packages, /everest-region-treks). Independent per
// category — one package can sit first in one category and last in another.
export function CategoryPackagesReorderDrawer({ category, onClose }: CategoryPackagesReorderDrawerProps) {
  const [error, setError] = useState<string | null>(null);
  const { data: packages, isLoading, isError } = usePackagesInCategory(category.id);
  const reorder = useReorderPackagesInCategory();

  const items = useMemo(
    () => (packages ?? []).map((p) => ({ id: p.id, label: p.title, isActive: p.isActive })),
    [packages],
  );

  const handleSave = (ids: string[]) => {
    setError(null);
    reorder.mutate(
      { categoryId: category.id, ids },
      { onSuccess: onClose, onError: (err) => setError(getErrorMessage(err)) },
    );
  };

  return (
    <ReorderDrawer
      title={`Reorder packages — ${category.title}`}
      description={`Drag rows by the handle, or use the arrows. Packages show in this order on ${
        category.slug ? `/${category.slug}` : "this category's page"
      }. Inactive packages are hidden on the site but keep their place.`}
      items={items}
      isLoading={isLoading}
      onClose={onClose}
      onSave={handleSave}
      isSaving={reorder.isPending}
      alert={
        (error || isError) && (
          <Alert variant="error" message={error ?? "Failed to load packages."} onClose={error ? () => setError(null) : undefined} />
        )
      }
    />
  );
}
