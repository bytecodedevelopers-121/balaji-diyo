import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

const OFFLINE_MESSAGE = "You are offline. This action is not available.";

/**
 * Wraps useMutation — refuses to run the mutation while offline (shows an
 * alert instead) so writes never silently queue or hang. Same interface as
 * useMutation; use this everywhere instead of calling useMutation directly.
 */
export function useSafeMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    mutationFn: async (variables, context) => {
      if (!navigator.onLine) {
        window.alert(OFFLINE_MESSAGE);
        throw new Error(OFFLINE_MESSAGE);
      }

      if (!options.mutationFn) {
        throw new Error("useSafeMutation requires a mutationFn");
      }

      return options.mutationFn(variables, context);
    },
  });
}
