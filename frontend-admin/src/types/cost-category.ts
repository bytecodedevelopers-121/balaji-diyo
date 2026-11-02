export type CostCategoryType = "INCLUDE" | "EXCLUDE";

export interface CostCategory {
  id: string;
  name: string;
  type: CostCategoryType;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CostCategoryFormValues {
  name: string;
  type: CostCategoryType;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * Icon keys an admin can pick — kept in sync by hand with the public site's
 * `ICONS_BY_KEY` map (frontend `InclusionsSection.tsx`).
 */
export const COST_CATEGORY_ICONS = [
  { value: "transportation", label: "Transportation (bus)" },
  { value: "accommodation", label: "Accommodation (hotel)" },
  { value: "food", label: "Food" },
  { value: "guide", label: "Guide & porter (people)" },
  { value: "permits", label: "Permits (signpost)" },
  { value: "gear", label: "Gear (hiker)" },
  { value: "document", label: "Documents" },
  { value: "id-card", label: "ID / visa" },
  { value: "health", label: "Health & safety" },
  { value: "map", label: "Maps" },
  { value: "info", label: "General info" },
];
