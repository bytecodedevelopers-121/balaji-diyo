import type { BookingPackageRef } from "./booking";

export type PaymentGateway = "NABIL" | "HBL" | "NICA" | "PACO";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface Payment {
  id: string;
  gateway: PaymentGateway;
  packageId: string | null;
  package: BookingPackageRef | null;
  customTitle: string | null;
  customerName: string | null;
  customerEmail: string | null;
  description: string | null;
  percentage: number | null;
  /** Decimal — serialized as a numeric string over the API. */
  totalAmount: string | number;
  status: PaymentStatus;
  gatewayReference: string | null;
  gatewayTransactionId: string | null;
  gatewaySignature: string | null;
  gatewaySessionId: string | null;
  requestPayload: unknown;
  responsePayload: unknown;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreatePaymentDto {
  gateway: PaymentGateway;
  packageId?: string;
  customTitle?: string;
  customerName?: string;
  customerEmail?: string;
  description?: string;
  percentage?: number;
  totalAmount: number;
  status?: PaymentStatus;
  gatewayReference?: string;
  gatewayTransactionId?: string;
}

export interface UpdatePaymentStatusDto {
  status: PaymentStatus;
  gatewayReference?: string;
  gatewayTransactionId?: string;
}
