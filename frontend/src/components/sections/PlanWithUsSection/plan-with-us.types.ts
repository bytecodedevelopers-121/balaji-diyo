export interface PlanWithUsFormState {
  destinationId: string;
  experienceIds: string[];
  groupSize: number;
  tripDuration: number;
  departureDate: string;
  budgetRange: string;
  accommodationId: string;
  fullName: string;
  email: string;
  phone: string;
  residenceCountry: string;
  additionalPreferences: string;
}

export const INITIAL_PLAN_WITH_US_STATE: PlanWithUsFormState = {
  destinationId: "nepal",
  experienceIds: [],
  groupSize: 1,
  tripDuration: 1,
  departureDate: "",
  budgetRange: "",
  accommodationId: "basic",
  fullName: "",
  email: "",
  phone: "",
  residenceCountry: "",
  additionalPreferences: "",
};
