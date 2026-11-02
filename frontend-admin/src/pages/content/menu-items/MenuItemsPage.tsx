import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronUp, ChevronDown, Plus, ArrowUpDown, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageCard } from "@/components/layout/PageCard";
import { Button } from "@/components/ui/Button";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TableActions } from "@/components/table/TableActions";
import { MenuItemFormDrawer } from "@/components/menu-item/MenuItemFormDrawer";
import { ReorderDrawer } from "@/components/ui/ReorderDrawer";
import { usePermission } from "@/hooks/usePermission";
import { useMenuType } from "@/hooks/queries/useMenuTypes";
import {
  useMenuItemTree,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useReorderMenuItems,
} from "@/hooks/queries/useMenuItems";
import { getErrorMessage } from "@/lib/apiError";
import { COMPANY_INFO } from "@/constants";
import { PATHS } from "@/constants/PATHS";
import type { MenuItem, CreateMenuItemDto, UpdateMenuItemDto } from "@/types/menu-item";

type TreeNode = MenuItem & { children?: TreeNode[] };

interface ParentContext {
  id: string | null;
  label: string;
}

interface TreeRowsProps {
  nodes: TreeNode[];
  depth: number;
  canEdit: boolean;
  canDelete: boolean;
  reorderingId: string | null;
  onMove: (item: MenuItem, direction: "up" | "down", siblings: MenuItem[]) => void;
  onAddChild: (item: MenuItem) => void;
  onReorderChildren: (item: TreeNode) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
}

function TreeRows({ nodes, depth, canEdit, canDelete, reorderingId, onMove, onAddChild, onReorderChildren, onEdit, onDelete }: TreeRowsProps) {
  return (
    <>
      {nodes.map((node, idx) => (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 border-b border-gray-100 py-2 last:border-0"
            style={{ paddingLeft: depth * 24 }}
          >
            <div className="flex flex-col">
              <button
                type="button"
                title="Move up"
                aria-label="Move up"
                disabled={idx === 0 || reorderingId === node.id}
                onClick={() => onMove(node, "up", nodes)}
                className="text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Move down"
                aria-label="Move down"
                disabled={idx === nodes.length - 1 || reorderingId === node.id}
                onClick={() => onMove(node, "down", nodes)}
                className="text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className={node.isActive ? "text-sm font-medium text-gray-900" : "text-sm font-medium text-gray-400"}>
              {node.label}
            </span>
            {!node.isActive && <Badge label="Inactive" variant="gray" size="sm" />}
            {node.isExternal && (
              <Badge label="External" variant="blue" size="sm" />
            )}
            <span className="truncate text-xs text-gray-400">
              {node.isExternal ? node.externalLink : node.urlSegment ? `/${node.urlSegment.replace(/^\//, "")}` : "—"}
            </span>
            {node.isExternal && <ExternalLinkIcon className="h-3 w-3 text-gray-300" />}

            <div className="ml-auto flex items-center gap-1">
              {canEdit && (node.children?.length ?? 0) > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<ArrowUpDown className="h-3.5 w-3.5" />}
                  onClick={() => onReorderChildren(node)}
                >
                  Reorder
                </Button>
              )}
              {canEdit && (
                <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onAddChild(node)}>
                  Child
                </Button>
              )}
              <TableActions
                onEdit={canEdit ? () => onEdit(node) : undefined}
                onDelete={canDelete ? () => onDelete(node) : undefined}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </div>
          </div>

          {node.children && node.children.length > 0 && (
            <TreeRows
              nodes={node.children}
              depth={depth + 1}
              canEdit={canEdit}
              canDelete={canDelete}
              reorderingId={reorderingId}
              onMove={onMove}
              onAddChild={onAddChild}
              onReorderChildren={onReorderChildren}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      ))}
    </>
  );
}

export default function MenuItemsPage() {
  const { typeId = "" } = useParams<{ typeId: string }>();
  const canCreate = usePermission("create:menu");
  const canEdit = usePermission("update:menu");
  const canDelete = usePermission("delete:menu");

  const [formTarget, setFormTarget] = useState<MenuItem | null | undefined>(undefined);
  const [createParent, setCreateParent] = useState<ParentContext | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderParent, setReorderParent] = useState<TreeNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: menuTypeData } = useMenuType(typeId);
  const menuType = menuTypeData?.data;

  useEffect(() => {
    document.title = `${menuType ? `${menuType.name} Items` : "Menu Items"} | ${COMPANY_INFO.name} Admin`;
  }, [menuType]);

  const { data: treeData, isLoading, isError, isFetching, refetch } = useMenuItemTree(typeId);
  const tree = (treeData?.data ?? []) as TreeNode[];

  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem(formTarget?.id ?? "");
  const deleteItem = useDeleteMenuItem();
  const reorderItems = useReorderMenuItems();

  const closeForm = () => {
    setFormTarget(undefined);
    setCreateParent(null);
  };

  const openCreateRoot = () => {
    setCreateParent({ id: null, label: "Top level" });
    setFormTarget(null);
  };

  const openCreateChild = (parent: MenuItem) => {
    setCreateParent({ id: parent.id, label: parent.label });
    setFormTarget(null);
  };

  const handleFormSubmit = (values: CreateMenuItemDto | UpdateMenuItemDto) => {
    setError(null);
    if (formTarget) {
      updateItem.mutate(values as UpdateMenuItemDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    } else {
      createItem.mutate(values as CreateMenuItemDto, { onSuccess: closeForm, onError: (err) => setError(getErrorMessage(err)) });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    deleteItem.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (err) => {
        setError(getErrorMessage(err));
        setDeleteTarget(null);
      },
    });
  };

  const handleMove = (item: MenuItem, direction: "up" | "down", siblings: MenuItem[]) => {
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const ids = siblings.map((s) => s.id);
    [ids[idx], ids[swapIdx]] = [ids[swapIdx]!, ids[idx]!];
    setError(null);
    setReorderingId(item.id);
    reorderItems.mutate(
      { typeId, parentId: item.parentId, ids },
      {
        onError: (err) => setError(getErrorMessage(err)),
        onSettled: () => setReorderingId(null),
      },
    );
  };

  const handleSaveChildOrder = (ids: string[]) => {
    if (!reorderParent) return;
    setError(null);
    reorderItems.mutate(
      { typeId, parentId: reorderParent.id, ids },
      {
        onSuccess: () => setReorderParent(null),
        onError: (err) => setError(getErrorMessage(err)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={menuType ? `Menu Items — ${menuType.name}` : "Menu Items"}
        action={
          <div className="flex items-center gap-2">
            <Link to={PATHS.MENU_TYPES} className="text-sm font-medium text-gray-500 hover:text-gray-700">
              ← Back to Menus
            </Link>
            <RefreshButton isFetching={isFetching} onRefresh={refetch} />
            {canCreate && <Button onClick={openCreateRoot}>+ Add Top-Level Item</Button>}
          </div>
        }
      />

      {isError && <Alert variant="error" message="Failed to load menu items." />}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <PageCard padding="sm">
        {isLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-gray-500">No items in this menu yet.</p>
            {canCreate && <Button onClick={openCreateRoot}>+ Add Top-Level Item</Button>}
          </div>
        ) : (
          <TreeRows
            nodes={tree}
            depth={0}
            canEdit={canEdit}
            canDelete={canDelete}
            reorderingId={reorderingId}
            onMove={handleMove}
            onAddChild={openCreateChild}
            onReorderChildren={setReorderParent}
            onEdit={setFormTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </PageCard>

      {(formTarget !== undefined) && (
        <MenuItemFormDrawer
          key={formTarget?.id ?? `new-${createParent?.id ?? "root"}`}
          isOpen
          onClose={closeForm}
          typeId={typeId}
          item={formTarget}
          parentContext={createParent}
          onSubmit={handleFormSubmit}
          isLoading={createItem.isPending || updateItem.isPending}
        />
      )}

      {reorderParent && (
        <ReorderDrawer
          key={reorderParent.id}
          title={`Reorder — ${reorderParent.label}`}
          items={reorderParent.children ?? []}
          onClose={() => setReorderParent(null)}
          onSave={handleSaveChildOrder}
          isSaving={reorderItems.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteTarget?.label}"? This cannot be undone. Items with children can't be deleted until the children are removed first.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteItem.isPending}
      />
    </div>
  );
}
