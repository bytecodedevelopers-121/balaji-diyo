import api from "@/lib/axios";
import type { ApiResponse } from "@/types/api.types";
import type { Itinerary, ItineraryFormValues } from "@/types/itinerary";

export const itineraryService = {
  // 404s when the package has no itinerary yet — callers should treat that
  // as "not created yet", not a hard error (see useItineraryByPackageId).
  getByPackageId: (packageId: string) =>
    api.get<ApiResponse<Itinerary>>(`/itineraries/package/${packageId}`).then((r) => r.data),

  create: (data: ItineraryFormValues) => api.post<ApiResponse<Itinerary>>("/itineraries", data).then((r) => r.data),

  update: (id: string, data: Partial<Omit<ItineraryFormValues, "packageId">>) =>
    api.patch<ApiResponse<Itinerary>>(`/itineraries/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete<ApiResponse<null>>(`/itineraries/${id}`).then((r) => r.data),
};
