import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { contactService, type ContactListAdminParams } from "@/services/contact.service";
import { useSafeMutation } from "@/hooks/useSafeMutation";

export const useContacts = (params?: ContactListAdminParams) =>
  useQuery({
    queryKey: queryKeys.contacts.adminList(params),
    queryFn: () => contactService.getAll(params),
  });

export const useMarkContactRead = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => contactService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  });
};

export const useMarkContactUnread = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => contactService.markUnread(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (id: string) => contactService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  });
};

export const useBulkDeleteContacts = () => {
  const qc = useQueryClient();
  return useSafeMutation({
    mutationFn: (ids: string[]) => contactService.bulkRemove(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  });
};
