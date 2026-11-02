import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { serviceService, type ServiceListParams } from "@/services/service.service";
import type { ServiceFormValues, ServiceSectionConfigFormValues } from "@/types/service";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useServices = (params?: ServiceListParams) =>
  useQuery({ queryKey: queryKeys.services.list(params), queryFn: () => serviceService.getAll(params) });

export const useServiceSectionConfig = () =>
  useQuery({ queryKey: queryKeys.services.config, queryFn: serviceService.getSectionConfig });

export const useUpdateServiceSectionConfig = () => {
  const queryClient = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: ServiceSectionConfigFormValues) => serviceService.updateSectionConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.config });
    },
  });
};

export const useService = (id: string) =>
  useQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => serviceService.getById(id),
    enabled: Boolean(id),
  });

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useSafeMutation({
    mutationFn: serviceService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.services.all }),
  });
};

export const useUpdateService = (id: string) => {
  const queryClient = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: Partial<ServiceFormValues>) => serviceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.services.detail(id) });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useSafeMutation({
    mutationFn: serviceService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.services.all }),
  });
};
