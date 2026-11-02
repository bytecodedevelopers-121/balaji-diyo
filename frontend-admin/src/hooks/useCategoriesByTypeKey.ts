import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { categoryService } from "@/services/category.service";
import { useCategoryTypes } from "@/hooks/queries/useCategoryTypes";

export interface CategoryOption {
  value: string;
  label: string;
}

/**
 * Resolves the CategoryType with the given `key` and lists its Categories as
 * `{value, label}` options — the "scoped taxonomy" pattern used throughout
 * (Blog → "blog", GroupFAQ/Package.faqCategories → "faq-group", TeamMember →
 * "team", Package's classification fields → "destination"/"grade"/etc.).
 *
 * `categoryType` is `undefined` when no CategoryType with that key exists yet;
 * callers should show a "create one under Category Types first" fallback in
 * that case rather than rendering an empty picker. The categories query is
 * gated on the type actually resolving, so it never fires an unscoped
 * "all categories" fetch while `categoryType` is still loading.
 */
export function useCategoriesByTypeKey(key: string) {
  const { data: typesData, isLoading: isLoadingTypes } = useCategoryTypes({ perPage: 100 });
  const categoryType = (typesData?.data.items ?? []).find((t) => t.key === key);

  const params = { typeId: categoryType?.id, perPage: 200 };
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoryService.getAll(params),
    enabled: !!categoryType,
  });
  const options: CategoryOption[] = (categoriesData?.data.items ?? []).map((c) => ({ value: c.id, label: c.title }));

  return {
    categoryType,
    options,
    isLoading: isLoadingTypes || (!!categoryType && isLoadingCategories),
  };
}
