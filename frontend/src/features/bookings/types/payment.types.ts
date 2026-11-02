/**
 * PACO checkout-initiation payload — maps to the backend's Payment module
 * (backend/src/modules/payment), mounted at `POST /payments/paco/checkout`
 * (backend/src/modules/payment/dto/initiate-paco-payment.dto.ts).
 *
 * Live-verified against the real PACO/2c2p production API this session —
 * a real request returns a real `paymentUrl` (the hosted checkout page to
 * redirect the browser to), not a mock/sandbox shape.
 */
export interface InitiatePacoCheckoutPayload {
  /** The booking this payment belongs to, so the admin can see its payment status. */
  bookingId?: string;
  packageId?: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  description?: string;
  percentage?: number;
  /** `/online-payment` only — no Booking behind it, so the backend emails the customer a payment-request confirmation itself. */
  standalone?: boolean;
}

export interface InitiatePacoCheckoutResult {
  paymentUrl: string;
  payment: { id: string; [key: string]: unknown };
}
