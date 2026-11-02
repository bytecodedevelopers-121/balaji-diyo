import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { globalSettingService, type GlobalSettingListParams } from "@/services/globalSetting.service";
import type { UpdateGlobalSettingDto } from "@/types/global-setting";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useGlobalSettings = (params?: GlobalSettingListParams) =>
  useQuery({
    queryKey: queryKeys.globalSettings.list(params),
    queryFn: () => globalSettingService.getAll(params),
  });

export const useCreateGlobalSetting = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: globalSettingService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.globalSettings.all }),
  });
};

export const useUpdateGlobalSetting = (id: string) => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (data: UpdateGlobalSettingDto) => globalSettingService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.globalSettings.all }),
  });
};

export const useDeleteGlobalSetting = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => globalSettingService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.globalSettings.all }),
  });
};
