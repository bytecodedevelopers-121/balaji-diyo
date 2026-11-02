import type { BookingPackageRef } from "./booking";

export interface CustomTraveller {
  id: string;
  customBookingId: string;
  fullName: string;
  gender: string;
  email: string;
  dateOfBirth: string | null;
  nationality: string;
  countryCode: string;
  mobileNumber: string | null;
  passportNo: string | null;
  passportImage: string | null;
  isLead: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CustomBooking {
  id: string;
  packageId: string;
  package: BookingPackageRef;
  startDate: string;
  endDate: string | null;
  numberOfTraveller: number;
  arrivalDate: string | null;
  arrivalFlightNo: string | null;
  airportPickup: boolean;
  departureDate: string | null;
  departureFlightNo: string | null;
  airportDropoff: boolean;
  travelInsurance: boolean;
  findingUs: string | null;
  specialRequirement: string | null;
  ipAddress: string | null;
  travellers: CustomTraveller[];
  createdAt: string;
  updatedAt: string;
}
