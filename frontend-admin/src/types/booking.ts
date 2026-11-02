export interface BookingPackageRef {
  id: string;
  title: string;
}

export interface Traveller {
  id: string;
  bookingId: string;
  fullName: string;
  gender: string | null;
  email: string;
  dateOfBirth: string | null;
  nationality: string;
  countryCode: string;
  mobileNumber: string | null;
  passportNo: string | null;
  passportImage: string | null;
  photo: string | null;
  isLead: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Invoice {
  id: string;
  bookingId: string;
  /** Decimal — serialized as a numeric string over the API. */
  invoiceAmount: string | number;
  invoicePayType: string;
  invoiceStatus: number;
  invoiceNote: string | null;
  transactionCode: string;
  createdAt: string;
}

export interface BookingPayment {
  id: string;
  gateway: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  /** Decimal — serialized as a numeric string over the API. */
  totalAmount: string | number;
  percentage: number | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  /** Auto-incrementing number backing the customer-facing "BA-<number>"
   *  code (2026-09-07 direct client request) — format it with that
   *  prefix wherever it's shown; the raw number is what's stored. */
  bookingNumber: number;
  packageId: string | null;
  package: BookingPackageRef | null;
  startDate: string;
  endDate: string;
  numberOfTraveller: number;
  fullName: string;
  email: string;
  dateOfBirth: string | null;
  nationality: string;
  countryCode: string;
  mobileNumber: string | null;
  pickupDetails: string | null;
  paymentOptions: string;
  /** Decimal — serialized as a numeric string over the API. */
  totalPrice: string | number;
  payablePercentage: number | null;
  ipAddress: string | null;
  travellers: Traveller[];
  invoice: Invoice | null;
  payments: BookingPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  invoiceAmount: number;
  invoicePayType: string;
  invoiceStatus: number;
  invoiceNote?: string;
  transactionCode: string;
}
