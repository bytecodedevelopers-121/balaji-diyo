/**
 * Booking creation payload — maps to the backend's Booking module
 * (backend/src/modules/booking), mounted at `POST /bookings`
 * (backend/src/modules/booking/dto/create-booking.dto.ts).
 *
 * `packageId` is the real backend package id (`PackageDetail.id`, see
 * `src/app/[slug]/data.ts`) — sent by `CheckoutView`'s `handleSubmit`
 * once the detail page's trip data comes from the real API.
 */
export interface CreateBookingPayload {
  packageId?: string;
  startDate: string;
  endDate: string;
  numberOfTraveller: number;
  fullName: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  countryCode: string;
  mobileNumber?: string;
  pickupDetails?: string;
  paymentOptions: string;
  totalPrice: number;
  payablePercentage?: number;
  /** Cloudflare Turnstile token from CheckoutView's Captcha widget — verified by the backend's `verifyCaptcha` guard, a no-op there until TURNSTILE_SECRET_KEY is set. */
  captchaToken?: string;
}

export interface CreateBookingResult {
  id: string;
  /** Human-readable "BA-<number>" reference, shown to the customer —
   *  the number itself, not pre-formatted with the prefix (see
   *  `Booking.bookingNumber`'s own backend schema comment). */
  bookingNumber: number;
  [key: string]: unknown;
}

/**
 * A single entry in the `POST /bookings/:id/travellers` follow-up call
 * (backend/src/modules/booking/dto/add-travellers.dto.ts) — CheckoutView
 * chains one of these (the lead traveler, `isLead: true`) right after
 * `POST /bookings` succeeds, but only when there's a passport scan or a
 * gender to attach: `dateOfBirth` already lives directly on
 * `CreateBookingPayload` above, so this call exists solely to carry the
 * two fields the booking's own DTO has no field for — `passportImage`
 * (the `path` returned by `POST /files/upload/passport`) and `gender`.
 */
export interface AddTravellerPayload {
  fullName: string;
  gender?: string;
  email: string;
  nationality: string;
  countryCode: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  /** Passport number — free text, the backend stores it as-is (`Traveller.passportNo`). */
  passportNo?: string;
  passportImage?: string;
  /**
   * The traveller's own personal photo — a separate upload from
   * `passportImage` (the passport document scan itself), saved via
   * `POST /files/upload/photo` the same way `passportImage` comes from
   * `POST /files/upload/passport` (`Traveller.photo` on the backend).
   */
  photo?: string;
  isLead?: boolean;
}
