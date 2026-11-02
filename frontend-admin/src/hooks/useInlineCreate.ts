import { useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/apiError";

export interface CreatedOption {
  value: string;
  label: string;
}

/**
 * Wires a create-mutation up to an inline "+ Create New" drawer opened from
 * inside a relation picker (MultiSelectTags/CreatableSelect's `create` prop).
 * Open/close state is owned by the picker itself (it controls the sentinel
 * option); this hook only owns the mutation's error state and maps the
 * created record to `{value, label}`.
 *
 * Call this once per picker at the top of the form (hooks can't be called
 * from inside the `create.render` callback — that runs inside the picker's
 * own render, not the form's). The render callback then just closes over the
 * returned object:
 *
 * ```tsx
 * const authorCreate = useInlineCreate(useCreateBlogAuthor(), (res) => ({ value: res.data.id, label: res.data.name }));
 * ...
 * create={{ label: "Author", render: ({isOpen, onClose, onCreated}) => (
 *   <BlogAuthorFormDrawer isOpen={isOpen} onClose={onClose} onSubmit={(data) => authorCreate.submit(data, onCreated)}
 *     isLoading={authorCreate.isLoading} error={authorCreate.error} onDismissError={authorCreate.clearError} />
 * )}}
 * ```
 */
export function useInlineCreate<TData, TVars>(
  mutation: UseMutationResult<TData, unknown, TVars>,
  toOption: (data: TData) => CreatedOption,
) {
  const [error, setError] = useState<string | null>(null);

  const submit = (vars: TVars, onCreated: (option: CreatedOption) => void) => {
    setError(null);
    mutation.mutate(vars, {
      onSuccess: (data) => onCreated(toOption(data)),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return { error, submit, isLoading: mutation.isPending, clearError: () => setError(null) };
}
